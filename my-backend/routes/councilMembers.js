const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity, autoEndTerms } = require('../helpers/logger')

// GET /api/sb-council-members
router.get('/', async (req, res) => {
  try {
    await autoEndTerms()
    const { data, error } = await supabase
      .from('sb_council_members')
      .select(`
        *,
        sb_council_member_terms (
          id, term_period, term_start, term_end, status, is_reelected, notes, created_at
        )
      `)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })

    const enriched = data.map(member => {
      const terms = member.sb_council_member_terms || []
      const sorted = [...terms].sort((a, b) => new Date(b.term_start) - new Date(a.term_start))
      const activeTerm = sorted.find(t => t.status === 'active') || sorted[0] || null
      return {
        ...member,
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
    const { data, error } = await supabase
      .from('sb_council_members')
      .select(`
        *,
        sb_council_member_terms (
          id, term_period, term_start, term_end, status, is_reelected, notes, created_at
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
  const { full_name, position, term_period, term_start, term_end, is_reelected, notes } = req.body
  if (!full_name || !position)
    return res.status(400).json({ error: 'Full name and position are required.' })
  try {
    let photo = null
    let photo_path = null
    if (req.file) {
      const { fileName, publicUrl } = await uploadToStorage(req.file, 'council-members')
      photo = publicUrl
      photo_path = fileName
    }
    const { data: member, error: memberErr } = await supabase
      .from('sb_council_members')
      .insert({ full_name, position, photo, photo_path })
      .select().single()
    if (memberErr) return res.status(500).json({ error: memberErr.message })

    if (term_period && term_start) {
      const { error: termErr } = await supabase
        .from('sb_council_member_terms')
        .insert({
          council_member_id: member.id,
          term_period,
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
  const { full_name, position } = req.body
  if (!full_name || !position)
    return res.status(400).json({ error: 'Full name and position are required.' })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('sb_council_members').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Council member not found.' })

    const updateData = { full_name, position }
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
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: member } = await supabase
      .from('sb_council_members')
      .select('photo_path, full_name')
      .eq('id', req.params.id).single()
    if (!member) return res.status(404).json({ error: 'Council member not found.' })
    if (member.photo_path) await deleteFromStorage(member.photo_path)
    const { error } = await supabase.from('sb_council_members').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'DELETE', 'Officials', `Deleted council member: ${member.full_name}`)
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
  const { term_period, term_start, term_end, is_reelected, notes } = req.body
  if (!term_period || !term_start)
    return res.status(400).json({ error: 'term_period and term_start are required.' })
  try {
    const { data: member, error: mErr } = await supabase
      .from('sb_council_members').select('id, full_name').eq('id', id).single()
    if (mErr || !member) return res.status(404).json({ error: 'Council member not found.' })

    const { data, error } = await supabase
      .from('sb_council_member_terms')
      .insert({
        council_member_id: id,
        term_period,
        term_start,
        term_end: term_end || null,
        status: 'active',
        is_reelected: is_reelected === true || is_reelected === 'true',
        notes: notes || null,
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })

    await logActivity(req, 'CREATE', 'Officials', `Added term for: ${member.full_name} (${term_period})`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/sb-council-members/:memberId/terms/:termId
router.put('/:memberId/terms/:termId', verifyToken, adminOnly, async (req, res) => {
  const { memberId, termId } = req.params
  const { term_period, term_start, term_end, status, is_reelected, notes } = req.body
  if (!term_period || !term_start)
    return res.status(400).json({ error: 'term_period and term_start are required.' })
  if (status && !['active', 'terms_ended'].includes(status))
    return res.status(400).json({ error: 'status must be active or terms_ended.' })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('sb_council_member_terms')
      .select('id').eq('id', termId).eq('council_member_id', memberId).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Term not found.' })

    const { data, error } = await supabase
      .from('sb_council_member_terms')
      .update({
        term_period,
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
