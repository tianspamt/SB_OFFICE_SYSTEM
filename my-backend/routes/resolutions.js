const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const os = require('os')
const Tesseract = require('tesseract.js')

const supabase = require('../config/supabase')
const { verifyToken, canCreateDraft, pendingEditors } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')
const { safeParseJSON, escapeHtml, canManageLegislativeRecord, canReplaceLegislativeFile, orIlikeClause, parseYearField, dayBoundsUTC } = require('../helpers/utils')
const { resolveCurrentTermId, findRecordIdsByAuthorName } = require('../helpers/officials')
const { createLegislativeReviewRoutes } = require('../helpers/legislativeReviewRoutes')

// Historical-accuracy note: `term.position` is the specific membership
// current when this official was linked (see resolveCurrentTermId and
// migrations/004). It's null only for a row that predates term_id (the
// person had zero terms at link time, so there was nothing to snapshot) —
// sb_council_members.position was dropped (migrations/006), so there's no
// further fallback for that edge case; it just shows no position.
const mapOfficials = (resolutionOfficials) =>
  (resolutionOfficials || [])
    .map((ro) => {
      const person = ro.sb_council_members
      if (!person) return null
      return {
        id: person.id,
        full_name: person.full_name,
        photo: person.photo,
        position: ro.term?.position || null,
      }
    })
    .filter(Boolean)

// ─── Helper: extract text based on file type ──────────────────────────────────
// PDFs and Word files are stored only — no extraction at upload time.
// Only images run through OCR here.
async function extractText(file) {
  const mime = file.mimetype
  const isImage = mime.startsWith('image/')

  if (isImage) {
    let tempPath = null
    try {
      tempPath = path.join(os.tmpdir(), `${Date.now()}-${file.originalname}`)
      fs.writeFileSync(tempPath, file.buffer)
      const { data: { text } } = await Tesseract.recognize(tempPath, 'eng')
      fs.unlinkSync(tempPath)
      return text.trim() || null
    } catch (err) {
      console.error('OCR extract error:', err.message)
      if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
      return null
    }
  }

  // PDF and Word files — no extraction, just store
  return null
}

