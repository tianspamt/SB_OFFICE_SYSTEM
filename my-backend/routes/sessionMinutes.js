const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const os = require('os')
const Tesseract = require('tesseract.js')

const supabase = require('../config/supabase')
const { verifyToken, adminOnly, secretaryOnly, secretaryOrClerk, clerkOnly, viceMayorOnly } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { logActivity } = require('../helpers/logger')


// GET /api/session-minutes
router.get('/', async (req, res) => {
  try {
    const { month, year, type } = req.query
    let query = supabase
      .from('session_minutes')
      .select('id, session_number, session_date, session_type, venue, agenda, minutes_text, filename, filetype, created_at, status, revision_count, reviewed_by, reviewed_at')
      .order('session_date', { ascending: false })
    if (type && type !== 'all') query = query.eq('session_type', type)
    if (req.query.status) {
      const statuses = req.query.status.split(',')
      query = query.in('status', statuses)
    }
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    let results = data
    if (month) results = results.filter(r => new Date(r.session_date).getMonth() + 1 === parseInt(month))
    if (year)  results = results.filter(r => new Date(r.session_date).getFullYear() === parseInt(year))
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/session-minutes/:id
router.get('/:id', async (req, res) => {
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
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { session_number, session_date, session_type, venue, agenda, minutes_text } = req.body
    if (!session_date) return res.status(400).json({ error: 'Session date is required.' })
    const { data, error } = await supabase
      .from('session_minutes')
      .insert({
        session_number: session_number || null,
        session_date,
        session_type: session_type || 'regular',
        venue: venue || null,
        agenda: agenda || null,
        minutes_text: minutes_text || null,
        status: 'pending'
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'CREATE', 'Sessions', `Added session: ${session_number || session_date}`)
    res.json({ success: true, id: data.id, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// POST /api/session-minutes/upload — auto-detects file type
router.post('/upload', verifyToken, adminOnly, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' })
  const { session_number, session_date, session_type, venue, agenda, minutes_text } = req.body
  if (!session_date) return res.status(400).json({ error: 'Session date is required.' })

  const mime = req.file.mimetype
  const isImage = mime.startsWith('image/')
  const isPDF = mime === 'application/pdf'

  let extractedText = null
  let tempPath = null

  try {
    if (isImage) {
      tempPath = path.join(os.tmpdir(), `${Date.now()}-${req.file.originalname}`)
      fs.writeFileSync(tempPath, req.file.buffer)
      const { data: { text } } = await Tesseract.recognize(tempPath, 'eng')
      fs.unlinkSync(tempPath)
      tempPath = null
      extractedText = text.trim() || null
    }

    if (isPDF) {
      const PDFParser = require('pdf2json')
      try {
        extractedText = await new Promise((resolve) => {
          const pdfParser = new PDFParser()
          pdfParser.on('pdfParser_dataReady', (data) => {
            const text = data.Pages
              ?.flatMap(p => p.Texts)
              ?.map(t => decodeURIComponent(t.R?.[0]?.T || ''))
              ?.join(' ')
              ?.trim() || ''
            resolve(text || null)
          })
          pdfParser.on('pdfParser_dataError', () => resolve(null))
          pdfParser.parseBuffer(req.file.buffer)
        })
      } catch (pdfErr) {
        console.error('PDF parse error:', pdfErr.message)
      }
    }

    const { data, error } = await supabase
      .from('session_minutes')
      .insert({
        session_number: session_number || null,
        session_date,
        session_type: session_type || 'regular',
        venue: venue || null,
        agenda: agenda || null,
        minutes_text: extractedText || minutes_text || null,
        filename: req.file.originalname,
        filetype: mime,
        status: 'pending'
      })
      .select().single()

    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPLOAD', 'Sessions', `Uploaded session: ${session_number || session_date}`)
    res.json({ success: true, id: data.id, data })
  } catch (err) {
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/session-minutes/:id
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
  const { id } = req.params
  try {
    const { data: existing } = await supabase
      .from('session_minutes').select('id').eq('id', id).single()
    if (!existing) return res.status(404).json({ error: 'Session minutes not found.' })
    const { session_number, session_date, session_type, venue, agenda, minutes_text } = req.body
    if (!session_date) return res.status(400).json({ error: 'Session date is required.' })
    const { data, error } = await supabase
      .from('session_minutes')
      .update({
        session_number: session_number || null,
        session_date,
        session_type: session_type || 'regular',
        venue: venue || null,
        agenda: agenda || null,
        minutes_text: minutes_text || null
      })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPDATE', 'Sessions', `Updated session ID: ${id}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/session-minutes/:id
// Archives the session minutes instead of a hard delete via
// archive_session_minutes() (see ordinances.js and migrations/007 for the
// same transactional pattern).
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: snapshot, error } = await supabase.rpc('archive_session_minutes', {
      p_id: req.params.id,
      p_archived_by: req.user.id,
    })
    if (error) {
      if (error.code === 'P0002') return res.status(404).json({ error: 'Session minutes not found.' })
      return res.status(500).json({ error: error.message })
    }

    await logActivity(req, 'ARCHIVE', 'Sessions', `Archived session: ${snapshot.session_number || req.params.id}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/session-minutes/:id/print
router.get('/:id/print', async (req, res) => {
  try {
    const { data: s, error } = await supabase
      .from('session_minutes').select('*').eq('id', req.params.id).single()
    if (error || !s) return res.status(404).send('Not found')
    const agendaItems = s.agenda ? s.agenda.split('\n').filter(Boolean) : []
    res.send(`<!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8"/>
      <title>Session Minutes — ${s.session_number || new Date(s.session_date).toLocaleDateString('en-PH')}</title>
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
        .agenda-list { padding-left:22px; }
        .agenda-list li { font-size:13.5px; line-height:1.9; }
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
        <div class="doc-label">Session Minutes &amp; Agenda</div>
        ${s.session_number ? `<div class="session-num">${s.session_number}</div>` : ''}
        <span class="type-badge ${s.session_type === 'special' ? 'type-special' : 'type-regular'}">
          ${s.session_type === 'special' ? 'Special Session' : 'Regular Session'}
        </span>
      </div>
      <div class="meta-grid">
        <div class="label">Date of Session:</div>
        <div class="value">${new Date(s.session_date).toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
        ${s.venue ? `<div class="label">Venue:</div><div class="value">${s.venue}</div>` : ''}
        <div class="label">Date Recorded:</div>
        <div class="value">${new Date(s.created_at).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</div>
      </div>
      <div class="section">
        <div class="section-title">Agenda</div>
        <ol class="agenda-list">
          ${agendaItems.length ? agendaItems.map(a => `<li>${a.trim()}</li>`).join('') : '<li><em>No agenda items listed.</em></li>'}
        </ol>
      </div>
      <div class="section">
        <div class="section-title">Minutes of the Session</div>
        <div class="minutes-body">${s.minutes_text || '<em>No minutes content available.</em>'}</div>
      </div>
      <div class="footer">Sangguniang Bayan of Balilihan &nbsp;•&nbsp; Province of Bohol &nbsp;•&nbsp; Official Public Record</div>
    </body></html>`)
  } catch (err) {
    res.status(500).send('Server error')
  }
})

// ─── Review workflow: pending → needs_revision → pending → ready_to_publish → approved → published
async function loadSessionInStatus(id, expectedStatus) {
  const { data, error } = await supabase.from('session_minutes').select('*').eq('id', id).single()
  if (error || !data) return { notFound: true }
  if (data.status !== expectedStatus) return { wrongStatus: true, data }
  return { data }
}

// ─── PUT /api/session-minutes/:id/revise ──────────────────────────────────────
// Secretary or Clerk — corrects the draft (either a replacement file, re-run
// through OCR/PDF extraction, or a direct edit of the text fields), bumps revision_count.
router.put('/:id/revise', verifyToken, secretaryOrClerk, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('session_minutes').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Session minutes not found.' })

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
        const PDFParser = require('pdf2json')
        extractedText = await new Promise((resolve) => {
          const pdfParser = new PDFParser()
          pdfParser.on('pdfParser_dataReady', (data) => {
            const text = data.Pages
              ?.flatMap(p => p.Texts)
              ?.map(t => decodeURIComponent(t.R?.[0]?.T || ''))
              ?.join(' ')
              ?.trim() || ''
            resolve(text || null)
          })
          pdfParser.on('pdfParser_dataError', () => resolve(null))
          pdfParser.parseBuffer(req.file.buffer)
        })
      }
      updateData.filename = req.file.originalname
      updateData.filetype = mime
      if (extractedText) updateData.minutes_text = extractedText
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
    if (error) return res.status(500).json({ error: error.message })

    await logActivity(req, 'REPLACE_FILE', 'Sessions', `Revised draft session: ${existing.session_number || id}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/session-minutes/:id/accept ──────────────────────────────────────
// Secretary — pending → ready_to_publish
router.put('/:id/accept', verifyToken, secretaryOnly, async (req, res) => {
  const { id } = req.params
  const { notFound, wrongStatus, data: existing } = await loadSessionInStatus(id, 'pending')
  if (notFound) return res.status(404).json({ error: 'Session minutes not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Session minutes is not pending review.' })
  try {
    const { data, error } = await supabase
      .from('session_minutes')
      .update({ status: 'ready_to_publish', reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'ACCEPT', 'Sessions', `Accepted draft session: ${existing.session_number || id}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/session-minutes/:id/request-changes ─────────────────────────────
// Secretary — pending → needs_revision, requires an accompanying comment
router.put('/:id/request-changes', verifyToken, secretaryOnly, async (req, res) => {
  const { id } = req.params
  const { comment } = req.body
  if (!comment?.trim()) return res.status(400).json({ error: 'A comment is required when requesting changes.' })
  const { notFound, wrongStatus, data: existing } = await loadSessionInStatus(id, 'pending')
  if (notFound) return res.status(404).json({ error: 'Session minutes not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Session minutes is not pending review.' })
  try {
    const { error: commentErr } = await supabase.from('comments').insert({
      entity_type: 'session_minutes',
      entity_id: id,
      author_id: req.user.id,
      author_role: req.user.position || req.user.role,
      text: comment.trim(),
    })
    if (commentErr) return res.status(500).json({ error: commentErr.message })

    const { data, error } = await supabase
      .from('session_minutes')
      .update({ status: 'needs_revision', reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'REQUEST_CHANGES', 'Sessions', `Requested changes on draft session: ${existing.session_number || id}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/session-minutes/:id/vm-approve ──────────────────────────────────
// Vice-Mayor — ready_to_publish → approved
router.put('/:id/vm-approve', verifyToken, viceMayorOnly, async (req, res) => {
  const { id } = req.params
  const { notFound, wrongStatus, data: existing } = await loadSessionInStatus(id, 'ready_to_publish')
  if (notFound) return res.status(404).json({ error: 'Session minutes not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Session minutes is not ready for Vice-Mayor approval.' })
  try {
    const { data, error } = await supabase
      .from('session_minutes')
      .update({ status: 'approved', reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'VM_APPROVE', 'Sessions', `Vice-Mayor approved: ${existing.session_number || id}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/session-minutes/:id/publish ─────────────────────────────────────
// Secretary — approved → published
router.put('/:id/publish', verifyToken, secretaryOnly, async (req, res) => {
  const { id } = req.params
  const { notFound, wrongStatus, data: existing } = await loadSessionInStatus(id, 'approved')
  if (notFound) return res.status(404).json({ error: 'Session minutes not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Session minutes is not approved for publishing.' })
  try {
    const { data, error } = await supabase
      .from('session_minutes')
      .update({ status: 'published' })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'PUBLISH', 'Sessions', `Published: ${existing.session_number || id}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/session-minutes/:id/resubmit ────────────────────────────────────
// Clerk — needs_revision → pending
router.put('/:id/resubmit', verifyToken, clerkOnly, async (req, res) => {
  const { id } = req.params
  const { notFound, wrongStatus, data: existing } = await loadSessionInStatus(id, 'needs_revision')
  if (notFound) return res.status(404).json({ error: 'Session minutes not found.' })
  if (wrongStatus) return res.status(400).json({ error: 'Session minutes is not awaiting revision.' })
  try {
    const { data, error } = await supabase
      .from('session_minutes')
      .update({ status: 'pending' })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'RESUBMIT', 'Sessions', `Resubmitted draft after revision: ${existing.session_number || id}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
