const supabase = require('../config/supabase')
const { recordNumberKey, recordNumberParts } = require('./utils')

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
// "Latest" = the highest sequence among PUBLISHED records of that year in
// the live table. Archived records don't count — an archived record (e.g. a
// test or a mistake) can't push the suggestion off, and its number may be
// given out again. Drafts that already carry a typed-in number (older
// uploads) don't count until they're published. Existing gaps in old data
// are left alone: after 2025-09 and 2025-17, the next is 18.

// Every published number of this type, except `excludeId`.
async function publishedNumbers({ table, numberField, excludeId }) {
  let query = supabase.from(table).select(`id, ${numberField}`).eq('status', 'published').not(numberField, 'is', null)
  if (excludeId != null) query = query.neq('id', excludeId)
  const { data: rows, error } = await query
  if (error) throw new Error(error.message)
  return (rows || []).map((r) => r[numberField]).filter(Boolean)
}

// Year of the latest (highest year, then sequence) published number, or null
// when nothing is published yet.
async function latestPublishedYear({ table, numberField, excludeId }) {
  const years = (await publishedNumbers({ table, numberField, excludeId }))
    .map((n) => recordNumberKey(n))
    .filter((k) => k.seq > 0 && k.year > 0)
    .map((k) => k.year)
  return years.length ? Math.max(...years) : null
}

// Rewrites `template`'s sequence and year digits, keeping its wording and
// zero-padding — "RESOLUTION NO. 13-2025" → "RESOLUTION NO. 14-2025",
// "Municipal Ordinance No. 2025-17" → "Municipal Ordinance No. 2025-18".
// Uses the same year/sequence groups as recordNumberKey, so the digits it
// rewrites are the ones Publish will read back. A stray number glued to the
// front of the wording ("2Municipal Ordinance No. 2026-04") is a typo in the
// template, so it's dropped rather than copied into the suggestion.
function formatLike(template, year, seq) {
  const { groups, yearIndex, seqIndex } = recordNumberParts(template)
  let out = ''
  let pos = 0
  groups.forEach((g, i) => {
    let digits = g.digits
    if (i === yearIndex) digits = String(year)
    else if (i === seqIndex) digits = String(seq).padStart(Math.max(g.digits.length, 2), '0')
    else if (g.index === 0 && /\p{L}/u.test(template.charAt(g.digits.length))) digits = ''
    out += template.slice(pos, g.index) + digits
    pos = g.index + g.digits.length
  })
  return out + template.slice(pos)
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

module.exports = { nextNumberFor, sequentialNumberError, formatLike, latestPublishedYear }
