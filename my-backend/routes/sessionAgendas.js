const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, secretaryOrClerk } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')
const { orIlikeClause } = require('../helpers/utils')
const { notifyAllStaff, notificationEmailHtml } = require('../helpers/notify')

// An agenda is always a typed document, never a scanned photo — unlike
// ordinances/resolutions/session_minutes, images aren't accepted here even
// though the shared multer filter (middleware/multer.js) allows them for
// the other legislative record types.
const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const isWordMime = (mime) =>
  mime === 'application/msword' ||
  mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
// `filekind` tells the frontend which badge/icon to show without it having
// to know the raw mime strings itself.
const fileKind = (mime) => (mime === 'application/pdf' ? 'pdf' : isWordMime(mime) ? 'word' : 'other')

// GET /api/session-agendas
// No status/review-workflow column on this table (see migrations/018) — an
// upload is immediately visible to every caller, so unlike ordinances/
// resolutions/session_minutes there's no status filter here at all.
router.get('/', verifyToken, async (req, res) => {
  try {
    const { year, search, type } = req.query
    let query = supabase
      .from('session_agendas')
      .select('*', { count: 'exact' })
      .order('session_date', { ascending: false })
    if (type && type !== 'all') query = query.eq('session_type', type)
    if (year && /^\d{4}$/.test(year)) {
      query = query.gte('session_date', `${year}-01-01`).lt('session_date', `${Number(year) + 1}-01-01`)
    }
    if (search) query = query.or(`${orIlikeClause('session_number', search)},${orIlikeClause('venue', search)}`)
    const page = req.query.page ? Math.max(parseInt(req.query.page) || 1, 1) : null
    const limit = req.query.limit ? Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100) : null
    if (page && limit) query = query.range((page - 1) * limit, page * limit - 1)
    const { data, error, count } = await query
    if (error) return res.status(500).json({ error: error.message })
    const parsed = data.map((a) => ({ ...a, filekind: fileKind(a.filetype) }))
    if (page && limit) {
      return res.json({ data: parsed, total: count ?? parsed.length, page, limit, totalPages: Math.max(Math.ceil((count ?? parsed.length) / limit), 1) })
    }
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/session-agendas/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('session_agendas').select('*').eq('id', req.params.id).single()
    if (error || !data) return res.status(404).json({ error: 'Session agenda not found.' })
    res.json({ ...data, filekind: fileKind(data.filetype) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/session-agendas/upload — Secretary/Clerk only. No draft/review
// step: the agenda is meant to be seen ahead of the meeting it's for, so it
// goes live the moment it's uploaded.
router.post('/upload', verifyToken, secretaryOrClerk, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  if (!ALLOWED_MIMES.includes(req.file.mimetype))
    return res.status(400).json({ error: 'Only PDF or Word documents are allowed for a session agenda.' })
  const { session_number, session_date, session_type, venue } = req.body
  if (!session_date) return res.status(400).json({ error: 'Session date is required.' })

  let fileName = null
  try {
    const uploadResult = await uploadToStorage(req.file, 'session-agendas')
    fileName = uploadResult.fileName

    const { data, error } = await supabase
      .from('session_agendas')
      .insert({
        session_number: session_number || null,
        session_date,
        session_type: session_type || 'regular',
        venue: venue || null,
        filename: req.file.originalname,
        filetype: req.file.mimetype,
        filepath: fileName,
        created_by: req.user.id,
      })
      .select().single()

    if (error) {
      await deleteFromStorage(fileName)
      return res.status(500).json({ error: error.message })
    }

    await logActivity(req, 'UPLOAD', 'Session Agendas', `Uploaded session agenda: ${session_number || session_date}`)
    notifyAllStaff({
      message: `New session agenda posted: ${session_number || session_date}`,
      entityType: 'session_agenda', entityId: data.id,
      emailSubject: `New Session Agenda: ${session_number || session_date}`,
      emailHtml: notificationEmailHtml(
        'New Session Agenda Posted',
        `A new agenda was posted for the upcoming session${session_number ? ` <strong>${session_number}</strong>` : ''} on ${new Date(session_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}.`
      ),
    })
    res.json({ success: true, id: data.id, data: { ...data, filekind: fileKind(data.filetype) } })
  } catch (err) {
    console.error('Session agenda upload error:', err)
    if (fileName) await deleteFromStorage(fileName)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/session-agendas/:id — Secretary/Clerk only. Metadata edit, with
// an optional file replacement in the same request.
router.put('/:id', verifyToken, secretaryOrClerk, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  const { session_number, session_date, session_type, venue } = req.body
  if (!session_date) return res.status(400).json({ error: 'Session date is required.' })
  if (req.file && !ALLOWED_MIMES.includes(req.file.mimetype))
    return res.status(400).json({ error: 'Only PDF or Word documents are allowed for a session agenda.' })

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('session_agendas').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Session agenda not found.' })

    const updateData = {
      session_number: session_number || null,
      session_date,
      session_type: session_type || 'regular',
      venue: venue || null,
    }

    if (req.file) {
      const { fileName } = await uploadToStorage(req.file, 'session-agendas')
      updateData.filename = req.file.originalname
      updateData.filetype = req.file.mimetype
      updateData.filepath = fileName
      // Only delete the old stored file after the new one is confirmed uploaded.
      if (existing.filepath) await deleteFromStorage(existing.filepath)
    }

    const { data, error } = await supabase
      .from('session_agendas').update(updateData).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })

    await logActivity(req, 'UPDATE', 'Session Agendas', `Updated session agenda: ${data.session_number || id}`)
    res.json({ success: true, data: { ...data, filekind: fileKind(data.filetype) } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/session-agendas/:id — Secretary/Clerk only. A plain hard
// delete, not an archive: see migrations/018's note on why this module
// skips the `archives` table that ordinances/resolutions/session_minutes use.
router.delete('/:id', verifyToken, secretaryOrClerk, async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('session_agendas').select('*').eq('id', req.params.id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Session agenda not found.' })

    const { error } = await supabase.from('session_agendas').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })

    if (existing.filepath) await deleteFromStorage(existing.filepath)

    await logActivity(req, 'DELETE', 'Session Agendas', `Deleted session agenda: ${existing.session_number || existing.id}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
