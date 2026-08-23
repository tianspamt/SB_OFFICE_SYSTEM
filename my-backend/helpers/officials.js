const supabase = require('../config/supabase')

// Resolves which term should be credited "right now" for a member being
// linked as an ordinance/resolution author — mirrors the same
// active-term-or-most-recent logic routes/councilMembers.js already uses
// for its own GET enrichment. Called at link time (upload/edit), so the
// authorship credit is pinned to whichever seat that person actually held
// at the moment they were credited, not whatever they hold later.
const resolveCurrentTermId = async (memberId) => {
  const { data, error } = await supabase
    .from('sb_council_member_terms')
    .select('id, status, term_start')
    .eq('council_member_id', memberId)
    .order('term_start', { ascending: false })
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) return null
  const active = data.find((t) => t.status === 'active')
  return (active || data[0]).id
}

// Resolves the Author filter (ordinances/resolutions GET list) into the set
// of record ids linked to any council member whose name matches — the
// filter searches the real `officials` relation (Tag Council Members),
// not a free-text author field, since the field duplicated data the
// checkboxes already capture more reliably.
//
// Two plain queries rather than a single PostgREST embedded-resource filter
// (`.select('*, link!inner(person!inner(...))').ilike('link.person.full_name', ...)`)
// deliberately — that style of inner-join filter returns one duplicate row
// of the OUTER record per matching related row, which would double-count an
// ordinance/resolution linked to more than one official matching the search.
const findRecordIdsByAuthorName = async (linkTable, idColumn, search) => {
  const { data: people } = await supabase
    .from('sb_council_members')
    .select('id')
    .ilike('full_name', `%${search}%`)
  const officialIds = (people || []).map((p) => p.id)
  if (officialIds.length === 0) return []

  const { data: links } = await supabase
    .from(linkTable)
    .select(idColumn)
    .in('official_id', officialIds)
  return [...new Set((links || []).map((l) => l[idColumn]))]
}

module.exports = { resolveCurrentTermId, findRecordIdsByAuthorName }
