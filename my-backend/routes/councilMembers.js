const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, adminOnly, secretaryOnly } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity, autoEndTerms } = require('../helpers/logger')
const {
  resolveCouncilId,
  SINGULAR_POSITIONS,
  COUNCILOR_SEAT_CAP,
  findSingularPositionConflict,
  countActiveCouncilors,
  autoUpdateCouncilStatuses,
} = require('../helpers/councils')

// GET /api/sb-council-members
router.get('/', async (req, res) => {
  try {
    await autoEndTerms()
    await autoUpdateCouncilStatuses()
    const { data, error } = await supabase
      .from('sb_council_members')
      .select(`
        *,
        sb_council_member_terms (
          id, term_period, term_start, term_end, status, is_reelected, notes, created_at,
          council_id, position,
          council:councils ( id, term_label, status )
        )
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })

    const enriched = data.map(member => {
      const terms = member.sb_council_member_terms || []
      const sorted = [...terms].sort((a, b) => new Date(b.term_start) - new Date(a.term_start))
      const activeTerm = sorted.find(t => t.status === 'active') || sorted[0] || null
      return {
        ...member,
        // Overrides the now-frozen legacy sb_council_members.position column
        // (see 002_add_council_id_and_position_to_terms.sql) with the
        // current term's position, so nothing accidentally reads stale data.
        position: activeTerm?.position || null,
        sb_council_member_terms: undefined,
        terms: sorted,
        active_term: activeTerm,
        term_period: activeTerm?.term_period || null,
        term_status: activeTerm?.status || null,
      }
    })
    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/sb-council-members/:id
router.get('/:id', async (req, res) => {
  try {
    await autoEndTerms()
    await autoUpdateCouncilStatuses()
    const { data, error } = await supabase
      .from('sb_council_members')
      .select(`
        *,
        sb_council_member_terms (
          id, term_period, term_start, term_end, status, is_reelected, notes, created_at,
          council_id, position,
          council:councils ( id, term_label, status )
        )
      `)
      .eq('id', req.params.id)
      .single()
    if (error) return res.status(500).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'Council member not found.' })

    const terms = data.sb_council_member_terms || []
    const sorted = [...terms].sort((a, b) => new Date(b.term_start) - new Date(a.term_start))
    const activeTerm = sorted.find(t => t.status === 'active') || sorted[0] || null

    res.json({
      ...data,
      position: activeTerm?.position || null,
      sb_council_member_terms: undefined,
      terms: sorted,
      active_term: activeTerm,
      term_period: activeTerm?.term_period || null,
      term_status: activeTerm?.status || null,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sb-council-members/add
router.post('/add', verifyToken, adminOnly, upload.single('photo'), handleMulterError, async (req, res) => {
  const { full_name, position, term_period, term_start, term_end, is_reelected, notes, force } = req.body
  if (!full_name)
    return res.status(400).json({ error: 'Full name is required.' })
  // position is now a per-term attribute (see 002_add_council_id_and_...
  // migration) — it only means anything alongside the term it belongs to,
  // so require all three together, or none at all (member added with no
  // term yet, position added later via "+ Add Term").
  if ((term_period || term_start) && (!term_period || !term_start || !position))
    return res.status(400).json({ error: 'Term period, start date, and position are required together.' })
  try {
    // Same singular-position / Councilor-seat-cap rules as POST/PUT
    // .../terms — validated here too, and before creating anything, since
    // this route can also place a brand-new member straight into a
    // conflicting seat via its bundled initial term.
    let council_id = null
    if (term_period && term_start) {
      council_id = await resolveCouncilId(term_period)

      const conflict = await findSingularPositionConflict({ councilId: council_id, position })
      if (conflict) {
        return res.status(409).json({
          error: `${position} is already held by ${conflict.sb_council_members?.full_name || 'another member'} for this council.`,
        })
      }
      if (position === 'Councilor' && !force) {
        const currentCount = await countActiveCouncilors({ councilId: council_id })
        if (currentCount >= COUNCILOR_SEAT_CAP) {
          return res.status(409).json({
            error: `This council already has ${currentCount} active Councilor${currentCount === 1 ? '' : 's'} (typical cap: ${COUNCILOR_SEAT_CAP}). Resubmit with force:true if this is intentional.`,
            seatCapExceeded: true,
          })
        }
      }
    }

    let photo = null
    let photo_path = null
    if (req.file) {
      const { fileName, publicUrl } = await uploadToStorage(req.file, 'council-members')
      photo = publicUrl
      photo_path = fileName
    }
    const { data: member, error: memberErr } = await supabase
      .from('sb_council_members')
      .insert({ full_name, photo, photo_path })
      .select().single()
    if (memberErr) return res.status(500).json({ error: memberErr.message })

    if (term_period && term_start) {
      const { error: termErr } = await supabase
        .from('sb_council_member_terms')
        .insert({
          council_member_id: member.id,
          council_id,
          term_period,
          position,
          term_start,
          term_end: term_end || null,
          status: 'active',
          is_reelected: is_reelected === 'true' || is_reelected === true,
          notes: notes || null,
        })
      if (termErr) console.error('Term insert error:', termErr.message)
    }
    await logActivity(req, 'CREATE', 'Officials', `Added council member: ${full_name}`)
    res.json({ success: true, id: member.id, data: member })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/sb-council-members/:id
router.put('/:id', verifyToken, adminOnly, upload.single('photo'), handleMulterError, async (req, res) => {
  const { id } = req.params
  const { full_name } = req.body
  if (!full_name)
    return res.status(400).json({ error: 'Full name is required.' })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('sb_council_members').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Council member not found.' })

    const updateData = { full_name }
    if (req.file) {
      if (existing.photo_path) await deleteFromStorage(existing.photo_path)
      const { fileName, publicUrl } = await uploadToStorage(req.file, 'council-members')
      updateData.photo = publicUrl
      updateData.photo_path = fileName
    }
    const { data, error } = await supabase
      .from('sb_council_members').update(updateData).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })

    await logActivity(req, 'UPDATE', 'Officials', `Updated council member: ${full_name}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/sb-council-members/:id
// Archives the council member instead of a hard delete: the row stays in place
// (so already-published ordinances/resolutions keep showing their name/photo)
// and is just hidden from active lists and "select author" pickers.
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: member } = await supabase
      .from('sb_council_members')
      .select('id, full_name')
      .eq('id', req.params.id).single()
    if (!member) return res.status(404).json({ error: 'Council member not found.' })
    const { error } = await supabase
      .from('sb_council_members')
      .update({ is_archived: true, archived_at: new Date().toISOString(), archived_by: req.user.id })
      .eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'ARCHIVE', 'Officials', `Archived council member: ${member.full_name}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/sb-council-members/:id/restore
// Only reachable from the Archives page, which is secretary-gated on the
// frontend (canViewArchives) — secretaryOnly here closes the gap where any
// admin-role account could otherwise call this directly.
router.put('/:id/restore', verifyToken, adminOnly, secretaryOnly, async (req, res) => {
  try {
    const { data: member } = await supabase
      .from('sb_council_members').select('id, full_name').eq('id', req.params.id).single()
    if (!member) return res.status(404).json({ error: 'Council member not found.' })
    const { error } = await supabase
      .from('sb_council_members')
      .update({ is_archived: false, archived_at: null, archived_by: null })
      .eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'RESTORE', 'Officials', `Restored council member: ${member.full_name}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ---- TERMS ----

// GET /api/sb-council-members/:id/terms
router.get('/:id/terms', async (req, res) => {
  try {
    await autoEndTerms()
    const { data, error } = await supabase
      .from('sb_council_member_terms')
      .select('*')
      .eq('council_member_id', req.params.id)
      .order('term_start', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sb-council-members/:id/terms
router.post('/:id/terms', verifyToken, adminOnly, async (req, res) => {
  const { id } = req.params
  const { term_period, term_start, term_end, status, position, is_reelected, notes, force } = req.body
  if (!term_period || !term_start)
    return res.status(400).json({ error: 'term_period and term_start are required.' })
  if (status && !['active', 'terms_ended'].includes(status))
    return res.status(400).json({ error: 'status must be active or terms_ended.' })
  try {
    const { data: member, error: mErr } = await supabase
      .from('sb_council_members').select('id, full_name').eq('id', id).single()
    if (mErr || !member) return res.status(404).json({ error: 'Council member not found.' })

    const council_id = await resolveCouncilId(term_period)
    const resolvedStatus = status || 'active'

    // Validate BEFORE mutating anything below — these checks used to run
    // after the auto-close loop, which meant a rejected request could still
    // leave the member's previous term closed with no new one to replace
    // it (worse than before the request). Order matters here.
    if (resolvedStatus === 'active') {
      // Vice Mayor / Liga President / SK Federated President are singular by
      // law — mirrors migrations/005's DB-level constraint so a conflict
      // surfaces as a clean error here instead of a raw constraint violation.
      const conflict = await findSingularPositionConflict({ councilId: council_id, position, excludeMemberId: id })
      if (conflict) {
        return res.status(409).json({
          error: `${position} is already held by ${conflict.sb_council_members?.full_name || 'another member'} for this council.`,
        })
      }

      // Councilor is multi-seat, so this is a soft cap, not a hard rule —
      // pass force:true in the request body to add beyond it anyway (e.g. a
      // contested seat under recount, a holdover pending a court ruling).
      if (position === 'Councilor' && !force) {
        const currentCount = await countActiveCouncilors({ councilId: council_id, excludeMemberId: id })
        if (currentCount >= COUNCILOR_SEAT_CAP) {
          return res.status(409).json({
            error: `This council already has ${currentCount} active Councilor${currentCount === 1 ? '' : 's'} (typical cap: ${COUNCILOR_SEAT_CAP}). Resubmit with force:true if this is intentional.`,
            seatCapExceeded: true,
          })
        }
      }
    }

    // A member can only be serving one term at a time. Backfilling a past
    // (terms_ended) term shouldn't touch anything else, but starting a new
    // *active* term — typically a re-election — must close out whatever
    // term they were still marked active on, or both would show as
    // "Active" across council groups indefinitely (autoEndTerms only closes
    // terms with a past term_end, so a still-open one never self-corrects).
    let closedCount = 0
    if (resolvedStatus === 'active') {
      const { data: openTerms, error: openErr } = await supabase
        .from('sb_council_member_terms')
        .select('id, term_end')
        .eq('council_member_id', id)
        .eq('status', 'active')
      if (openErr) return res.status(500).json({ error: openErr.message })
      for (const t of openTerms || []) {
        const { error: closeErr } = await supabase
          .from('sb_council_member_terms')
          .update({ term_end: t.term_end || term_start, status: 'terms_ended' })
          .eq('id', t.id)
        if (closeErr) return res.status(500).json({ error: closeErr.message })
        closedCount++
      }
    }

    const { data, error } = await supabase
      .from('sb_council_member_terms')
      .insert({
        council_member_id: id,
        council_id,
        term_period,
        position: position || null,
        term_start,
        term_end: term_end || null,
        status: resolvedStatus,
        is_reelected: is_reelected === true || is_reelected === 'true',
        notes: notes || null,
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })

    const closedNote = closedCount > 0 ? ` (auto-closed ${closedCount} prior active term${closedCount > 1 ? 's' : ''})` : ''
    await logActivity(req, 'CREATE', 'Officials', `Added term for: ${member.full_name} (${term_period})${closedNote}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/sb-council-members/:memberId/terms/:termId
router.put('/:memberId/terms/:termId', verifyToken, adminOnly, async (req, res) => {
  const { memberId, termId } = req.params
  const { term_period, term_start, term_end, status, position, is_reelected, notes, force } = req.body
  if (!term_period || !term_start)
    return res.status(400).json({ error: 'term_period and term_start are required.' })
  if (status && !['active', 'terms_ended'].includes(status))
    return res.status(400).json({ error: 'status must be active or terms_ended.' })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('sb_council_member_terms')
      .select('id').eq('id', termId).eq('council_member_id', memberId).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Term not found.' })

    const council_id = await resolveCouncilId(term_period)
    const resolvedStatus = status || 'active'

    if (resolvedStatus === 'active') {
      // Same rules as POST .../terms — see the comments there. excludeTermId
      // here (not excludeMemberId) since this route edits one term in place
      // rather than auto-closing a separate one.
      const conflict = await findSingularPositionConflict({ councilId: council_id, position, excludeTermId: termId })
      if (conflict) {
        return res.status(409).json({
          error: `${position} is already held by ${conflict.sb_council_members?.full_name || 'another member'} for this council.`,
        })
      }
      if (position === 'Councilor' && !force) {
        const currentCount = await countActiveCouncilors({ councilId: council_id, excludeTermId: termId })
        if (currentCount >= COUNCILOR_SEAT_CAP) {
          return res.status(409).json({
            error: `This council already has ${currentCount} active Councilor${currentCount === 1 ? '' : 's'} (typical cap: ${COUNCILOR_SEAT_CAP}). Resubmit with force:true if this is intentional.`,
            seatCapExceeded: true,
          })
        }
      }
    }

    const { data, error } = await supabase
      .from('sb_council_member_terms')
      .update({
        term_period,
        council_id,
        position: position || null,
        term_start,
        term_end: term_end || null,
        status: status || 'active',
        is_reelected: is_reelected === true || is_reelected === 'true',
        notes: notes || null,
      })
      .eq('id', termId)
      .select().single()
    if (error) return res.status(500).json({ error: error.message })

    await logActivity(req, 'UPDATE', 'Officials', `Updated term ID ${termId} for member ID ${memberId}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/sb-council-members/:memberId/terms/:termId
router.delete('/:memberId/terms/:termId', verifyToken, adminOnly, async (req, res) => {
  const { memberId, termId } = req.params
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('sb_council_member_terms')
      .select('id, term_period').eq('id', termId).eq('council_member_id', memberId).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Term not found.' })

    const { error } = await supabase
      .from('sb_council_member_terms').delete().eq('id', termId)
    if (error) return res.status(500).json({ error: error.message })

    await logActivity(req, 'DELETE', 'Officials', `Deleted term "${existing.term_period}" for member ID ${memberId}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sb-council-members/run-auto-end-terms
router.post('/run-auto-end-terms', verifyToken, adminOnly, async (req, res) => {
  try {
    await autoEndTerms()
    await logActivity(req, 'UPDATE', 'Officials', 'Manually ran auto_end_terms')
    res.json({ success: true, message: 'auto_end_terms executed.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
