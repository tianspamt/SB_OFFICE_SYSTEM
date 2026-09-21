// Pulls a record's official number and date out of already-extracted document
// text (see helpers/documentText.js) — rule-based on purpose. Ordinances and
// resolutions follow a predictable layout ("ORDINANCE NO. 2026-011",
// "Enacted this 12th day of March, 2026"), which patterns cover reliably,
// keep on the office's own server, and can be debugged when they miss.
//
// The text often comes from OCR on old scans, so every digit-ish position
// tolerates the classic confusions (O/o read for 0, I/l/| read for 1) and
// month names match with one typo allowed. Nothing here is saved anywhere:
// the caller only prefills form fields and the user confirms them.

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]
const MONTH_ABBREVIATIONS = {
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8,
  sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}

// Characters OCR commonly returns in place of a digit.
const DIGITISH = '[0-9OoIl|]'

const fixDigits = (str) => str.replace(/[Oo]/g, '0').replace(/[Il|]/g, '1')
const hasRealDigit = (str) => /[0-9]/.test(str)
const pad = (n, len) => String(n).padStart(len, '0')

const levenshtein = (a, b) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }
  return dp[a.length][b.length]
}

// "March" / "Mar." / "Marcb" (OCR typo) -> 3. Short words (3-4 letters) must
// match exactly — one typo on "may"/"jun" would match far too much prose.
const monthNumber = (word) => {
  const w = word.toLowerCase().replace(/\.$/, '')
  const exact = MONTHS.indexOf(w)
  if (exact !== -1) return exact + 1
  if (MONTH_ABBREVIATIONS[w]) return MONTH_ABBREVIATIONS[w]
  if (w.length >= 5) {
    for (let i = 0; i < MONTHS.length; i++) {
      if (Math.abs(MONTHS[i].length - w.length) <= 1 && levenshtein(w, MONTHS[i]) <= 1) return i + 1
    }
  }
  return null
}

const validYear = (y) => Number.isInteger(y) && y >= 1900 && y <= 2100

const toIsoDate = (year, month, day) => {
  if (!validYear(year) || month < 1 || month > 12 || day < 1 || day > 31) return null
  const d = new Date(Date.UTC(year, month - 1, day))
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null
  return `${year}-${pad(month, 2)}-${pad(day, 2)}`
}

// ─── Number ──────────────────────────────────────────────────────────────────

const KIND_CONFIG = {
  ordinance: {
    keyword: 'ORD[I1l]NANCE',
    prefix: 'Municipal Ordinance No.',
  },
  resolution: {
    keyword: 'RES[O0]LUT[I1l][O0]N',
    prefix: 'Resolution No.',
  },
}

// Words right before a match that mean it's a *reference* to another record
// ("amending Ordinance No. 5", "pursuant to Resolution No. 12"), not this
// document's own heading.
const REFERENCE_LEAD = /\b(amend\w*|repeal\w*|pursuant\s+to|under|per|in\s+accordance\s+with|modif\w*|supersed\w*|of|to|with|by)\s*$/i

