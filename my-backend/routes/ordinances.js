const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const os = require('os')
const Tesseract = require('tesseract.js')
const PDFParser = require('pdf2json')

const supabase = require('../config/supabase')
const { verifyToken, adminOnly, secretaryOnly, secretaryOrClerk, clerkOnly, viceMayorOnly } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')
const { safeParseJSON } = require('../helpers/utils')

// ─── Helper: extract text based on file type ──────────────────────────────────
// PDFs and Word files are stored only — no extraction at upload time.
// Only images run through OCR here. (PDF text can still be extracted
// on-the-fly by the /:id/print route, cached after the first view.)
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

// ─── GET /api/ordinances ──────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { year, search } = req.query
    let query = supabase
      .from('ordinances')
      .select(`*, ordinance_officials ( sb_council_members ( id, full_name, position, photo ) )`)
      .order('uploaded_at', { ascending: false })
    if (year) query = query.eq('year', year)
if (search) query = query.ilike('title', `%${search}%`)
if (req.query.status) {
  const statuses = req.query.status.split(',')
  query = query.in('status', statuses)
}
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    const parsed = data.map(o => ({
      ...o,
      officials: o.ordinance_officials?.map(oo => oo.sb_council_members).filter(Boolean) || [],
      ordinance_officials: undefined
    }))
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/ordinances/:id/print ───────────────────────────────────────────
router.get('/:id/print', async (req, res) => {
  try {
    const { data: o, error } = await supabase
      .from('ordinances').select('*').eq('id', req.params.id).single()
    if (error || !o) return res.status(404).send('Not found')

    let extractedText = o.extracted_text || ''

    // If PDF with no cached text, extract on the fly
    if (o.filetype === 'application/pdf' && !extractedText) {
      try {
        const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/assets/${o.filepath}`
        const response = await fetch(fileUrl)
        if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`)
        const buffer = Buffer.from(await response.arrayBuffer())
        extractedText = await new Promise((resolve) => {
          const pdfParser = new PDFParser()
          pdfParser.on('pdfParser_dataReady', (data) => {
            const text = data.Pages
              ?.flatMap(p => p.Texts)
              ?.map(t => decodeURIComponent(t.R?.[0]?.T || ''))
              ?.join(' ')
              ?.trim() || ''
            resolve(text)
          })
          pdfParser.on('pdfParser_dataError', () => resolve(''))
          pdfParser.parseBuffer(buffer)
        })
        if (extractedText) {
          await supabase.from('ordinances')
            .update({ extracted_text: extractedText })
            .eq('id', o.id)
        }
      } catch (pdfErr) {
        console.error('PDF print error:', pdfErr.message)
        extractedText = ''
      }
    }

    // If Word file, show download link instead
    const isWord = o.filetype === 'application/msword' ||
      o.filetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/assets/${o.filepath}`

    res.send(`<!DOCTYPE html><html><head>
      <title>${o.ordinance_number || o.title}</title>
      <style>
        body { font-family:'Times New Roman',serif; max-width:800px; margin:40px auto; padding:40px; color:#000; }
        h2 { text-align:center; font-size:15px; color:#555; margin-bottom:4px; }
        h1 { text-align:center; font-size:20px; margin:0 0 8px; }
        .meta { text-align:center; font-size:13px; color:#555; margin-bottom:32px; border-bottom:2px solid #000; padding-bottom:16px; }
        .content { font-size:14px; line-height:1.8; white-space:pre-wrap; }
        .print-btn { position:fixed; top:20px; right:20px; padding:10px 20px; background:#1a365d; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; }
        .download-btn { display:inline-block; margin:20px auto; padding:12px 24px; background:#009439; color:#fff; border-radius:8px; text-decoration:none; font-size:14px; }
        @media print { .print-btn { display:none; } }
      </style>
      </head><body>
      <button class="print-btn" onclick="window.print()">🖨 Print</button>
      ${o.ordinance_number ? `<h2>${o.ordinance_number}</h2>` : ''}
      <h1>${o.title}</h1>
      <div class="meta">${o.year ? `Year: ${o.year} &nbsp;|&nbsp;` : ''}Date: ${new Date(o.uploaded_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      ${isWord
        ? `<div style="text-align:center"><p>This ordinance is stored as a Word document.</p><a href="${fileUrl}" class="download-btn" download>⬇ Download Word File</a></div>`
        : `<div class="content">${extractedText || 'No extracted text available.'}</div>`
      }
      </body></html>`)
  } catch (err) {
    res.status(500).send('Server error')
  }
})

// ─── GET /api/ordinances/:id ──────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data: o, error } = await supabase
      .from('ordinances')
      .select(`*, ordinance_officials ( sb_council_members ( id, full_name, position, photo ) )`)
      .eq('id', req.params.id)
      .single()
    if (error || !o) return res.status(404).json({ error: 'Not found' })
    const parsed = {
      ...o,
      officials: o.ordinance_officials?.map(oo => oo.sb_council_members).filter(Boolean) || [],
      ordinance_officials: undefined
    }
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/ordinances/upload ─────────────────────────────────────────────
router.post('/upload', verifyToken, adminOnly, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  const { ordinance_number, title, year, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })
  const officialIds = safeParseJSON(officials, [])

  let fileName = null
  try {
    const extracted_text = await extractText(req.file)
    const uploadResult = await uploadToStorage(req.file, 'ordinances')
    fileName = uploadResult.fileName

    const { data: ordinance, error } = await supabase
      .from('ordinances')
      .insert({
        ordinance_number: ordinance_number || null,
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
      const { error: relErr } = await supabase.from('ordinance_officials').insert(
        officialIds.map(oid => ({ ordinance_id: ordinance.id, official_id: oid }))
      )
      if (relErr) console.error('ordinance_officials insert error:', relErr.message)
    }

    await logActivity(req, 'UPLOAD', 'Ordinances', `Uploaded ordinance: ${title}`)
    res.json({ success: true, id: ordinance.id, data: ordinance })
  } catch (err) {
    console.error('Ordinance upload error:', err)
    if (fileName) await deleteFromStorage(fileName)
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/ordinances/:id ──────────────────────────────────────────────────
router.put('/:id', verifyToken, adminOnly, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  const { ordinance_number, title, year, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('ordinances').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Ordinance not found.' })

    const updateData = {
      ordinance_number: ordinance_number || null,
      title,
      year: year ? parseInt(year) : null
    }

    if (req.file) {
      const { fileName } = await uploadToStorage(req.file, 'ordinances')
      updateData.filename = req.file.originalname
      updateData.filetype = req.file.mimetype
      updateData.filepath = fileName
      updateData.extracted_text = await extractText(req.file)

      // Only delete the old stored file after the new one is confirmed uploaded
      if (existing.filepath) await deleteFromStorage(existing.filepath)
    }

    const { data: updated, error } = await supabase
      .from('ordinances').update(updateData).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })

    const officialIds = safeParseJSON(officials, [])
    await supabase.from('ordinance_officials').delete().eq('ordinance_id', id)
    if (officialIds.length > 0) {
      const { error: relErr } = await supabase.from('ordinance_officials').insert(
        officialIds.map(oid => ({ ordinance_id: id, official_id: oid }))
      )
      if (relErr) console.error('ordinance_officials insert error:', relErr.message)
    }

    await logActivity(req, 'UPDATE', 'Ordinances', `Updated ordinance: ${title}`)
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('Ordinance update error:', err)
    res.status(500).json({ error: err.message })
  }
})
// ─── Review workflow: pending → needs_revision → pending → ready_to_publish → approved → published
// Helper: load an ordinance and confirm it's currently in the expected status.
async function loadOrdinanceInStatus(id, expectedStatus) {
  const { data, error } = await supabase.from('ordinances').select('*').eq('id', id).single()
  if (error || !data) return { notFound: true }
  if (data.status !== expectedStatus) return { wrongStatus: true, data }
  return { data }
}

// ─── PUT /api/ordinances/:id/replace-file ─────────────────────────────────────
// Secretary or Clerk — overwrites the stored file, bumps revision_count.
router.put('/:id/replace-file', verifyToken, secretaryOrClerk, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('ordinances').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Ordinance not found.' })

    const extracted_text = await extractText(req.file)
    const { fileName } = await uploadToStorage(req.file, 'ordinances')

    const { data, error } = await supabase
      .from('ordinances')
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

    await logActivity(req, 'REPLACE_FILE', 'Ordinances', `Replaced draft file for ordinance: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/ordinances/:id/accept ───────────────────────────────────────────
// Secretary — pending → ready_to_publish
router.put('/:id/accept', verifyToken, secretaryOnly, async (req, res) => {
  const { id } = req.params
  const { notFound, wrongStatus, data: existing } = await loadOrdinanceInStatus(id, 'pending')
  if (notFound) return res.status(404).json({ error: 'Ordinance not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Ordinance is not pending review.' })
  try {
    const { data, error } = await supabase
      .from('ordinances')
      .update({ status: 'ready_to_publish', reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'ACCEPT', 'Ordinances', `Accepted draft: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/ordinances/:id/request-changes ─────────────────────────────────
// Secretary — pending → needs_revision, requires an accompanying comment
router.put('/:id/request-changes', verifyToken, secretaryOnly, async (req, res) => {
  const { id } = req.params
  const { comment } = req.body
  if (!comment?.trim()) return res.status(400).json({ error: 'A comment is required when requesting changes.' })
  const { notFound, wrongStatus, data: existing } = await loadOrdinanceInStatus(id, 'pending')
  if (notFound) return res.status(404).json({ error: 'Ordinance not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Ordinance is not pending review.' })
  try {
    const { error: commentErr } = await supabase.from('comments').insert({
      entity_type: 'ordinance',
      entity_id: id,
      author_id: req.user.id,
      author_role: req.user.position || req.user.role,
      text: comment.trim(),
    })
    if (commentErr) return res.status(500).json({ error: commentErr.message })

    const { data, error } = await supabase
      .from('ordinances')
      .update({ status: 'needs_revision', reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'REQUEST_CHANGES', 'Ordinances', `Requested changes on draft: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/ordinances/:id/vm-approve ──────────────────────────────────────
// Vice-Mayor — ready_to_publish → approved
router.put('/:id/vm-approve', verifyToken, viceMayorOnly, async (req, res) => {
  const { id } = req.params
  const { notFound, wrongStatus, data: existing } = await loadOrdinanceInStatus(id, 'ready_to_publish')
  if (notFound) return res.status(404).json({ error: 'Ordinance not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Ordinance is not ready for Vice-Mayor approval.' })
  try {
    const { data, error } = await supabase
      .from('ordinances')
      .update({ status: 'approved', reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'VM_APPROVE', 'Ordinances', `Vice-Mayor approved: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/ordinances/:id/publish ─────────────────────────────────────────
// Secretary — approved → published
router.put('/:id/publish', verifyToken, secretaryOnly, async (req, res) => {
  const { id } = req.params
  const { notFound, wrongStatus, data: existing } = await loadOrdinanceInStatus(id, 'approved')
  if (notFound) return res.status(404).json({ error: 'Ordinance not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Ordinance is not approved for publishing.' })
  try {
    const { data, error } = await supabase
      .from('ordinances')
      .update({ status: 'published' })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'PUBLISH', 'Ordinances', `Published: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/ordinances/:id/resubmit ────────────────────────────────────────
// Clerk — needs_revision → pending
router.put('/:id/resubmit', verifyToken, clerkOnly, async (req, res) => {
  const { id } = req.params
  const { notFound, wrongStatus, data: existing } = await loadOrdinanceInStatus(id, 'needs_revision')
  if (notFound) return res.status(404).json({ error: 'Ordinance not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Ordinance is not awaiting revision.' })
  try {
    const { data, error } = await supabase
      .from('ordinances')
      .update({ status: 'pending' })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'RESUBMIT', 'Ordinances', `Resubmitted draft after revision: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── DELETE /api/ordinances/:id ───────────────────────────────────────────────
// Archives the ordinance instead of a hard delete: snapshots the row (plus its
// council-member links) into `archives`, then removes it from the live table.
// The stored file is left in place until a permanent delete from the Archives page.
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('ordinances')
      .select(`*, ordinance_officials ( official_id )`)
      .eq('id', req.params.id)
      .single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Ordinance not found.' })

    const official_ids = existing.ordinance_officials?.map(x => x.official_id) || []
    const snapshot = { ...existing, ordinance_officials: undefined, official_ids }

    const { error: archiveErr } = await supabase.from('archives').insert({
      original_id: existing.id,
      entity_type: 'ordinance',
      data: snapshot,
      archived_by: req.user.id,
    })
    if (archiveErr) return res.status(500).json({ error: archiveErr.message })

    await supabase.from('ordinance_officials').delete().eq('ordinance_id', req.params.id)
    const { error } = await supabase.from('ordinances').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })

    await logActivity(req, 'ARCHIVE', 'Ordinances', `Archived ordinance: ${existing.title}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router