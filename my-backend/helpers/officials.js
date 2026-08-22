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

module.exports = { resolveCurrentTermId }
