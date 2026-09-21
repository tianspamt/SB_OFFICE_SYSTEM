// Reads an uploaded ordinance/resolution file and suggests its official number
// and date, for the upload form to prefill. Suggestion only — nothing is
// saved, and the user confirms the values before submitting.
//
// Word files and PDFs with a text layer are read directly. Images and
// *scanned* PDFs go through OCR, and because no single image clean-up wins on
// every scan (see OCR_MODES in documentText.js), OCR'd documents are read in
// up to three passes: each pass stops the search as soon as both a number and
// a date have been found with reasonable confidence, and otherwise its
// findings are merged with what earlier passes found.

const supabase = require('../config/supabase')
const { downloadFromStorage } = require('./storage')
const { readDocument, ocrPages, ocrBacklog, OCR_MODES } = require('./documentText')
const { extractLegislativeMeta } = require('./legislativeMeta')

// Total time OCR may keep working on one upload before giving up on further
// pages/passes and reporting whatever has been found so far.
const OCR_TIME_BUDGET_MS = 60 * 1000
// One OCR worker, seconds per page — beyond this many queued pages a new
// request would just sit for minutes, so it's asked to retry instead.
const MAX_OCR_BACKLOG = 8

const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 }
const rank = (c) => CONFIDENCE_RANK[c] || 0
const yearOf = (isoDate) => Number(isoDate.slice(0, 4))

const EMPTY = {
  number: null, numberRaw: null, numberConfidence: null, numberYear: null,
  date: null, dateRaw: null, dateConfidence: null, dateCandidates: [],
}

// Per field, keep whichever pass was more confident (earlier pass wins ties);
// date runners-up from every pass are pooled for the year cross-check below.
const merge = (best, next) => {
  const takeNumber = rank(next.numberConfidence) > rank(best.numberConfidence)
  const takeDate = rank(next.dateConfidence) > rank(best.dateConfidence)
  const pool = new Map()
  for (const c of [...best.dateCandidates, ...next.dateCandidates]) {
    const seen = pool.get(c.value)
    if (!seen || c.score > seen.score) pool.set(c.value, c)
  }
  return {
    number: takeNumber ? next.number : best.number,
    numberRaw: takeNumber ? next.numberRaw : best.numberRaw,
    numberConfidence: takeNumber ? next.numberConfidence : best.numberConfidence,
    numberYear: takeNumber ? next.numberYear : best.numberYear,
    date: takeDate ? next.date : best.date,
    dateRaw: takeDate ? next.dateRaw : best.dateRaw,
    dateConfidence: takeDate ? next.dateConfidence : best.dateConfidence,
    dateCandidates: [...pool.values()],
  }
}

const isSolid = (m) => rank(m.numberConfidence) >= 2 && rank(m.dateConfidence) >= 2

// OCR's commonest slip on an old scan is one wrong digit in the year ("1998"
// read as "1993"). The record's own number usually carries a year too
// ("2026-011", "Series of 1998"), so if the chosen date disagrees with it but
// another date found in the document agrees, prefer that one. If nothing
// agrees, keep the pick and flag the mismatch so the user looks twice.
const finalize = (found) => {
  let { date, dateRaw, dateConfidence } = found
  const { numberYear } = found

  if (date && numberYear && yearOf(date) !== numberYear) {
    const consistent = found.dateCandidates
      .filter((c) => yearOf(c.value) === numberYear && rank(c.confidence) >= 2)
      .sort((a, b) => b.score - a.score)[0]
    if (consistent) ({ value: date, raw: dateRaw, confidence: dateConfidence } = consistent)
  }

  return {
    number: found.number,
    numberRaw: found.numberRaw,
    numberConfidence: found.numberConfidence,
    date,
    dateRaw,
    dateConfidence,
    year: date ? yearOf(date) : numberYear,
    yearMismatch: Boolean(date && numberYear && yearOf(date) !== numberYear),
  }
}

// options: { preferApproved } — see extractDate in legislativeMeta.js.
async function extractRecordMeta(file, kind, options = {}) {
  const started = Date.now()
  const doc = await readDocument(file)

  if (doc.text !== undefined) {
    return { ...finalize(extractLegislativeMeta(doc.text, kind, options)), method: doc.method, ocrPasses: 0 }
  }

  const deadline = started + OCR_TIME_BUDGET_MS
  let found = EMPTY
  let passes = 0
  for (const mode of OCR_MODES) {
    if (passes > 0 && Date.now() >= deadline) break
    const text = await ocrPages(doc.images, mode, { deadline })
    found = merge(found, extractLegislativeMeta(text, kind, options))
    passes++
    if (isSolid(found)) break
  }
  return { ...finalize(found), method: doc.method, ocrPasses: passes }
}

const BUSY_MESSAGE = 'Document reading is busy right now. Please try again in a moment.'

const toResponse = (meta) => ({
  success: true,
  found: Boolean(meta.number || meta.date),
  data: {
    number: meta.number,
    numberRaw: meta.numberRaw,
    numberConfidence: meta.numberConfidence,
    date: meta.date,
    dateRaw: meta.dateRaw,
    dateConfidence: meta.dateConfidence,
    year: meta.year,
    yearMismatch: meta.yearMismatch,
    method: meta.method,
  },
})

// Express handler factory shared by the ordinance and resolution routes —
// for a file being uploaded right now (the upload form's prefill):
//   router.post('/extract-meta', verifyToken, canCreateDraft,
//     upload.single('file'), handleMulterError, extractMetaHandler('ordinance'))
const extractMetaHandler = (kind) => async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' })
  if (ocrBacklog() >= MAX_OCR_BACKLOG) return res.status(429).json({ error: BUSY_MESSAGE })
  try {
    res.json(toResponse(await extractRecordMeta(req.file, kind)))
  } catch (err) {
    console.error('extract-meta error:', err.message)
    res.status(500).json({ error: 'Could not read this document.' })
  }
}

// Same detection, but for a record's *already stored* file — used when the
// Secretary opens the Publish dialog, so the number can be suggested from the
// document itself (including drafts uploaded before detection existed, or
// with no number entered). Only successful detections are cached: an empty
// result may just be an OCR timeout, and a retry should get another try.
const STORED_CACHE_MAX = 50
const storedCache = new Map()

const storedMetaHandler = ({ table, kind }) => async (req, res) => {
  try {
    const { data: record, error } = await supabase
      .from(table).select('id, filepath, filetype').eq('id', req.params.id).single()
    if (error || !record) return res.status(404).json({ error: 'Record not found.' })
    if (!record.filepath) return res.json(toResponse({}))

    const key = `${table}:${record.id}:${record.filepath}`
    const cached = storedCache.get(key)
    if (cached) return res.json(cached)

    if (ocrBacklog() >= MAX_OCR_BACKLOG) return res.status(429).json({ error: BUSY_MESSAGE })
    const buffer = await downloadFromStorage(record.filepath)
    // The Publish dialog asks for the *approved* date, so the approval line wins.
    const body = toResponse(
      await extractRecordMeta({ buffer, mimetype: record.filetype }, kind, { preferApproved: true })
    )
    if (body.found) {
      if (storedCache.size >= STORED_CACHE_MAX) storedCache.delete(storedCache.keys().next().value)
      storedCache.set(key, body)
    }
    res.json(body)
  } catch (err) {
    console.error('detect-meta error:', err.message)
    res.status(500).json({ error: 'Could not read this document.' })
  }
}

module.exports = { extractRecordMeta, extractMetaHandler, storedMetaHandler, _finalize: finalize }
