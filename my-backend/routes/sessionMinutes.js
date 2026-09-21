const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const os = require('os')
const Tesseract = require('tesseract.js')

const supabase = require('../config/supabase')
const { verifyToken, canCreateDraft, pendingEditors } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { extractMetaHandler } = require('../helpers/documentMeta')
const { logActivity } = require('../helpers/logger')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { readDocument } = require('../helpers/documentText')
const { pdfBufferText } = require('../helpers/pdfText')
const { escapeHtml, canEditLegislativeRecord, SESSION_VENUE, applyTokenSearch } = require('../helpers/utils')
const { createLegislativeReviewRoutes } = require('../helpers/legislativeReviewRoutes')
const { notifyAllStaff, notificationEmailHtml } = require('../helpers/notify')

const WORD_MIMES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// Text of a Word file (the upload used to read only images and PDFs, so a
// Word upload ended up with no minutes text at all). null if it can't be read.
const extractWordText = async (file) => {
  if (!WORD_MIMES.includes(file.mimetype)) return null
  try {
    const doc = await readDocument(file)
    return (doc.text || '').trim() || null
  } catch (err) {
    console.error('Word read error:', err.message)
    return null
  }
}

// Text of any accepted upload — an image (OCR), a PDF or a Word file.
const extractTextFromFile = async (file) => {
  const mime = file.mimetype
  if (WORD_MIMES.includes(mime)) return extractWordText(file)
  if (mime.startsWith('image/')) {
    const tempPath = path.join(os.tmpdir(), `${Date.now()}-${file.originalname}`)
    try {
      fs.writeFileSync(tempPath, file.buffer)
      const { data: { text } } = await Tesseract.recognize(tempPath, 'eng')
      return text.trim() || null
    } catch (err) {
      console.error('OCR error:', err.message)
      return null
    } finally {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
    }
  }
  if (mime === 'application/pdf') return pdfBufferText(file.buffer)
  return null
}

// An uploaded file is kept in storage (so the PDF can be opened and the Word
// file downloaded later) in session_minutes.filepath — added by migration 029.
// Until that migration has been run the column doesn't exist, so uploads fall
// back to the old behaviour (text only, file not kept) instead of failing.
// Only a positive answer is remembered, so running the migration takes effect
// without restarting the server.
let filepathColumnKnown = false
const hasFilepathColumn = async () => {
  if (filepathColumnKnown) return true
  const { error } = await supabase.from('session_minutes').select('filepath').limit(1)
  filepathColumnKnown = !error
  if (error) console.warn('[session-minutes] filepath column check failed — files will not be kept:', error.message)
  return filepathColumnKnown
}