// GET /api/resolutions
// Auth-gated — drafts/pending review copies live here alongside published
// ones. A caller that doesn't ask for a specific status gets published-only
// (matching content_posts' public-safe default); the review queues (see
// ResolutionsPage.jsx) pass an explicit status list to see drafts, and the
// admin dashboard's own counts/recent-activity view passes status=all to see
// every status without the caller having to enumerate them.
//
// Pagination is opt-in: pass both page and limit to get back
// { data, total, page, limit, totalPages } instead of a bare array. Existing
// callers that don't paginate (the pending queues, the dashboard's full-list
// fetch, PendingRecordsWidget) are unaffected.
router.get('/', verifyToken, async (req, res) => {
  try {
    const { year, search, category, author, date } = req.query

    // Author searches the real `officials` relation — see the same comment
    // in ordinances.js's GET / for why (and why not a single embedded-
    // resource filter).
    let authorResolutionIds = null
    if (author) {
      authorResolutionIds = await findRecordIdsByAuthorName('resolution_officials', 'resolution_id', author)
      if (authorResolutionIds.length === 0) {
        return res.json(req.query.page && req.query.limit
          ? { data: [], total: 0, page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20, totalPages: 1 }
          : [])
      }
    }

    let query = supabase
      .from('resolutions')
      .select(`*, resolution_officials (
        official_id, term_id,
        sb_council_members ( id, full_name, photo ),
        term:sb_council_member_terms ( id, position, term_period )
      )`, { count: 'exact' })
      .order('uploaded_at', { ascending: false })
    if (year) query = query.eq('year', year)
    if (search) query = query.or(`${orIlikeClause('title', search)},${orIlikeClause('resolution_number', search)}`)
    if (category && category !== 'All') query = query.eq('category', category)
    if (authorResolutionIds) query = query.in('id', authorResolutionIds)
    if (date) {
      const { start, end } = dayBoundsUTC(date)
      query = query.gte('uploaded_at', start).lt('uploaded_at', end)
    }
    if (req.query.status !== 'all') {
      const statuses = req.query.status ? req.query.status.split(',') : ['published']
      query = query.in('status', statuses)
    }
    const page = req.query.page ? Math.max(parseInt(req.query.page) || 1, 1) : null
    const limit = req.query.limit ? Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100) : null
    if (page && limit) query = query.range((page - 1) * limit, page * limit - 1)
    const { data, error, count } = await query
    if (error) return res.status(500).json({ error: error.message })
    const parsed = data.map(r => ({
      ...r,
      officials: mapOfficials(r.resolution_officials),
      resolution_officials: undefined
    }))
    if (page && limit) {
      return res.json({ data: parsed, total: count ?? parsed.length, page, limit, totalPages: Math.max(Math.ceil((count ?? parsed.length) / limit), 1) })
    }
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/resolutions/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resolutions')
      .select(`*, resolution_officials (
        official_id, term_id,
        sb_council_members ( id, full_name, photo ),
        term:sb_council_member_terms ( id, position, term_period )
      )`)
      .eq('id', req.params.id).single()
    if (error) return res.status(500).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'Resolution not found.' })
    const parsed = {
      ...data,
      officials: mapOfficials(data.resolution_officials),
      resolution_officials: undefined
    }
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/resolutions/upload
// Any of the four legislative positions can originate a draft — Secretary
// and Vice-Mayor sometimes draft directly rather than only reviewing/
// approving what Clerk/Councilor submit.
router.post('/upload', verifyToken, canCreateDraft, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  const { resolution_number, title, year, category, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })
  const { year: parsedYear, error: yearError } = parseYearField(year)
  if (yearError) return res.status(400).json({ error: yearError })
  const officialIds = safeParseJSON(officials, [])

  let fileName = null
  try {
    const extracted_text = await extractText(req.file)
    const uploadResult = await uploadToStorage(req.file, 'resolutions')
    fileName = uploadResult.fileName

    const { data: resolution, error } = await supabase
      .from('resolutions')
      .insert({
        resolution_number: resolution_number || null,
        title,
        year: parsedYear,
        category: category || null,
        filename: req.file.originalname,
        filetype: req.file.mimetype,
        filepath: fileName,
        extracted_text,
        status: 'pending'
      })
      .select().single()

    if (error) {
      await deleteFromStorage(fileName)
      return res.status(500).json({ error: error.message })
    }

    if (officialIds.length > 0) {
      const rows = await Promise.all(officialIds.map(async (oid) => ({
        resolution_id: resolution.id,
        official_id: oid,
        term_id: await resolveCurrentTermId(oid),
      })))
      const { error: relErr } = await supabase.from('resolution_officials').insert(rows)
      if (relErr) console.error('resolution_officials insert error:', relErr.message)
    }

    await logActivity(req, 'UPLOAD', 'Resolutions', `Uploaded resolution: ${title}`)
    res.json({ success: true, id: resolution.id, data: resolution })
  } catch (err) {
    console.error('Resolution upload error:', err)
    if (fileName) await deleteFromStorage(fileName)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/resolutions/:id
// Who may edit depends on which bucket the record is currently in — see
// canManageLegislativeRecord: Secretary/Clerk own it once published,
// Clerk/Councilor own everything before that.
router.put('/:id', verifyToken, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  const { resolution_number, title, year, category, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })
  const { year: parsedYear, error: yearError } = parseYearField(year)
  if (yearError) return res.status(400).json({ error: yearError })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('resolutions').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Resolution not found.' })
    if (!canManageLegislativeRecord(req.user.position, existing.status))
      return res.status(403).json({ error: 'You are not allowed to edit this resolution.' })
    const updateData = {
      resolution_number: resolution_number || null,
      title,
      year: parsedYear,
      category: category || null,
    }
    // A Clerk/Councilor edit on a rejected draft doubles as the resubmit —
    // it goes straight back into the Secretary's queue instead of requiring
    // a separate "resubmit" click.
    if (existing.status === 'needs_revision') updateData.status = 'pending'
    if (req.file) {
      if (existing.filepath) await deleteFromStorage(existing.filepath)
      const { fileName } = await uploadToStorage(req.file, 'resolutions')
      updateData.filename = req.file.originalname
      updateData.filetype = req.file.mimetype
      updateData.filepath = fileName
    }
    const { data: updated, error } = await supabase
      .from('resolutions').update(updateData).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    const officialIds = safeParseJSON(officials, [])
    // Diff against the existing links instead of blanket delete+reinsert on
    // every edit — see the same comment in ordinances.js's PUT /:id. An
    // official who stays selected keeps their row (and its historical
    // term_id snapshot) untouched; only actual removals/additions hit the DB.
    const { data: existingLinks } = await supabase
      .from('resolution_officials').select('official_id, term_id').eq('resolution_id', id)
    const existingIds = new Set((existingLinks || []).map(l => l.official_id))
    const newIds = new Set(officialIds)
    const toRemove = [...existingIds].filter(oid => !newIds.has(oid))
    const toAdd = [...newIds].filter(oid => !existingIds.has(oid))

    if (toRemove.length > 0) {
      await supabase.from('resolution_officials').delete().eq('resolution_id', id).in('official_id', toRemove)
    }
    if (toAdd.length > 0) {
      const rows = await Promise.all(toAdd.map(async (oid) => ({
        resolution_id: id,
        official_id: oid,
        term_id: await resolveCurrentTermId(oid),
      })))
      await supabase.from('resolution_officials').insert(rows)
    }
    await logActivity(req, 'UPDATE', 'Resolutions', `Updated resolution: ${title}`)
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/resolutions/:id/print
router.get('/:id/print', verifyToken, async (req, res) => {
  try {
    const { data: r, error } = await supabase
      .from('resolutions').select('*').eq('id', req.params.id).single()
    if (error || !r) return res.status(404).send('Not found')
    res.send(`<!DOCTYPE html><html><head><title>${escapeHtml(r.resolution_number || r.title)}</title>
      <style>
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Times New Roman',serif; max-width:850px; margin:0 auto; padding:48px 60px; color:#111; }
        .letterhead { display:flex; align-items:center; gap:28px; padding-bottom:18px; border-bottom:3px solid #000; margin-bottom:24px; }
        .letterhead img { width:90px; height:90px; object-fit:contain; }
        .republic { font-size:13px; font-style:italic; }
        .province { font-size:13.5px; font-weight:bold; text-transform:uppercase; }
        .municipality { font-size:15px; font-weight:900; text-transform:uppercase; letter-spacing:1px; }
        .office { font-size:14px; font-weight:bold; text-transform:uppercase; margin-top:8px; padding-top:8px; border-top:1px solid #bbb; }
        .doc-title { text-align:center; margin-bottom:20px; }
        .doc-title h2 { font-size:13px; color:#555; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px; }
        .doc-title h1 { font-size:19px; color:#1a365d; }
        .meta { text-align:center; font-size:13px; color:#555; margin-bottom:28px; border-bottom:2px solid #000; padding-bottom:14px; }
        .content { font-size:14px; line-height:1.8; white-space:pre-wrap; text-align:justify; }
        .footer { margin-top:60px; border-top:1px solid #cbd5e0; padding-top:14px; text-align:center; font-size:11px; color:#888; }
        .print-btn { position:fixed; top:20px; right:20px; padding:10px 20px; background:#1a365d; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; }
        @media print { .print-btn { display:none; } }
      </style></head><body>
      <button class="print-btn" onclick="window.print()">🖨 Print</button>
      <div class="letterhead">
        <img src="${process.env.LOGO_URL || ''}" alt="Seal" onerror="this.style.display='none'" />
        <div>
          <div class="republic">Republic of the Philippines</div>
          <div class="province">Province of Bohol</div>
          <div class="municipality">Municipality of Balilihan</div>
          <div class="office">Office of the Sangguniang Bayan</div>
        </div>
      </div>
      <div class="doc-title">
        ${r.resolution_number ? `<h2>${escapeHtml(r.resolution_number)}</h2>` : ''}
        <h1>${escapeHtml(r.title)}</h1>
      </div>
      <div class="meta">
        ${r.year ? `Year: ${escapeHtml(r.year)} &nbsp;|&nbsp;` : ''}
        Date: ${new Date(r.uploaded_at).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}
      </div>
      <div class="content">${escapeHtml(r.extracted_text) || 'No extracted text available for this resolution.'}</div>
      <div class="footer">Sangguniang Bayan of Balilihan, Bohol &nbsp;•&nbsp; Official Public Record</div>
    </body></html>`)
  } catch (err) {
    res.status(500).send('Server error')
  }
})

// ─── PUT /api/resolutions/:id/replace-file ────────────────────────────────────
// Clerk/Councilor are the primary drafters; Secretary keeps this as a
// fallback alongside their approve/reject authority rather than having to
// reject a draft just to fix something themselves. Overwrites the stored
// file and bumps revision_count.
router.put('/:id/replace-file', verifyToken, pendingEditors, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('resolutions').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Resolution not found.' })
    if (!canReplaceLegislativeFile(req.user.position, existing.status))
      return res.status(403).json({ error: 'You are not allowed to replace this file.' })

    const extracted_text = await extractText(req.file)
    const { fileName } = await uploadToStorage(req.file, 'resolutions')

    const updateData = {
      filename: req.file.originalname,
      filetype: req.file.mimetype,
      filepath: fileName,
      extracted_text,
      revision_count: (existing.revision_count || 0) + 1,
    }
    // Replacing the file on a rejected draft doubles as the resubmit — see
    // the same note on PUT /:id above.
    if (existing.status === 'needs_revision') updateData.status = 'pending'

    const { data, error } = await supabase
      .from('resolutions')
      .update(updateData)
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })

    if (existing.filepath) await deleteFromStorage(existing.filepath)

    await logActivity(req, 'REPLACE_FILE', 'Resolutions', `Replaced draft file for resolution: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Review workflow + archive: accept/request-changes/vm-approve/publish/
// DELETE — shared across ordinances/resolutions/session_minutes, see
// helpers/legislativeReviewRoutes.js.
router.use('/', createLegislativeReviewRoutes({
  table: 'resolutions',
  entityType: 'resolution',
  activityModule: 'Resolutions',
  singularLabel: 'Resolution',
  archiveRpc: 'archive_resolution',
  labelOf: (r) => r.title,
}))

module.exports = router