const extractNumber = (text, kind) => {
  const cfg = KIND_CONFIG[kind]
  if (!cfg) return null

  // keyword + "No."/"Number" + a digit-ish token, optionally "-"/"/" joined
  // (2026-011, 011-2026), optionally followed by ", Series of 2026".
  const re = new RegExp(
    `${cfg.keyword}\\s+(?:N[O0o]S?|NUMBER)\\s*[.,:;º°]*\\s*` +
      `(${DIGITISH}{1,5}(?:\\s*[-–—/]\\s*${DIGITISH}{1,5})?)(?![A-Za-z0-9])` +
      `(?:\\s*[,;]?\\s*(?:series|s\\.?)\\s*(?:of\\s*)?(${DIGITISH}{4})(?![A-Za-z0-9]))?`,
    'gi'
  )

  const candidates = []
  let m
  while ((m = re.exec(text)) !== null) {
    const rawToken = m[1]
    if (!hasRealDigit(rawToken)) continue
    const parts = fixDigits(rawToken).split(/\s*[-–—/]\s*/)
    let year = null
    let seq = null
    if (parts.length === 2) {
      const [a, b] = parts
      if (a.length === 4 && validYear(Number(a))) { year = Number(a); seq = Number(b) }
      else if (b.length === 4 && validYear(Number(b))) { year = Number(b); seq = Number(a) }
      else continue
    } else {
      seq = Number(parts[0])
    }
    if (m[2]) {
      const seriesYear = Number(fixDigits(m[2]))
      if (validYear(seriesYear)) year = year || seriesYear
    }
    if (!Number.isInteger(seq) || seq <= 0) continue

    // Heading-ish matches near the top of the document, in capitals, that
    // aren't preceded by "amending"/"pursuant to"/... are this record's own.
    let score = 0
    if (m.index < 700) score += 6
    else if (m.index < 1500) score += 2
    if (m[0].slice(0, 5) === m[0].slice(0, 5).toUpperCase()) score += 2
    if (m[2] || year) score += 1
    const lead = text.slice(Math.max(0, m.index - 30), m.index)
    if (REFERENCE_LEAD.test(lead.trimEnd() + ' ')) score -= 8
    candidates.push({ raw: m[0].replace(/\s+/g, ' ').trim(), seq, year, score, index: m.index })
  }
  if (!candidates.length) return null

  candidates.sort((a, b) => b.score - a.score || a.index - b.index)
  const best = candidates[0]
  return {
    raw: best.raw,
    sequence: best.seq,
    year: best.year,
    confidence: best.score >= 8 ? 'high' : best.score >= 3 ? 'medium' : 'low',
    prefix: cfg.prefix,
  }
}

// ─── Date ────────────────────────────────────────────────────────────────────

// Score bonuses for the words that usually introduce the record's own date.
// "Enacted"/"ordained" is the Sangguniang Bayan's action; "approved"/"signed"
// is usually the Mayor's later sign-off, so they rank below it.
const DATE_KEYWORDS = [
  [/enact\w*|ordain\w*/i, 10],
  [/adopt\w*/i, 9],
  [/passed/i, 8],
  [/approv\w*/i, 6],
  [/regular\s+session|special\s+session|session\s+held|held\s+on/i, 4],
  [/done\s+this|signed|given\s+this/i, 3],
  [/effect(?:ive|ivity)|take[s]?\s+effect/i, -6],
]

// Looks at the words leading up to a date *on its own line* (plus the line
// above only when the date starts a line) — a wider window would let a
// neighbouring date's keywords ("ENACTED ... March 12") leak onto the next
// line's date ("APPROVED: March 20") and inflate its score.
// For the Publish dialog's "Approved date" the approval line ("APPROVED:
// October 14, 1998", the Mayor's sign-off) should beat the enactment date
// that wins by default, so `preferApproved` lifts "approv..." above them.
const APPROVED_FIRST_KEYWORDS = DATE_KEYWORDS.map(([re, points]) =>
  re.source.startsWith('approv') ? [re, 12] : [re, points]
)

const scoreDateContext = (text, index, keywords) => {
  const lineStart = text.lastIndexOf('\n', index - 1) + 1
  let context = text.slice(lineStart, index)
  if (context.trim().length === 0 && lineStart > 0) {
    const prevStart = text.lastIndexOf('\n', lineStart - 2) + 1
    context = `${text.slice(Math.max(prevStart, lineStart - 110), lineStart)} ${context}`
  }
  let score = 0
  for (const [re, points] of keywords) if (re.test(context)) score += points
  return score
}

