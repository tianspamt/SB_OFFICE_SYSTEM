const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const os = require('os')
const Tesseract = require('tesseract.js')

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')
const { safeParseJSON } = require('../helpers/utils')

// GET /api/resolutions
router.get('/', async (req, res) => {
  try {
    const { year, search } = req.query
    let query = supabase
      .from('resolutions')
      .select(`*, resolution_officials ( sb_council_members ( id, full_name, position, photo ) )`)
      .order('uploaded_at', { ascending: false })
    if (year) query = query.eq('year', year)
    if (search) query = query.ilike('title', `%${search}%`)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    const parsed = data.map(r => ({
      ...r,
      officials: r.resolution_officials?.map(ro => ro.sb_council_members).filter(Boolean) || [],
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
      .select(`*, resolution_officials ( sb_council_members ( id, full_name, position, photo ) )`)
      .eq('id', req.params.id).single()
    if (error) return res.status(500).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'Resolution not found.' })
    const parsed = {
      ...data,
      officials: data.resolution_officials?.map(ro => ro.sb_council_members).filter(Boolean) || [],
      resolution_officials: undefined
    }
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/resolutions/upload
router.post('/upload', verifyToken, adminOnly, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  const { resolution_number, title, year, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })
  const officialIds = safeParseJSON(officials, [])
  try {
    const { fileName } = await uploadToStorage(req.file, 'resolutions')
    const { data: resolution, error } = await supabase
      .from('resolutions')
      .insert({
        resolution_number: resolution_number || null,
        title,
        year: year ? parseInt(year) : null,
        filename: req.file.originalname,
        filetype: req.file.mimetype,
        filepath: fileName
      })
      .select().single()
    if (error) {
      await deleteFromStorage(fileName)
      return res.status(500).json({ error: error.message })
    }
    if (officialIds.length > 0) {
      await supabase.from('resolution_officials').insert(
        officialIds.map(oid => ({ resolution_id: resolution.id, official_id: oid }))
      )
    }
    await logActivity(req, 'UPLOAD', 'Resolutions', `Uploaded resolution: ${title}`)
    res.json({ success: true, id: resolution.id, data: resolution })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/resolutions/upload-image-text
router.post('/upload-image-text', verifyToken, adminOnly, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  const { resolution_number, title, year, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })
  const officialIds = safeParseJSON(officials, [])
  let tempPath = null
  try {
    tempPath = path.join(os.tmpdir(), `${Date.now()}-${req.file.originalname}`)
    fs.writeFileSync(tempPath, req.file.buffer)
    const { data: { text } } = await Tesseract.recognize(tempPath, 'eng')
    fs.unlinkSync(tempPath)
    tempPath = null
    const { fileName } = await uploadToStorage(req.file, 'resolutions')
    const { data: resolution, error } = await supabase
      .from('resolutions')
      .insert({
        resolution_number: resolution_number || null,
        title,
        year: year ? parseInt(year) : null,
        filename: req.file.originalname,
        filetype: req.file.mimetype,
        filepath: fileName,
        extracted_text: text.trim()
      })
      .select().single()
    if (error) {
      await deleteFromStorage(fileName)
      return res.status(500).json({ error: error.message })
    }
    if (officialIds.length > 0) {
      await supabase.from('resolution_officials').insert(
        officialIds.map(oid => ({ resolution_id: resolution.id, official_id: oid }))
      )
    }
    await logActivity(req, 'UPLOAD', 'Resolutions', `Uploaded resolution (OCR): ${title}`)
    res.json({ success: true, id: resolution.id, text: text.trim(), data: resolution })
  } catch (err) {
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
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
    await supabase.from('resolution_officials').delete().eq('resolution_id', id)
    const officialIds = safeParseJSON(officials, [])
    if (officialIds.length > 0) {
      await supabase.from('resolution_officials').insert(
        officialIds.map(oid => ({ resolution_id: id, official_id: oid }))
      )
    }
    await logActivity(req, 'UPDATE', 'Resolutions', `Updated resolution: ${title}`)
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/resolutions/:id
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('resolutions').select('filepath, title').eq('id', req.params.id).single()
    if (!existing) return res.status(404).json({ error: 'Resolution not found.' })
    if (existing.filepath) await deleteFromStorage(existing.filepath)
    await supabase.from('resolution_officials').delete().eq('resolution_id', req.params.id)
    const { error } = await supabase.from('resolutions').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'DELETE', 'Resolutions', `Deleted resolution: ${existing.title}`)
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

module.exports = router
