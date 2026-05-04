const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const os = require('os')
const Tesseract = require('tesseract.js')
const PDFParser = require('pdf2json')

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')
const { safeParseJSON } = require('../helpers/utils')

// GET /api/ordinances
router.get('/', async (req, res) => {
  try {
    const { year, search } = req.query
    let query = supabase
      .from('ordinances')
      .select(`*, ordinance_officials ( sb_council_members ( id, full_name, position, photo ) )`)
      .order('uploaded_at', { ascending: false })
    if (year) query = query.eq('year', year)
    if (search) query = query.ilike('title', `%${search}%`)
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

router.get('/:id/print', async (req, res) => {
  try {
    const { data: o, error } = await supabase
      .from('ordinances').select('*').eq('id', req.params.id).single()
    if (error || !o) return res.status(404).send('Not found')

    console.log('ORDINANCE DEBUG:', {
      id: o.id,
      filetype: o.filetype,
      filepath: o.filepath,
      has_extracted_text: !!o.extracted_text,
      extracted_text_preview: o.extracted_text?.slice(0, 100)
    })

    let extractedText = o.extracted_text || ''

    if (o.filetype === 'application/pdf' && !extractedText) {
      try {
        const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/assets/${o.filepath}`
        console.log('Fetching PDF from:', fileUrl)
        const response = await fetch(fileUrl)
        console.log('Fetch status:', response.status)
        if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log('Buffer size:', buffer.length)

        extractedText = await new Promise((resolve) => {
          const pdfParser = new PDFParser()
          pdfParser.on('pdfParser_dataReady', (data) => {
            console.log('PDF pages found:', data.Pages?.length)
            const text = data.Pages
              ?.flatMap(p => p.Texts)
              ?.map(t => decodeURIComponent(t.R?.[0]?.T || ''))
              ?.join(' ')
              ?.trim() || ''
            console.log('Extracted text length:', text.length)
            console.log('Extracted text preview:', text.slice(0, 200))
            resolve(text)
          })
          pdfParser.on('pdfParser_dataError', (err) => {
            console.log('PDFParser error:', err)
            resolve('')
          })
          pdfParser.parseBuffer(buffer)
        })

        if (extractedText) {
          await supabase.from('ordinances')
            .update({ extracted_text: extractedText })
            .eq('id', o.id)
          console.log('Cached extracted text to DB')
        } else {
          console.log('No text extracted from PDF')
        }
      } catch (pdfErr) {
        console.error('PDF block error:', pdfErr.message)
        extractedText = ''
      }
    }

    res.send(`<!DOCTYPE html><html><head>
      <title>${o.ordinance_number || o.title}</title>
      <style>
        body { font-family:'Times New Roman',serif; max-width:800px; margin:40px auto; padding:40px; color:#000; }
        h2 { text-align:center; font-size:15px; color:#555; margin-bottom:4px; }
        h1 { text-align:center; font-size:20px; margin:0 0 8px; }
        .meta { text-align:center; font-size:13px; color:#555; margin-bottom:32px; border-bottom:2px solid #000; padding-bottom:16px; }
        .content { font-size:14px; line-height:1.8; white-space:pre-wrap; }
        .print-btn { position:fixed; top:20px; right:20px; padding:10px 20px; background:#1a365d; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; }
        @media print { .print-btn { display:none; } }
      </style>
      </head><body>
      <button class="print-btn" onclick="window.print()">🖨 Print</button>
      ${o.ordinance_number ? `<h2>${o.ordinance_number}</h2>` : ''}
      <h1>${o.title}</h1>
      <div class="meta">${o.year ? `Year: ${o.year} &nbsp;|&nbsp;` : ''}Date: ${new Date(o.uploaded_at).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</div>
      <div class="content">${extractedText || 'No extracted text available.'}</div>
      </body></html>`)
  } catch (err) {
    res.status(500).send('Server error')
  }
})

// GET /api/ordinances/:id
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

// POST /api/ordinances/upload
router.post('/upload', verifyToken, adminOnly, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  const { ordinance_number, title, year, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })
  const officialIds = safeParseJSON(officials, [])
  try {
    const { fileName } = await uploadToStorage(req.file, 'ordinances')

    // Extract text from PDF at upload time so View works instantly
    let extracted_text = null
    if (req.file.mimetype === 'application/pdf') {
      try {
       extracted_text = await new Promise((resolve) => {
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
  pdfParser.parseBuffer(buffer)
})
      } catch (pdfErr) {
        console.error('PDF parse error on upload:', pdfErr.message)
      }
    }

    const { data: ordinance, error } = await supabase
      .from('ordinances')
      .insert({
        ordinance_number: ordinance_number || null,
        title,
        year: year ? parseInt(year) : null,
        filename: req.file.originalname,
        filetype: req.file.mimetype,
        filepath: fileName,
        extracted_text
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
    res.status(500).json({ error: err.message })
  }
})

// POST /api/ordinances/upload-image-text
router.post('/upload-image-text', verifyToken, adminOnly, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  const { ordinance_number, title, year, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })
  const officialIds = safeParseJSON(officials, [])
  let tempPath = null
  try {
    tempPath = path.join(os.tmpdir(), `${Date.now()}-${req.file.originalname}`)
    fs.writeFileSync(tempPath, req.file.buffer)
    const { data: { text } } = await Tesseract.recognize(tempPath, 'eng')
    fs.unlinkSync(tempPath)
    tempPath = null
    const { fileName } = await uploadToStorage(req.file, 'ordinances')
    const { data: ordinance, error } = await supabase
      .from('ordinances')
      .insert({
        ordinance_number: ordinance_number || null,
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
      await supabase.from('ordinance_officials').insert(
        officialIds.map(oid => ({ ordinance_id: ordinance.id, official_id: oid }))
      )
    }
    await logActivity(req, 'UPLOAD', 'Ordinances', `Uploaded ordinance (OCR): ${title}`)
    res.json({ success: true, id: ordinance.id, text: text.trim(), data: ordinance })
  } catch (err) {
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/ordinances/:id
router.put('/:id', verifyToken, adminOnly, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  const { ordinance_number, title, year, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('ordinances').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Ordinance not found.' })
    const updateData = { ordinance_number: ordinance_number || null, title, year: year ? parseInt(year) : null }
    if (req.file) {
      if (existing.filepath) await deleteFromStorage(existing.filepath)
      const { fileName } = await uploadToStorage(req.file, 'ordinances')
      updateData.filename = req.file.originalname
      updateData.filetype = req.file.mimetype
      updateData.filepath = fileName

      // Re-extract text if a new PDF file was uploaded
      if (req.file.mimetype === 'application/pdf') {
        try {
          extracted_text = await new Promise((resolve) => {
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
  pdfParser.parseBuffer(buffer)
})
        } catch (pdfErr) {
          console.error('PDF parse error on update:', pdfErr.message)
        }
      } else {
        // If replaced with a non-PDF, clear old extracted text
        updateData.extracted_text = null
      }
    }
    const { data: updated, error } = await supabase
      .from('ordinances').update(updateData).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await supabase.from('ordinance_officials').delete().eq('ordinance_id', id)
    const officialIds = safeParseJSON(officials, [])
    if (officialIds.length > 0) {
      await supabase.from('ordinance_officials').insert(
        officialIds.map(oid => ({ ordinance_id: id, official_id: oid }))
      )
    }
    await logActivity(req, 'UPDATE', 'Ordinances', `Updated ordinance: ${title}`)
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/ordinances/:id
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('ordinances').select('filepath, title').eq('id', req.params.id).single()
    if (!existing) return res.status(404).json({ error: 'Ordinance not found.' })
    if (existing.filepath) await deleteFromStorage(existing.filepath)
    await supabase.from('ordinance_officials').delete().eq('ordinance_id', req.params.id)
    const { error } = await supabase.from('ordinances').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'DELETE', 'Ordinances', `Deleted ordinance: ${existing.title}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router