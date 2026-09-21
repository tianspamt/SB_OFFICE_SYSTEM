const supabase = require('../config/supabase')

// Duplicate trap for ordinances and resolutions: the same title or the same
// official number can't be on two records of the same type. Comparison ignores
// capital letters, extra spaces and stray punctuation at the ends, so
// "Municipal Ordinance No. 2025-011" and "municipal  ordinance no. 2025-011"
// count as the same number. A rejected record doesn't block its own title (it
// is terminal, and re-drafting what was turned down is normal), and a record is
// never a duplicate of itself (`excludeId`, for edit/publish).
const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,;:-]+|[\s.,;:-]+$/g, '')

// Returns { field: 'title' | 'number', record } for the first clash, or null.
// Pass `title` and/or `number` — an empty/missing one isn't checked.
const findDuplicateRecord = async ({ table, numberField, title, number, excludeId }) => {
  const wantedTitle = normalize(title)
  const wantedNumber = normalize(number)
  if (!wantedTitle && !wantedNumber) return null

  let query = supabase.from(table).select(`id, title, status, ${numberField}`)
  if (excludeId != null) query = query.neq('id', excludeId)
  const { data, error } = await query
  if (error) throw new Error(error.message)

  for (const r of data || []) {
    if (wantedNumber && normalize(r[numberField]) === wantedNumber) return { field: 'number', record: r }
  }
  for (const r of data || []) {
    if (wantedTitle && r.status !== 'rejected' && normalize(r.title) === wantedTitle) return { field: 'title', record: r }
  }
  return null
}

// Client-facing sentence for a findDuplicateRecord result.
const duplicateMessage = (dup, { lower, numberField, title, number }) => {
  if (dup.field === 'number')
    return `"${String(number).trim()}" is already in use by another ${lower}. Please use a different number.`
  const theirNumber = dup.record[numberField]
  return `Another ${lower} already has the title "${String(title).trim()}"${theirNumber ? ` (${theirNumber})` : ''}. Please use a different title.`
}

module.exports = { findDuplicateRecord, duplicateMessage, normalizeForCompare: normalize }
