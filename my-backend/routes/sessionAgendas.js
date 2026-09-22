const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, secretaryOrClerk, canCreateDraft } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { extractMetaHandler } = require('../helpers/documentMeta')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')
const { SESSION_VENUE, applyTokenSearch } = require('../helpers/utils')
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
    const { year, search, type, date } = req.query
    let query = supabase
      .from('session_agendas')
      .select('*', { count: 'exact' })
      .order('session_date', { ascending: false })
    if (type && type !== 'all') query = query.eq('session_type', type)
    if (year && /^\d{4}$/.test(year)) {
      query = query.gte('session_date', `${year}-01-01`).lt('session_date', `${Number(year) + 1}-01-01`)
    }
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) query = query.eq('session_date', date)
    if (search) query = applyTokenSearch(query, search, ['session_number', 'session_type', 'venue'])
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
    if (error || !data) return res.status(404).json({ error: 'Order of business not found.' })
    res.json({ ...data, filekind: fileKind(data.filetype) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/session-agendas/upload — open to all four positions (Secretary,
// Clerk, Councilor, Vice-Mayor), same as canCreateDraft for the other
// legislative record types. No draft/review step: the agenda is meant to be
// seen ahead of the meeting it's for, so it goes live the moment it's
// uploaded.
// POST /api/session-agendas/extract-meta — reads the chosen file and suggests the session's
// title (number), type, date and venue for the upload form to prefill. Nothing
// is saved. Same reader as ordinances/resolutions (Word, PDF text, OCR).
router.post('/extract-meta', verifyToken, canCreateDraft, upload.single('file'), handleMulterError, extractMetaHandler('agenda'))

router.post('/upload', verifyToken, canCreateDraft, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  if (!ALLOWED_MIMES.includes(req.file.mimetype))
    return res.status(400).json({ error: 'Only PDF or Word documents are allowed for an order of business.' })
  const { session_number, session_date, session_type, venue } = req.body
  if (!session_date) return res.status(400).json({ error: 'Date is required.' })

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
        venue: venue || SESSION_VENUE,
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

    await logActivity(req, 'UPLOAD', 'Session Agendas', `Uploaded order of business: ${session_number || session_date}`)
    notifyAllStaff({
      message: `New order of business posted: ${session_number || session_date}`,
      entityType: 'session_agenda', entityId: data.id,
      emailSubject: `New Order of Business: ${session_number || session_date}`,
      emailHtml: notificationEmailHtml(
        'New Order of Business Posted',
        `A new order of business was posted${session_number ? ` <strong>${session_number}</strong>` : ''} for ${new Date(session_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}.`
      ),
    })
    res.json({ success: true, id: data.id, data: { ...data, filekind: fileKind(data.filetype) } })
  } catch (err) {
    console.error('Order of business upload error:', err)
    if (fileName) await deleteFromStorage(fileName)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/session-agendas/:id — Secretary/Clerk only. Metadata edit, with
// an optional file replacement in the same request.
router.put('/:id', verifyToken, secretaryOrClerk, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  const { session_number, session_date, session_type, venue } = req.body
  if (!session_date) return res.status(400).json({ error: 'Date is required.' })
  if (req.file && !ALLOWED_MIMES.includes(req.file.mimetype))
    return res.status(400).json({ error: 'Only PDF or Word documents are allowed for an order of business.' })

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('session_agendas').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Order of business not found.' })

    const updateData = {
      session_number: session_number || null,
      session_date,
      session_type: session_type || 'regular',
      // Same default as upload — an empty Venue on edit shouldn't lose the
      // hall's name, since the Edit form always starts pre-filled with it.
      venue: venue || SESSION_VENUE,
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

    await logActivity(req, 'UPDATE', 'Session Agendas', `Updated order of business: ${data.session_number || id}`)
    res.json({ success: true, data: { ...data, filekind: fileKind(data.filetype) } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/session-agendas/:id — Secretary/Clerk only. A plain hard
// an archive, not a hard delete (migration 030): archive_session_agenda()
// snapshots the row into `archives` and removes it from the live table, and the
// Secretary can restore it or delete it for good from the Archives page. The
// stored file is kept while it sits in the archive, so a restore brings it back.
router.delete('/:id', verifyToken, secretaryOrClerk, async (req, res) => {
  try {
    const { data: snapshot, error } = await supabase.rpc('archive_session_agenda', {
      p_id: req.params.id,
      p_archived_by: req.user.id,
    })
    if (error) {
      if (error.code === 'P0002') return res.status(404).json({ error: 'Order of business not found.' })
      // PGRST202: the function isn't in the database yet (migration 030 not run).
      if (error.code === 'PGRST202')
        return res.status(500).json({ error: 'Archiving order of business needs a database update (migration 030) — please ask the administrator to run it.' })
      return res.status(500).json({ error: error.message })
    }

    await logActivity(req, 'ARCHIVE', 'Session Agendas', `Archived order of business: ${snapshot?.session_number || req.params.id}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
