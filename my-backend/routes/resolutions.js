const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const os = require('os')
const Tesseract = require('tesseract.js')

const supabase = require('../config/supabase')
const { verifyToken, adminOnly, secretaryOnly, secretaryOrClerk, clerkOnly, viceMayorOnly } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')
const { safeParseJSON } = require('../helpers/utils')
const { resolveCurrentTermId } = require('../helpers/officials')

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
router.get('/', async (req, res) => {
  try {
    const { year, search } = req.query
    let query = supabase
      .from('resolutions')
      .select(`*, resolution_officials (
        official_id, term_id,
        sb_council_members ( id, full_name, photo ),
        term:sb_council_member_terms ( id, position, term_period )
      )`)
      .order('uploaded_at', { ascending: false })
    if (year) query = query.eq('year', year)
    if (search) query = query.ilike('title', `%${search}%`)
    if (req.query.status) {
      const statuses = req.query.status.split(',')
      query = query.in('status', statuses)
    }
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    const parsed = data.map(r => ({
      ...r,
      officials: mapOfficials(r.resolution_officials),
      resolution_officials: undefined
    }))
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/resolutions/:id
router.get('/:id', async (req, res) => {
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
// POST /api/resolutions/upload
router.post('/upload', verifyToken, adminOnly, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  const { resolution_number, title, year, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })
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
        year: year ? parseInt(year) : null,
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
router.put('/:id', verifyToken, adminOnly, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  const { resolution_number, title, year, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('resolutions').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Resolution not found.' })
    const updateData = { resolution_number: resolution_number || null, title, year: year ? parseInt(year) : null }
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
    // Preserve term_id for officials who remain selected — see the same
    // comment in ordinances.js's PUT /:id for why (this route re-links on
    // every edit regardless of whether the officials list even changed).
    const { data: existingLinks } = await supabase
      .from('resolution_officials').select('official_id, term_id').eq('resolution_id', id)
    const existingTermByOfficial = new Map((existingLinks || []).map(l => [l.official_id, l.term_id]))

    await supabase.from('resolution_officials').delete().eq('resolution_id', id)
    if (officialIds.length > 0) {
      const rows = await Promise.all(officialIds.map(async (oid) => ({
        resolution_id: id,
        official_id: oid,
        term_id: existingTermByOfficial.has(oid)
          ? existingTermByOfficial.get(oid)
          : await resolveCurrentTermId(oid),
      })))
      await supabase.from('resolution_officials').insert(rows)
    }
    await logActivity(req, 'UPDATE', 'Resolutions', `Updated resolution: ${title}`)
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/resolutions/:id
// Archives the resolution instead of a hard delete via archive_resolution()
// (see ordinances.js and migrations/007 for the same transactional pattern).
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: snapshot, error } = await supabase.rpc('archive_resolution', {
      p_id: req.params.id,
      p_archived_by: req.user.id,
    })
    if (error) {
      if (error.code === 'P0002') return res.status(404).json({ error: 'Resolution not found.' })
      return res.status(500).json({ error: error.message })
    }

    await logActivity(req, 'ARCHIVE', 'Resolutions', `Archived resolution: ${snapshot.title}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/resolutions/:id/print
router.get('/:id/print', async (req, res) => {
  try {
    const { data: r, error } = await supabase
      .from('resolutions').select('*').eq('id', req.params.id).single()
    if (error || !r) return res.status(404).send('Not found')
    res.send(`<!DOCTYPE html><html><head><title>${r.resolution_number || r.title}</title>
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
        ${r.resolution_number ? `<h2>${r.resolution_number}</h2>` : ''}
        <h1>${r.title}</h1>
      </div>
      <div class="meta">
        ${r.year ? `Year: ${r.year} &nbsp;|&nbsp;` : ''}
        Date: ${new Date(r.uploaded_at).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}
      </div>
      <div class="content">${r.extracted_text || 'No extracted text available for this resolution.'}</div>
      <div class="footer">Sangguniang Bayan of Balilihan, Bohol &nbsp;•&nbsp; Official Public Record</div>
    </body></html>`)
  } catch (err) {
    res.status(500).send('Server error')
  }
})

// ─── Review workflow: pending → needs_revision → pending → ready_to_publish → approved → published
async function loadResolutionInStatus(id, expectedStatus) {
  const { data, error } = await supabase.from('resolutions').select('*').eq('id', id).single()
  if (error || !data) return { notFound: true }
  if (data.status !== expectedStatus) return { wrongStatus: true, data }
  return { data }
}

// ─── PUT /api/resolutions/:id/replace-file ────────────────────────────────────
// Secretary or Clerk — overwrites the stored file, bumps revision_count.
router.put('/:id/replace-file', verifyToken, secretaryOrClerk, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('resolutions').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Resolution not found.' })

    const extracted_text = await extractText(req.file)
    const { fileName } = await uploadToStorage(req.file, 'resolutions')

    const { data, error } = await supabase
      .from('resolutions')
      .update({
        filename: req.file.originalname,
        filetype: req.file.mimetype,
        filepath: fileName,
        extracted_text,
        revision_count: (existing.revision_count || 0) + 1,
      })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })

    if (existing.filepath) await deleteFromStorage(existing.filepath)

    await logActivity(req, 'REPLACE_FILE', 'Resolutions', `Replaced draft file for resolution: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/resolutions/:id/accept ──────────────────────────────────────────
// Secretary — pending → ready_to_publish
router.put('/:id/accept', verifyToken, secretaryOnly, async (req, res) => {
  const { id } = req.params
  const { notFound, wrongStatus, data: existing } = await loadResolutionInStatus(id, 'pending')
  if (notFound) return res.status(404).json({ error: 'Resolution not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Resolution is not pending review.' })
  try {
    const { data, error } = await supabase
      .from('resolutions')
      .update({ status: 'ready_to_publish', reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'ACCEPT', 'Resolutions', `Accepted draft: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/resolutions/:id/request-changes ────────────────────────────────
// Secretary — pending → needs_revision, requires an accompanying comment
router.put('/:id/request-changes', verifyToken, secretaryOnly, async (req, res) => {
  const { id } = req.params
  const { comment } = req.body
  if (!comment?.trim()) return res.status(400).json({ error: 'A comment is required when requesting changes.' })
  const { notFound, wrongStatus, data: existing } = await loadResolutionInStatus(id, 'pending')
  if (notFound) return res.status(404).json({ error: 'Resolution not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Resolution is not pending review.' })
  try {
    const { error: commentErr } = await supabase.from('comments').insert({
      entity_type: 'resolution',
      entity_id: id,
      author_id: req.user.id,
      author_role: req.user.position || req.user.role,
      text: comment.trim(),
    })
    if (commentErr) return res.status(500).json({ error: commentErr.message })

    const { data, error } = await supabase
      .from('resolutions')
      .update({ status: 'needs_revision', reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'REQUEST_CHANGES', 'Resolutions', `Requested changes on draft: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/resolutions/:id/vm-approve ─────────────────────────────────────
// Vice-Mayor — ready_to_publish → approved
router.put('/:id/vm-approve', verifyToken, viceMayorOnly, async (req, res) => {
  const { id } = req.params
  const { notFound, wrongStatus, data: existing } = await loadResolutionInStatus(id, 'ready_to_publish')
  if (notFound) return res.status(404).json({ error: 'Resolution not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Resolution is not ready for Vice-Mayor approval.' })
  try {
    const { data, error } = await supabase
      .from('resolutions')
      .update({ status: 'approved', reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'VM_APPROVE', 'Resolutions', `Vice-Mayor approved: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/resolutions/:id/publish ────────────────────────────────────────
// Secretary — approved → published
router.put('/:id/publish', verifyToken, secretaryOnly, async (req, res) => {
  const { id } = req.params
  const { notFound, wrongStatus, data: existing } = await loadResolutionInStatus(id, 'approved')
  if (notFound) return res.status(404).json({ error: 'Resolution not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Resolution is not approved for publishing.' })
  try {
    const { data, error } = await supabase
      .from('resolutions')
      .update({ status: 'published' })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'PUBLISH', 'Resolutions', `Published: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/resolutions/:id/resubmit ───────────────────────────────────────
// Clerk — needs_revision → pending
router.put('/:id/resubmit', verifyToken, clerkOnly, async (req, res) => {
  const { id } = req.params
  const { notFound, wrongStatus, data: existing } = await loadResolutionInStatus(id, 'needs_revision')
  if (notFound) return res.status(404).json({ error: 'Resolution not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Resolution is not awaiting revision.' })
  try {
    const { data, error } = await supabase
      .from('resolutions')
      .update({ status: 'pending' })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'RESUBMIT', 'Resolutions', `Resubmitted draft after revision: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
