const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const os = require('os')
const Tesseract = require('tesseract.js')
const PDFParser = require('pdf2json')

const supabase = require('../config/supabase')
const { verifyToken, canCreateDraft, pendingEditors, secretaryOnly } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')
const { safeParseJSON, escapeHtml, canEditLegislativeRecord, orIlikeClause, parseYearField, dayBoundsUTC, yearInManila } = require('../helpers/utils')
const { resolveCurrentTermId, findRecordIdsByAuthorName } = require('../helpers/officials')
const { createLegislativeReviewRoutes } = require('../helpers/legislativeReviewRoutes')
const { extractMetaHandler, storedMetaHandler } = require('../helpers/documentMeta')
const { createOfficialRoleRoutes } = require('../helpers/officialRoleRoutes')
const { notifyByPosition, notificationEmailHtml } = require('../helpers/notify')

// Historical-accuracy note: `term.position` is the specific membership
// current when this official was linked (see resolveCurrentTermId and
// migrations/004). It's null only for a row that predates term_id (the
// person had zero terms at link time, so there was nothing to snapshot) —
// sb_council_members.position was dropped (migrations/006), so there's no
// further fallback for that edge case; it just shows no position.
// `role` scopes which tagged officials come back — 'author' (the default,
// single-select, set at draft/upload time), 'co_author', or 'sponsor' (both
// only addable once the draft reaches a reading stage — see
// helpers/officialRoleRoutes.js). Omitting it returns everyone regardless
// of role, which no current caller needs but keeps this general-purpose.
const mapOfficials = (ordinanceOfficials, role) =>
  (ordinanceOfficials || [])
    .filter((oo) => !role || oo.role === role)
    .map((oo) => {
      const person = oo.sb_council_members
      if (!person) return null
      return {
        id: person.id,
        full_name: person.full_name,
        photo: person.photo,
        position: oo.term?.position || null,
      }
    })
    .filter(Boolean)

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
// Auth-gated — drafts/pending review copies live here alongside published
// ones. A caller that doesn't ask for a specific status gets published-only
// (matching content_posts' public-safe default); the review queues (see
// OrdinancesPage.jsx) pass an explicit status list to see drafts, and the
// admin dashboard's own counts/recent-activity view passes status=all to see
// every status without the caller having to enumerate them.
//
// Pagination is opt-in: pass both page and limit to get back
// { data, total, page, limit, totalPages } instead of a bare array. Existing
// callers that don't paginate (the pending queues, the dashboard's full-list
// fetch, PendingRecordsWidget) are unaffected — this only changes behavior
// for a caller that explicitly asks for a page.
router.get('/', verifyToken, async (req, res) => {
  try {
    const { year, search, category, author, date } = req.query

    // Author searches the real `officials` relation (who's tagged on the
    // record), not a free-text field — see findRecordIdsByAuthorName for why
    // this is two plain queries instead of a single embedded-resource filter.
    let authorOrdinanceIds = null
    if (author) {
      authorOrdinanceIds = await findRecordIdsByAuthorName('ordinance_officials', 'ordinance_id', author)
      if (authorOrdinanceIds.length === 0) {
        return res.json(req.query.page && req.query.limit
          ? { data: [], total: 0, page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20, totalPages: 1 }
          : [])
      }
    }

    // The main search box is advertised (see its placeholder in
    // OrdinancesPage.jsx) as covering title, number, category, AND author —
    // it used to only actually match title/number, silently going empty for
    // a category or author name typed into it. Resolves `search` against
    // officials names too, same as the dedicated `author` param above, so
    // it's included as one more OR branch rather than a separate AND filter.
    let searchAuthorIds = []
    if (search) {
      searchAuthorIds = await findRecordIdsByAuthorName('ordinance_officials', 'ordinance_id', search)
    }

    // Published records are dated by when they were approved (approved_on),
    // everything else — drafts, pending review, ... — by when it was uploaded.
    const requestedStatuses =
      req.query.status === 'all' ? null : (req.query.status ? req.query.status.split(',') : ['published'])
    const publishedOnly = requestedStatuses?.length === 1 && requestedStatuses[0] === 'published'
    const dateColumn = publishedOnly ? 'approved_on' : 'uploaded_at'

    let query = supabase
      .from('ordinances')
      .select(`*, ordinance_officials (
        official_id, term_id, role,
        sb_council_members ( id, full_name, photo ),
        term:sb_council_member_terms ( id, position, term_period )
      )`, { count: 'exact' })
      .order(dateColumn, { ascending: false, nullsFirst: false })
    if (year) query = query.eq('year', year)
    if (search) {
      const orParts = [
        orIlikeClause('title', search),
        orIlikeClause('ordinance_number', search),
        orIlikeClause('category', search),
      ]
      if (searchAuthorIds.length > 0) orParts.push(`id.in.(${searchAuthorIds.join(',')})`)
      query = query.or(orParts.join(','))
    }
    if (category && category !== 'All') query = query.eq('category', category)
    if (authorOrdinanceIds) query = query.in('id', authorOrdinanceIds)
    if (date) {
      const { start, end } = dayBoundsUTC(date)
      query = query.gte(dateColumn, start).lt(dateColumn, end)
    }
    if (req.query.status !== 'all') {
      const statuses = req.query.status ? req.query.status.split(',') : ['published']
      query = query.in('status', statuses)
      // Rejected drafts are visible system-wide only to the Secretary —
      // every other role only ever sees their own, so a rejected record
      // isn't browsable by anyone but its creator and the Secretary.
      if (statuses.includes('rejected') && req.user.position !== 'secretary') {
        query = query.eq('created_by', req.user.id)
      }
    }
    const page = req.query.page ? Math.max(parseInt(req.query.page) || 1, 1) : null
    const limit = req.query.limit ? Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100) : null
    if (page && limit) query = query.range((page - 1) * limit, page * limit - 1)
    const { data, error, count } = await query
    if (error) return res.status(500).json({ error: error.message })
    const parsed = data.map(o => ({
      ...o,
      officials: mapOfficials(o.ordinance_officials, 'author'),
      co_authors: mapOfficials(o.ordinance_officials, 'co_author'),
      sponsors: mapOfficials(o.ordinance_officials, 'sponsor'),
      ordinance_officials: undefined
    }))
    if (page && limit) {
      return res.json({ data: parsed, total: count ?? parsed.length, page, limit, totalPages: Math.max(Math.ceil((count ?? parsed.length) / limit), 1) })
    }
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/ordinances/:id/print ───────────────────────────────────────────
router.get('/:id/print', verifyToken, async (req, res) => {
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
      <title>${escapeHtml(o.ordinance_number || o.title)}</title>
      <style>
        body { font-family:'Times New Roman',serif; max-width:800px; margin:40px auto; padding:40px; color:#000; }
        h2 { text-align:center; font-size:15px; color:#555; margin-bottom:4px; }
        h1 { text-align:center; font-size:20px; margin:0 0 8px; }
        .meta { text-align:center; font-size:13px; color:#555; margin-bottom:32px; border-bottom:2px solid #000; padding-bottom:16px; }
        .content { font-size:14px; line-height:1.8; white-space:pre-wrap; }
        .print-btn { position:fixed; top:20px; right:20px; padding:10px 20px; background:#1a365d; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; }
        .download-btn { display:inline-block; margin:20px auto; padding:12px 24px; background:#090446; color:#fff; border-radius:8px; text-decoration:none; font-size:14px; }
        @media print { .print-btn { display:none; } }
      </style>
      </head><body>
      <button class="print-btn" onclick="window.print()">🖨 Print</button>
      ${o.ordinance_number ? `<h2>${escapeHtml(o.ordinance_number)}</h2>` : ''}
      <h1>${escapeHtml(o.title)}</h1>
      <div class="meta">${o.year ? `Year: ${escapeHtml(o.year)} &nbsp;|&nbsp;` : ''}Date: ${new Date(o.approved_on || o.uploaded_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      ${isWord
        ? `<div style="text-align:center"><p>This ordinance is stored as a Word document.</p><a href="${encodeURI(fileUrl)}" class="download-btn" download>⬇ Download Word File</a></div>`
        : `<div class="content">${escapeHtml(extractedText) || 'No extracted text available.'}</div>`
      }
      </body></html>`)
  } catch (err) {
    res.status(500).send('Server error')
  }
})

// ─── GET /api/ordinances/:id ──────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { data: o, error } = await supabase
      .from('ordinances')
      .select(`*, ordinance_officials (
        official_id, term_id, role,
        sb_council_members ( id, full_name, photo ),
        term:sb_council_member_terms ( id, position, term_period )
      )`)
      .eq('id', req.params.id)
      .single()
    if (error || !o) return res.status(404).json({ error: 'Not found' })
    const parsed = {
      ...o,
      officials: mapOfficials(o.ordinance_officials, 'author'),
      co_authors: mapOfficials(o.ordinance_officials, 'co_author'),
      sponsors: mapOfficials(o.ordinance_officials, 'sponsor'),
      ordinance_officials: undefined
    }
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/ordinances/extract-meta ────────────────────────────────────────
// Reads an uploaded file (image, PDF incl. scans, Word) and suggests its
// official number and date so the upload form can prefill them. Nothing is
// saved — the user confirms the values before actually uploading. See
// helpers/documentMeta.js.
router.post('/extract-meta', verifyToken, canCreateDraft, upload.single('file'), handleMulterError, extractMetaHandler('ordinance'))

// ─── POST /api/ordinances/:id/detect-meta ─────────────────────────────────────
// Same detection on the record's stored file, for the Publish dialog to
// suggest the official number from the document itself. Secretary only —
// publishing is Secretary's step. Read-only: nothing is saved.
router.post('/:id/detect-meta', verifyToken, secretaryOnly, storedMetaHandler({ table: 'ordinances', kind: 'ordinance' }))

// ─── POST /api/ordinances/upload ─────────────────────────────────────────────
// Any of the four legislative positions can originate a draft — Secretary
// and Vice-Mayor sometimes draft directly rather than only reviewing/
// approving what Clerk/Councilor submit.
router.post('/upload', verifyToken, canCreateDraft, upload.single('file'), handleMulterError, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  const { ordinance_number, title, year, category, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })
  const { year: parsedYear, error: yearError } = parseYearField(year)
  if (yearError) return res.status(400).json({ error: yearError })
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
        year: parsedYear,
        category: category || null,
        filename: req.file.originalname,
        filetype: req.file.mimetype,
        filepath: fileName,
        extracted_text,
        status: 'pending',
        created_by: req.user.id,
      })
      .select().single()

    if (error) {
      await deleteFromStorage(fileName)
      return res.status(500).json({ error: error.message })
    }

    if (officialIds.length > 0) {
      const rows = await Promise.all(officialIds.map(async (oid) => ({
        ordinance_id: ordinance.id,
        official_id: oid,
        term_id: await resolveCurrentTermId(oid),
        role: 'author',
      })))
      const { error: relErr } = await supabase.from('ordinance_officials').insert(rows)
      if (relErr) console.error('ordinance_officials insert error:', relErr.message)
    }

    await logActivity(req, 'UPLOAD', 'Ordinances', `Uploaded ordinance: ${title}`)
    notifyByPosition('secretary', {
      message: `New ordinance draft submitted: ${title}`,
      entityType: 'ordinance', entityId: ordinance.id,
      emailSubject: `New Ordinance Draft: ${title}`,
      emailHtml: notificationEmailHtml(
        'New Ordinance Draft Submitted',
        `A new ordinance draft, <strong>${escapeHtml(title)}</strong>, was submitted and is waiting on your review.`
      ),
    })
    res.json({ success: true, id: ordinance.id, data: ordinance })
  } catch (err) {
    console.error('Ordinance upload error:', err)
    if (fileName) await deleteFromStorage(fileName)
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/ordinances/:id ──────────────────────────────────────────────────
// Who may edit depends on which bucket the record is currently in — see
// canEditLegislativeRecord: Secretary/Clerk only, in any bucket.
router.put('/:id', verifyToken, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  const { ordinance_number, title, year, category, officials } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required.' })
  const { year: parsedYear, error: yearError } = parseYearField(year)
  if (yearError) return res.status(400).json({ error: yearError })

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('ordinances').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Ordinance not found.' })
    if (!canEditLegislativeRecord(req.user.position))
      return res.status(403).json({ error: 'You are not allowed to edit this ordinance.' })

    const updateData = {
      ordinance_number: ordinance_number || null,
      title,
      // Once approved, the record's year is the year it was approved (see
      // helpers/legislativeReviewRoutes.js) — editing the form's date can't
      // move it back to the upload/document year.
      year: existing.approved_on ? yearInManila(existing.approved_on) : parsedYear,
      category: category || null,
    }
    // A Clerk/Councilor edit on a rejected draft doubles as the resubmit —
    // it goes straight back into the Secretary's queue instead of requiring
    // a separate "resubmit" click.
    if (existing.status === 'needs_revision') updateData.status = 'pending'

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
    // Diff against the existing links instead of blanket delete+reinsert on
    // every edit — an official who stays selected keeps their row (and its
    // historical term_id snapshot) completely untouched; only officials
    // actually removed get deleted and only ones actually added get a
    // freshly resolved term_id. Scoped to role='author' throughout — this
    // form only ever edits the Author, so it must never touch (let alone
    // diff away) any Co-Author/Sponsor rows added later via
    // helpers/officialRoleRoutes.js.
    const { data: existingLinks } = await supabase
      .from('ordinance_officials').select('official_id, term_id').eq('ordinance_id', id).eq('role', 'author')
    const existingIds = new Set((existingLinks || []).map(l => l.official_id))
    const newIds = new Set(officialIds)
    const toRemove = [...existingIds].filter(oid => !newIds.has(oid))
    const toAdd = [...newIds].filter(oid => !existingIds.has(oid))

    if (toRemove.length > 0) {
      await supabase.from('ordinance_officials').delete().eq('ordinance_id', id).eq('role', 'author').in('official_id', toRemove)
    }
    if (toAdd.length > 0) {
      const rows = await Promise.all(toAdd.map(async (oid) => ({
        ordinance_id: id,
        official_id: oid,
        term_id: await resolveCurrentTermId(oid),
        role: 'author',
      })))
      const { error: relErr } = await supabase.from('ordinance_officials').insert(rows)
      if (relErr) console.error('ordinance_officials insert error:', relErr.message)
    }

    await logActivity(req, 'UPDATE', 'Ordinances', `Updated ordinance: ${title}`)
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('Ordinance update error:', err)
    res.status(500).json({ error: err.message })
  }
})
// ─── PUT /api/ordinances/:id/replace-file ─────────────────────────────────────
// Secretary/Clerk only (see pendingEditors) — replacing the file is content
// editing, same as PUT /:id above. Overwrites the stored file and bumps
// revision_count.
router.put('/:id/replace-file', verifyToken, pendingEditors, upload.single('file'), handleMulterError, async (req, res) => {
  const { id } = req.params
  if (!req.file) return res.status(400).json({ error: 'A file is required.' })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('ordinances').select('*').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Ordinance not found.' })
    if (!canEditLegislativeRecord(req.user.position))
      return res.status(403).json({ error: 'You are not allowed to replace this file.' })

    const extracted_text = await extractText(req.file)
    const { fileName } = await uploadToStorage(req.file, 'ordinances')

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
      .from('ordinances')
      .update(updateData)
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })

    if (existing.filepath) await deleteFromStorage(existing.filepath)

    await logActivity(req, 'REPLACE_FILE', 'Ordinances', `Replaced draft file for ordinance: ${existing.title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Review workflow + archive: accept/request-changes/vm-approve/publish/
// DELETE — shared across ordinances/resolutions/session_minutes, see
// helpers/legislativeReviewRoutes.js.
router.use('/', createLegislativeReviewRoutes({
  table: 'ordinances',
  entityType: 'ordinance',
  activityModule: 'Ordinances',
  singularLabel: 'Ordinance',
  archiveRpc: 'archive_ordinance',
  labelOf: (r) => r.title,
  numberField: 'ordinance_number',
  numberLabel: 'Ordinance number',
  approvedDateField: 'approved_on',
  hasReadings: true,
}))

// Co-Author/Sponsor tagging — see helpers/officialRoleRoutes.js.
router.use('/', createOfficialRoleRoutes({
  table: 'ordinance_officials',
  parentTable: 'ordinances',
  idColumn: 'ordinance_id',
  activityModule: 'Ordinances',
  singularLabel: 'Ordinance',
}))

module.exports = router