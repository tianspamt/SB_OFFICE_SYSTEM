const supabase = require('../config/supabase')

// Same normalization used by migrations/001_create_councils_table.sql's
// backfill — collapses en dash / em dash variants to a plain hyphen and
// trims whitespace, so "2022-2025" and "2022–2025" resolve to the same
// council instead of the typo silently creating a second one.
const normalizeTermLabel = (raw) => (raw || '').replace(/[–—]/g, '-').trim()

// Finds the council matching this (normalized) term label, creating one on
// the fly if none exists yet — so typing a term period into Add/Edit Term
// always links to a real councils row instead of going unlinked. If the
// admin already pre-created the council via "Add Council" with the same
// label, this resolves to that existing row rather than duplicating it.
const resolveCouncilId = async (rawTermPeriod) => {
  const term_label = normalizeTermLabel(rawTermPeriod)
  if (!term_label) return null

  const { data: existing, error: findErr } = await supabase
    .from('councils').select('id').eq('term_label', term_label).maybeSingle()
  if (findErr) throw new Error(findErr.message)
  if (existing) return existing.id

  const { data: created, error: createErr } = await supabase
    .from('councils')
    .insert({ term_label, status: 'active' })
    .select('id').single()
  if (createErr) throw new Error(createErr.message)
  return created.id
}

// Singular by law (RA 7160) — at most one active holder per council. Mirrors
// migrations/005's partial unique index at the API layer, so a conflict
// returns a clean error instead of a raw DB constraint violation (or, before
// that migration is applied, catches what would otherwise be silent data
// corruption). "Councilor" is NOT here — it's a multi-seat role, see
// checkCouncilorSeatCap below instead.
const SINGULAR_POSITIONS = ['Vice Mayor', 'Liga ng mga Barangay President', 'SK Federated President']

// Typical regular-Councilor count for a municipal Sangguniang Bayan under
// RA 7160 — adjust if this LGU's actual charter/classification differs.
// Deliberately a soft, application-level cap (not a DB constraint): unlike
// the singular roles above, real-world exceptions exist (a contested seat
// under recount, a holdover pending a court ruling), so this should warn
// and be overridable, not make the exception impossible to record.
const COUNCILOR_SEAT_CAP = 8

// Returns the conflicting term (with the holder's name) if another member
// already holds `position` as "active" in this council, or null if clear.
// Pass excludeMemberId when the caller's own other active terms are being
// auto-closed in the same request anyway; pass excludeTermId when editing a
// term in place so it doesn't conflict with itself.
const findSingularPositionConflict = async ({ councilId, position, excludeMemberId, excludeTermId }) => {
  if (!councilId || !SINGULAR_POSITIONS.includes(position)) return null
  let query = supabase
    .from('sb_council_member_terms')
    .select('id, council_member_id, sb_council_members ( full_name )')
    .eq('council_id', councilId)
    .eq('position', position)
    .eq('status', 'active')
  if (excludeMemberId != null) query = query.neq('council_member_id', excludeMemberId)
  if (excludeTermId != null) query = query.neq('id', excludeTermId)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data && data.length > 0 ? data[0] : null
}

// Counts how many OTHER active "Councilor" terms already exist for this
// council (same exclusion semantics as above), for the soft seat-cap check.
const countActiveCouncilors = async ({ councilId, excludeMemberId, excludeTermId }) => {
  if (!councilId) return 0
  let query = supabase
    .from('sb_council_member_terms')
    .select('id', { count: 'exact', head: true })
    .eq('council_id', councilId)
    .eq('position', 'Councilor')
    .eq('status', 'active')
  if (excludeMemberId != null) query = query.neq('council_member_id', excludeMemberId)
  if (excludeTermId != null) query = query.neq('id', excludeTermId)
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count || 0
}

// Mirrors autoEndTerms() in helpers/logger.js — councils.status was only
// ever set once (at creation/backfill) with nothing to revisit it, unlike
// sb_council_member_terms.status which autoEndTerms keeps current. A
// council created "upcoming" would otherwise stay upcoming forever, even
// years after its term_start passed. Rows with no term_start/term_end (the
// common case — councils are usually auto-created with just a label) are
// left untouched, since there's no date to compute a lifecycle from; they
// keep whatever status they were created with.
const autoUpdateCouncilStatuses = async () => {
  const today = new Date().toISOString().split('T')[0]
  await supabase.from('councils')
    .update({ status: 'upcoming' })
    .gt('term_start', today)
    .neq('status', 'upcoming')
  await supabase.from('councils')
    .update({ status: 'concluded' })
    .not('term_end', 'is', null)
    .lt('term_end', today)
    .neq('status', 'concluded')
  await supabase.from('councils')
    .update({ status: 'active' })
    .lte('term_start', today)
    .or(`term_end.is.null,term_end.gte.${today}`)
    .neq('status', 'active')
}

module.exports = {
  resolveCouncilId,
  normalizeTermLabel,
  SINGULAR_POSITIONS,
  COUNCILOR_SEAT_CAP,
  findSingularPositionConflict,
  countActiveCouncilors,
  autoUpdateCouncilStatuses,
}
