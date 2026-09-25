const supabase = require('../config/supabase')
const { recordNumberKey } = require('./utils')

// Sequential official numbers for ordinances/resolutions: when the latest
// published number for a year is 13, the next one published must be 14 —
// not 15 (a gap) and not 12 (already used; findDuplicateRecord catches that
// too). Numbering restarts at 1 each year and runs separately per record type.
//
// The year is whatever year is written in the number itself, and the
// Secretary may choose any year — that's how old records from past years are
// encoded (e.g. "RESOLUTION NO. 03-2019"). Only the sequence within that
// year is enforced.
//
// "Latest" = the highest sequence among PUBLISHED records of that year,
// including published records that were archived since — an archived number
// is never handed out again. Drafts that already carry a typed-in number
// (older uploads) don't count until they're published. Existing gaps in
// old data are left alone: after 2025-09 and 2025-17, the next is 18.

// Every published number of this type (live + archived), except `excludeId`.
async function publishedNumbers({ table, numberField, entityType, excludeId }) {
  let live = supabase.from(table).select(`id, ${numberField}`).eq('status', 'published').not(numberField, 'is', null)
  if (excludeId != null) live = live.neq('id', excludeId)
  const [{ data: rows, error }, { data: archived, error: archErr }] = await Promise.all([
    live,
    supabase.from('archives').select('data').eq('entity_type', entityType).eq('data->>status', 'published'),
  ])
  if (error) throw new Error(error.message)
  if (archErr) throw new Error(archErr.message)
  return [
    ...(rows || []).map((r) => r[numberField]),
    ...(archived || []).map((a) => a.data?.[numberField]),
  ].filter(Boolean)
}

// Rewrites `template`'s sequence and year digits, keeping its wording and
// zero-padding — "RESOLUTION NO. 13-2025" → "RESOLUTION NO. 14-2025",
// "Municipal Ordinance No. 2025-17" → "Municipal Ordinance No. 2025-18".
function formatLike(template, year, seq) {
  let seqDone = false
  return template.replace(/\d+/g, (g) => {
    const n = Number(g)
    if (g.length === 4 && n >= 1900 && n <= 2100) return String(year)
    if (seqDone) return g
    seqDone = true
    return String(seq).padStart(Math.max(g.length, 2), '0')
  })
}

// { year, seq, number, latest } — the only number that may be published next
// for `year`. `number` copies the format of the latest published record (of
// that year if any, else of any year), falling back to `defaultFormat`.
async function nextNumberFor({ table, numberField, entityType, year, excludeId, defaultFormat }) {
  const numbers = await publishedNumbers({ table, numberField, entityType, excludeId })
  const keyed = numbers.map((n) => ({ n, ...recordNumberKey(n) })).filter((k) => k.seq > 0)
  const newest = (list) => list.sort((a, b) => b.year - a.year || b.seq - a.seq)[0] || null
  const latestThisYear = newest(keyed.filter((k) => k.year === year))
  const seq = (latestThisYear?.seq || 0) + 1
  const template = latestThisYear?.n || newest([...keyed])?.n || defaultFormat(year, 1)
  return { year, seq, number: formatLike(template, year, seq), latest: latestThisYear?.n || null }
}

// null when `number` is exactly the next one for the year written in it;
// otherwise the error message Publish returns. `fallbackYear` only shapes the
// example in the "no year" message.
async function sequentialNumberError({ table, numberField, entityType, excludeId, number, fallbackYear, lower, defaultFormat }) {
  const key = recordNumberKey(number)
  if (!key.seq || !key.year)
    return `The ${lower} number must include its sequence number and 4-digit year (e.g. "${defaultFormat(fallbackYear, 1)}").`
  const year = key.year
  const next = await nextNumberFor({ table, numberField, entityType, year, excludeId, defaultFormat })
  if (key.seq !== next.seq) {
    return next.latest
      ? `The next ${lower} number for ${year} is ${next.seq} ("${next.number}") — the latest published is "${next.latest}". Numbers can't be skipped or reused.`
      : `This is the first ${lower} published in ${year}, so its number must be 1 ("${next.number}").`
  }
  return null
}

module.exports = { nextNumberFor, sequentialNumberError, formatLike }
