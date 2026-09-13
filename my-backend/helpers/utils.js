const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)

const getIP = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress

const safeParseJSON = (str, fallback = []) => {
  try { return JSON.parse(str) }
  catch { return fallback }
}

// For interpolating DB/user-supplied values into hand-built HTML strings
// (print views, outbound emails) — those aren't templated through a library
// that escapes by default, so every interpolation needs this explicitly.
const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])

// Legislative-records RBAC: editing content (title/number/category, or
// replacing the file — see middleware/auth.js's pendingEditors) is
// Secretary/Clerk only, regardless of which bucket the record is in.
// Councilor and Vice-Mayor may originate a draft (canCreateDraft) and
// withdraw their own not-yet-published one (canArchiveLegislativeRecord
// below), but not edit its content — Secretary/Clerk own that on their
// behalf. Shared across ordinances/resolutions/session-minutes since all
// three run the same review pipeline.
const canEditLegislativeRecord = (position) => ['secretary', 'clerk'].includes(position)

// Archiving/withdrawing: Secretary/Clerk may archive any record, in any
// bucket. Councilor and Vice-Mayor may only withdraw a record they
// themselves created, and only while it's still unpublished — once
// published, archiving is Secretary/Clerk's call alone.
const canArchiveLegislativeRecord = (position, status, isOwner) => {
  if (['secretary', 'clerk'].includes(position)) return true
  if (status === 'published') return false
  return isOwner && ['councilor', 'vice_mayor'].includes(position)
}

// Builds one `column.ilike."%value%"` clause for use inside a Supabase/
// PostgREST `.or()` filter string (e.g. to search title OR a record
// number in one query). `.or()` takes a raw filter string where commas and
// parentheses are structural — an unescaped comma in the search term would
// otherwise be parsed as the start of a second condition. Wrapping the
// value in double quotes (with literal backslashes/quotes inside it
// backslash-escaped, per PostgREST's filter grammar) keeps the whole term
// as one opaque value no matter what punctuation it contains.
const orIlikeClause = (column, value) => {
  const escaped = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `${column}.ilike."%${escaped}%"`
}

// Validates+parses a submitted "year" form field (ordinances/resolutions
// upload and edit). A bare `year ? parseInt(year) : null` silently turns
// garbage input ("abc", "12/2024") into NaN and stores that as-is instead
// of rejecting the request — this makes "not provided" (year: null) and
// "provided but invalid" (an error) two distinct, explicit outcomes.
const parseYearField = (raw) => {
  if (raw === undefined || raw === null || raw === '') return { year: null }
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1900 || n > 2100)
    return { error: 'Year must be a valid year between 1900 and 2100.' }
  return { year: n }
}

// Turns a plain "YYYY-MM-DD" (the Date filter on Ordinances/Resolutions,
// matched against `uploaded_at`) into the [start, end) timestamp bounds for
// that whole calendar day, for a `.gte(start).lt(end)` range query — day
// boundaries in UTC, same simplicity level as the rest of this codebase's
// date handling (nothing here is PH-timezone-exact).
const dayBoundsUTC = (dateStr) => {
  const start = `${dateStr}T00:00:00.000Z`
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end: end.toISOString() }
}

module.exports = {
  isValidEmail, getIP, safeParseJSON, escapeHtml,
  canEditLegislativeRecord, canArchiveLegislativeRecord, orIlikeClause, dayBoundsUTC,
  parseYearField,
}
