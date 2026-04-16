const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const os = require('os')
const Tesseract = require('tesseract.js')

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { logActivity } = require('../helpers/logger')

// GET /api/session-minutes
router.get('/', async (req, res) => {
  try {
    const { month, year, type } = req.query
    let query = supabase
      .from('session_minutes')
      .select('id, session_number, session_date, session_type, venue, agenda, minutes_text, filename, filetype, created_at')
      .order('session_date', { ascending: false })
    if (type && type !== 'all') query = query.eq('session_type', type)
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
        minutes_text: minutes_text || null
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'CREATE', 'Sessions', `Added session: ${session_number || session_date}`)
    res.json({ success: true, id: data.id, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/session-minutes/upload-image
router.post('/upload-image', verifyToken, adminOnly, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' })
  const { session_number, session_date, session_type, venue, agenda, ocr_target, minutes_text } = req.body
  if (!session_date) return res.status(400).json({ error: 'Session date is required.' })
  let tempPath = null
  try {
    tempPath = path.join(os.tmpdir(), `${Date.now()}-${req.file.originalname}`)
    fs.writeFileSync(tempPath, req.file.buffer)
    const { data: { text } } = await Tesseract.recognize(tempPath, 'eng')
    fs.unlinkSync(tempPath)
    tempPath = null
    const extractedText = text.trim()
    const minutesTextFinal = ocr_target !== 'agenda' ? extractedText : (minutes_text || null)
    const agendaFinal = ocr_target === 'agenda' ? extractedText : (agenda || null)
    const { data, error } = await supabase
      .from('session_minutes')
      .insert({
        session_number: session_number || null,
        session_date,
        session_type: session_type || 'regular',
        venue: venue || null,
        agenda: agendaFinal,
        minutes_text: minutesTextFinal,
        filename: req.file.originalname,
        filetype: req.file.mimetype
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPLOAD', 'Sessions', `Uploaded session (OCR): ${session_number || session_date}`)
    res.json({ success: true, id: data.id, extracted_text: extractedText, ocr_target, data })
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
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('session_minutes').select('id, session_number').eq('id', req.params.id).single()
    if (!existing) return res.status(404).json({ error: 'Session minutes not found.' })
    const { error } = await supabase
      .from('session_minutes').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'DELETE', 'Sessions', `Deleted session: ${existing.session_number || req.params.id}`)
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

module.exports = router
