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

// Legislative-records RBAC: edit/archive rights depend on which bucket the
// record is currently in, not just on being an admin — Secretary/Clerk own
// records once published, Clerk/Councilor own everything before that
// (drafting, fixing, withdrawing). Shared across ordinances/resolutions/
// session-minutes since all three run the same review pipeline.
const canManageLegislativeRecord = (position, status) =>
  status === 'published'
    ? ['secretary', 'clerk'].includes(position)
    : ['clerk', 'councilor'].includes(position)

// Same bucket split as canManageLegislativeRecord, but Secretary keeps
// replace-file/revise as a fallback on records that aren't published yet
// (see middleware/auth.js's pendingEditors) — only Councilor drops out once
// a record is published, since Councilor's published-bucket access is
// read-only.
const canReplaceLegislativeFile = (position, status) =>
  status === 'published'
    ? ['secretary', 'clerk'].includes(position)
    : ['secretary', 'clerk', 'councilor'].includes(position)

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

module.exports = {
  isValidEmail, getIP, safeParseJSON, escapeHtml,
  canManageLegislativeRecord, canReplaceLegislativeFile, orIlikeClause,
}