// GET /api/session-minutes
// Auth-gated — drafts/pending review copies live here alongside published
// ones. A caller that doesn't ask for a specific status gets published-only
// (matching content_posts' public-safe default); the review queues (see
// SessionsPage.jsx) pass an explicit status list to see drafts, and the
// admin dashboard's own counts/recent-activity view passes status=all to see
// every status without the caller having to enumerate them.
//
// year/search are real SQL filters (not a post-fetch JS filter, which
// can't be combined correctly with pagination — a JS .filter() after
// .range() would silently drop matches that happened to land on a
// different page). Pagination itself is opt-in: pass both page and limit
// to get back { data, total, page, limit, totalPages } instead of a bare
// array; existing callers that don't paginate are unaffected.
router.get('/', verifyToken, async (req, res) => {
  try {
    const { year, search, type, date } = req.query
    let query = supabase
      .from('session_minutes')
      .select('*', { count: 'exact' })
      .order('session_date', { ascending: false })
    if (type && type !== 'all') query = query.eq('session_type', type)
    if (year && /^\d{4}$/.test(year)) {
      query = query.gte('session_date', `${year}-01-01`).lt('session_date', `${Number(year) + 1}-01-01`)
    }
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) query = query.eq('session_date', date)
    // The box advertises session number, type and venue — search those, plus
    // the minutes text itself, word by word.
    if (search) {
      query = applyTokenSearch(query, search, ['session_number', 'session_type', 'venue', 'minutes_text'])
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
    if (page && limit) {
      return res.json({ data, total: count ?? data.length, page, limit, totalPages: Math.max(Math.ceil((count ?? data.length) / limit), 1) })
    }
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/session-minutes/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('session_minutes').select('*').eq('id', req.params.id).single()
    if (error) return res.status(500).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'Session minutes not found.' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/session-minutes
// Any of the four legislative positions can originate one — Secretary,
// Clerk, Councilor, or Vice-Mayor. Unlike ordinances/resolutions, there is
// no pending/VM-approval workflow here (same as session_agendas): a session
// minutes record is immediately live the moment it's recorded, so `status`
// is set straight to 'published' instead of 'pending'.
router.post('/', verifyToken, canCreateDraft, async (req, res) => {
  try {
    const { session_number, session_date, session_type, venue, agenda, minutes_text } = req.body
    if (!session_date) return res.status(400).json({ error: 'Session date is required.' })
    const { data, error } = await supabase
      .from('session_minutes')
      .insert({
        session_number: session_number || null,
        session_date,
        session_type: session_type || 'regular',
        venue: venue || SESSION_VENUE,
        agenda: agenda || null,
        minutes_text: minutes_text || null,
        status: 'published',
        created_by: req.user.id,
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'CREATE', 'Sessions', `Added session: ${session_number || session_date}`)
    notifyAllStaff({
      message: `New session minutes recorded: ${session_number || session_date}`,
      entityType: 'session_minutes', entityId: data.id,
      emailSubject: `New Session Minutes: ${session_number || session_date}`,
      emailHtml: notificationEmailHtml(
        'New Session Minutes Recorded',
        `Minutes were recorded for the session${session_number ? ` <strong>${escapeHtml(session_number)}</strong>` : ''} on ${new Date(session_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}.`
      ),
    })
    res.json({ success: true, id: data.id, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// POST /api/session-minutes/upload — auto-detects file type
// See POST / above.
// POST /api/session-minutes/extract-meta — reads the chosen file and suggests the session's
// title (number), type, date and venue for the upload form to prefill. Nothing
// is saved. Same reader as ordinances/resolutions (Word, PDF text, OCR).
router.post('/extract-meta', verifyToken, canCreateDraft, upload.single('file'), handleMulterError, extractMetaHandler('minutes'))

router.post('/upload', verifyToken, canCreateDraft, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' })
  const { session_number, session_date, session_type, venue, agenda, minutes_text } = req.body
  if (!session_date) return res.status(400).json({ error: 'Session date is required.' })

  const mime = req.file.mimetype
  const isImage = mime.startsWith('image/')
  const isPDF = mime === 'application/pdf'

  let extractedText = null
  let tempPath = null
  let storedPath = null

  try {
    if (isImage) {
      tempPath = path.join(os.tmpdir(), `${Date.now()}-${req.file.originalname}`)
      fs.writeFileSync(tempPath, req.file.buffer)
      const { data: { text } } = await Tesseract.recognize(tempPath, 'eng')
      fs.unlinkSync(tempPath)
      tempPath = null
      extractedText = text.trim() || null
    }

    if (WORD_MIMES.includes(mime)) extractedText = await extractWordText(req.file)

    if (isPDF) extractedText = await pdfBufferText(req.file.buffer)

    // Keep the file itself so it can be opened/downloaded later.
    if (await hasFilepathColumn()) {
      storedPath = (await uploadToStorage(req.file, 'session-minutes')).fileName
    }
    console.log('[session-minutes] upload:', {
      file: req.file.originalname, mime, bytes: req.file.size,
      textChars: (extractedText || '').length, stored: storedPath,
    })

    const { data, error } = await supabase
      .from('session_minutes')
      .insert({
        session_number: session_number || null,
        session_date,
        session_type: session_type || 'regular',
        venue: venue || SESSION_VENUE,
        agenda: agenda || null,
        minutes_text: extractedText || minutes_text || null,
        filename: req.file.originalname,
        filetype: mime,
        ...(storedPath && { filepath: storedPath }),
        status: 'published',
        created_by: req.user.id,
      })
      .select().single()

    if (error) {
      if (storedPath) await deleteFromStorage(storedPath)
      return res.status(500).json({ error: error.message })
    }
    await logActivity(req, 'UPLOAD', 'Sessions', `Uploaded session: ${session_number || session_date}`)
    notifyAllStaff({
      message: `New session minutes recorded: ${session_number || session_date}`,
      entityType: 'session_minutes', entityId: data.id,
      emailSubject: `New Session Minutes: ${session_number || session_date}`,
      emailHtml: notificationEmailHtml(
        'New Session Minutes Recorded',
        `Minutes were recorded for the session${session_number ? ` <strong>${escapeHtml(session_number)}</strong>` : ''} on ${new Date(session_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}.`
      ),
    })
    res.json({ success: true, id: data.id, data })
  } catch (err) {
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
    if (storedPath) await deleteFromStorage(storedPath)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/session-minutes/:id
// canEditLegislativeRecord: Secretary/Clerk only, in any bucket.
// Also accepts a file (multipart): it replaces the record's file — the way to
// attach the original document to a record that was saved without one. Its
// text fills "minutes" if none was typed.
router.put('/:id', verifyToken, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  let newFilePath = null
  try {
    const { data: existing } = await supabase
      .from('session_minutes').select('*').eq('id', id).single()
    if (!existing) return res.status(404).json({ error: 'Session minutes not found.' })
    if (!canEditLegislativeRecord(req.user.position))
      return res.status(403).json({ error: 'You are not allowed to edit this session record.' })
    const { session_number, session_date, session_type, venue, agenda, minutes_text } = req.body
    if (!session_date) return res.status(400).json({ error: 'Session date is required.' })
    const updateData = {
      session_number: session_number || null,
      session_date,
      session_type: session_type || 'regular',
      venue: venue || null,
      agenda: agenda || null,
      minutes_text: minutes_text || null
    }

    if (req.file) {
      updateData.filename = req.file.originalname
      updateData.filetype = req.file.mimetype
      // Text typed into the form wins; otherwise take it from the new file.
      if (!updateData.minutes_text) updateData.minutes_text = await extractTextFromFile(req.file)
      if (await hasFilepathColumn()) {
        newFilePath = (await uploadToStorage(req.file, 'session-minutes')).fileName
        updateData.filepath = newFilePath
      }
    }

    const { data, error } = await supabase
      .from('session_minutes')
      .update(updateData)
      .eq('id', id).select().single()
    if (error) {
      if (newFilePath) await deleteFromStorage(newFilePath)
      return res.status(500).json({ error: error.message })
    }
    // The record points at the new file now — remove the one it replaced.
    if (newFilePath && existing.filepath) await deleteFromStorage(existing.filepath)
    await logActivity(req, 'UPDATE', 'Sessions', `Updated session ID: ${id}`)
    res.json({ success: true, data })
  } catch (err) {
    if (newFilePath) await deleteFromStorage(newFilePath)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/session-minutes/:id/print
router.get('/:id/print', verifyToken, async (req, res) => {
  try {
    const { data: s, error } = await supabase
      .from('session_minutes').select('*').eq('id', req.params.id).single()
    if (error || !s) return res.status(404).send('Not found')
    res.send(`<!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8"/>
      <title>Session Minutes — ${escapeHtml(s.session_number || new Date(s.session_date).toLocaleDateString('en-PH'))}</title>
      <style>
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:Arial,sans-serif; text-align:justify; max-width:850px; margin:0 auto; padding:40px 60px 60px; color:#111; }
        .letterhead { display:flex; align-items:center; gap:119.5px; padding-bottom:18px; margin-bottom:6px; }
        .letterhead-seal { flex-shrink:0; width:100px; height:100px; object-fit:contain; }
        .letterhead-text { display:flex; flex-direction:column; gap:2px; }
        .letterhead-text .republic { font-size:13px; font-style:italic; }
        .letterhead-text .province { font-size:13.5px; font-weight:bold; text-transform:uppercase; }
        .letterhead-text .municipality { font-size:15px; font-weight:900; text-transform:uppercase; letter-spacing:1px; }
        .letterhead-text .office { font-size:14px; font-weight:bold; text-transform:uppercase; padding-top:8px; }
        .letterhead-rule { height:2px; background:#000; margin-bottom:28px; }
        .doc-title-block { text-align:center; margin-bottom:24px; }
        .doc-label { font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#555; margin-bottom:6px; }
        .session-num { font-size:17px; font-weight:bold; margin-bottom:6px; }
        .type-badge { display:inline-block; font-size:10px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; padding:3px 14px; border-radius:20px; }
        .type-regular { background:#ebf8ff; color:#2b6cb0; border:1px solid #bee3f8; }
        .type-special { background:#fff5f5; color:#c53030; border:1px solid #fed7d7; }
        .meta-grid { display:grid; grid-template-columns:160px 1fr; gap:5px 16px; margin:0 0 28px; font-size:13px; border:1px solid #d1d5db; border-radius:6px; padding:14px 18px; background:#fafafa; }
        .meta-grid .label { font-weight:bold; color:#1a365d; }
        .section { margin:24px 0; }
        .section-title { font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:2px; color:#1a365d; border-bottom:1.5px solid #1a365d; padding-bottom:5px; margin-bottom:14px; }
        .minutes-body { font-size:13.5px; line-height:1.9; white-space:pre-wrap; text-align:justify; }
        .footer { margin-top:60px; border-top:1px solid #cbd5e0; padding-top:16px; text-align:center; font-size:10.5px; color:#888; }
        .print-btn { position:fixed; top:20px; right:20px; padding:10px 22px; background:#1a365d; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; }
        @media print { .print-btn { display:none; } body { padding:20px 40px 40px; } }
      </style>
      </head><body>
      <button class="print-btn" onclick="window.print()">🖨&nbsp; Print</button>
      <div class="letterhead">
        <img class="letterhead-seal" src="${process.env.LOGO_URL || ''}" alt="Official Seal" onerror="this.style.display='none'"/>
        <div class="letterhead-text">
          <div class="republic">Republic of the Philippines</div>
          <div class="province">Province of Bohol</div>
          <div class="municipality">Municipality of Balilihan</div>
          <div class="office">Office of the Sangguniang Bayan</div>
        </div>
      </div>
      <div class="letterhead-rule"></div>
      <div class="doc-title-block">
        <div class="doc-label">Session Minutes</div>
        ${s.session_number ? `<div class="session-num">${escapeHtml(s.session_number)}</div>` : ''}
        <span class="type-badge ${s.session_type === 'special' ? 'type-special' : 'type-regular'}">
          ${s.session_type === 'special' ? 'Special Session' : 'Regular Session'}
        </span>
      </div>
      <div class="meta-grid">
        <div class="label">Date of Session:</div>
        <div class="value">${new Date(s.session_date).toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
        ${s.venue ? `<div class="label">Venue:</div><div class="value">${escapeHtml(s.venue)}</div>` : ''}
        <div class="label">Date Recorded:</div>
        <div class="value">${new Date(s.created_at).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</div>
      </div>
      <div class="section">
        <div class="section-title">Minutes of the Session</div>
        <div class="minutes-body">${escapeHtml(s.minutes_text) || '<em>No minutes content available.</em>'}</div>
      </div>
      <div class="footer">Sangguniang Bayan of Balilihan &nbsp;•&nbsp; Province of Bohol &nbsp;•&nbsp; Official Public Record</div>
    </body></html>`)
  } catch (err) {
    res.status(500).send('Server error')
  }
})

// ─── PUT /api/session-minutes/:id/revise ──────────────────────────────────────
// Secretary/Clerk only (see pendingEditors) — same as PUT /:id above.
// Corrects the draft (either a replacement file, re-run through OCR/PDF
// extraction, or a direct edit of the text fields), bumps revision_count.
router.put('/:id/revise', verifyToken, pendingEditors, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('session_minutes').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Session minutes not found.' })
    if (!canEditLegislativeRecord(req.user.position))
      return res.status(403).json({ error: 'You are not allowed to revise this session record.' })

    const updateData = { revision_count: (existing.revision_count || 0) + 1 }

    if (req.file) {
      const mime = req.file.mimetype
      let extractedText = null
      if (mime.startsWith('image/')) {
        const tempPath = path.join(os.tmpdir(), `${Date.now()}-${req.file.originalname}`)
        fs.writeFileSync(tempPath, req.file.buffer)
        const { data: { text } } = await Tesseract.recognize(tempPath, 'eng')
        fs.unlinkSync(tempPath)
        extractedText = text.trim() || null
      } else if (mime === 'application/pdf') {
        extractedText = await pdfBufferText(req.file.buffer)
      } else if (WORD_MIMES.includes(mime)) {
        extractedText = await extractWordText(req.file)
      }
      updateData.filename = req.file.originalname
      updateData.filetype = mime
      if (extractedText) updateData.minutes_text = extractedText
      // Replace the stored file too (the old one is removed once the record
      // points at the new one).
      if (await hasFilepathColumn()) {
        updateData.filepath = (await uploadToStorage(req.file, 'session-minutes')).fileName
      }
    } else {
      const { session_number, session_date, session_type, venue, agenda, minutes_text } = req.body
      if (session_number !== undefined) updateData.session_number = session_number || null
      if (session_date !== undefined) updateData.session_date = session_date
      if (session_type !== undefined) updateData.session_type = session_type || 'regular'
      if (venue !== undefined) updateData.venue = venue || null
      if (agenda !== undefined) updateData.agenda = agenda || null
      if (minutes_text !== undefined) updateData.minutes_text = minutes_text || null
    }
    const { data, error } = await supabase
      .from('session_minutes').update(updateData).eq('id', id).select().single()
    if (error) {
      if (updateData.filepath) await deleteFromStorage(updateData.filepath)
      return res.status(500).json({ error: error.message })
    }
    if (updateData.filepath && existing.filepath) await deleteFromStorage(existing.filepath)

    await logActivity(req, 'REPLACE_FILE', 'Sessions', `Revised draft session: ${existing.session_number || id}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Archive (DELETE /:id) — shared with ordinances/resolutions, see
// helpers/legislativeReviewRoutes.js. New session minutes are created
// directly as 'published' now (see POST / and POST /upload above), so the
// accept/request-changes/vm-approve/publish routes this factory also
// mounts are unreachable for session_minutes going forward — a status of
// 'pending'/'ready_to_publish'/'approved' can no longer occur, so those
// endpoints just always 404/400. Left mounted rather than forked out of the
// shared factory, since DELETE (archive) is still needed and the dead
// routes are harmless.
router.use('/', createLegislativeReviewRoutes({
  table: 'session_minutes',
  entityType: 'session_minutes',
  activityModule: 'Sessions',
  singularLabel: 'Session minutes',
  archiveRpc: 'archive_session_minutes',
  labelOf: (r) => r.session_number || r.id,
}))

module.exports = router