const extractDate = (text, { preferApproved = false } = {}) => {
  const keywords = preferApproved ? APPROVED_FIRST_KEYWORDS : DATE_KEYWORDS
  const found = []
  const push = (iso, raw, index, penalty = 0) => {
    if (iso) found.push({ iso, raw: raw.replace(/\s+/g, ' ').trim(), index, penalty })
  }

  // "March 12, 2026" / "Mar. 12th 2026"
  const monthFirst = new RegExp(
    `(?<![A-Za-z])([A-Za-z]{3,9})\\.?\\s+(${DIGITISH}{1,2})(?:st|nd|rd|th)?\\s*,?\\s*(${DIGITISH}{4})(?![0-9A-Za-z])`,
    'g'
  )
  let m
  while ((m = monthFirst.exec(text)) !== null) {
    const month = monthNumber(m[1])
    if (!month || !hasRealDigit(m[2] + m[3])) continue
    push(toIsoDate(Number(fixDigits(m[3])), month, Number(fixDigits(m[2]))), m[0], m.index)
  }

  // "12th day of March, 2026" / "12 March 2026"
  const dayFirst = new RegExp(
    `(?<![0-9A-Za-z])(${DIGITISH}{1,2})(?:st|nd|rd|th)?\\s+(?:day\\s+of\\s+)?([A-Za-z]{3,9})\\.?\\s*,?\\s*(${DIGITISH}{4})(?![0-9A-Za-z])`,
    'g'
  )
  while ((m = dayFirst.exec(text)) !== null) {
    const month = monthNumber(m[2])
    if (!month || !hasRealDigit(m[1] + m[3])) continue
    push(toIsoDate(Number(fixDigits(m[3])), month, Number(fixDigits(m[1]))), m[0], m.index)
  }

  // 2026-03-12
  const iso = /(?<![0-9])((?:19|20)\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])(?![0-9])/g
  while ((m = iso.exec(text)) !== null) {
    push(toIsoDate(Number(m[1]), Number(m[2]), Number(m[3])), m[0], m.index)
  }

  // 03/12/2026 — Philippine convention is month first, but it's ambiguous
  // (03/12 could be 3 Dec), so it's only ever a low-confidence fallback.
  const numeric = /(?<![0-9])(0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])[-/]((?:19|20)\d{2})(?![0-9])/g
  while ((m = numeric.exec(text)) !== null) {
    push(toIsoDate(Number(m[3]), Number(m[1]), Number(m[2])), m[0], m.index, 5)
  }

  if (!found.length) return null

  for (const f of found) f.score = scoreDateContext(text, f.index, keywords) - f.penalty
  found.sort((a, b) => b.score - a.score || a.index - b.index)
  const confidenceOf = (score) => (score >= 8 ? 'high' : score >= 3 ? 'medium' : 'low')
  // Runners-up are kept (deduplicated) so a caller that can cross-check them
  // — e.g. against the year in the record's number — can prefer a
  // consistent one when OCR has misread a digit in the top pick.
  const seen = new Set()
  const candidates = []
  for (const f of found) {
    if (seen.has(f.iso)) continue
    seen.add(f.iso)
    candidates.push({ value: f.iso, raw: f.raw, score: f.score, confidence: confidenceOf(f.score) })
    if (candidates.length === 6) break
  }
  const best = candidates[0]
  return { value: best.value, raw: best.raw, confidence: best.confidence, candidates }
}

// ─── Public entry ────────────────────────────────────────────────────────────

const extractLegislativeMeta = (text, kind, options = {}) => {
  const cleaned = String(text || '').replace(/\r/g, '')
  const number = extractNumber(cleaned, kind)
  const date = extractDate(cleaned, options)

  const year = date ? Number(date.value.slice(0, 4)) : number?.year || null

  let numberDisplay = null
  if (number) {
    const numberYear = number.year || year
    numberDisplay = numberYear
      ? `${number.prefix} ${numberYear}-${pad(number.sequence, 3)}`
      : `${number.prefix} ${number.sequence}`
  }

  return {
    number: numberDisplay,
    numberRaw: number?.raw || null,
    numberConfidence: number?.confidence || null,
    numberYear: number?.year || null,
    date: date?.value || null,
    dateRaw: date?.raw || null,
    dateConfidence: date?.confidence || null,
    dateCandidates: date?.candidates || [],
    year,
  }
}

module.exports = { extractLegislativeMeta }
