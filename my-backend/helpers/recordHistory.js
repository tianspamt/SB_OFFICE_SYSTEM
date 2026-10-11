const supabase = require('../config/supabase')

// Append-only trail of everything that happened to an ordinance/resolution,
// from upload to publish (or reject) — see migrations/034. Shown in the
// record's details to staff only (HISTORY_VIEWER_POSITIONS), never publicly.

const HISTORY_VIEWER_POSITIONS = [
  'secretary', 'clerk', 'vice_mayor', 'councilor', 'sk_federated', 'liga_ng_mga_barangay',
]

const HISTORY_ENTITY_TYPES = ['ordinance', 'resolution']

// Best effort, like logActivity: a failed history write must never fail the
// action it records. `actorName` overrides the caller's name — the author's
// own decision is shown under their council-member name.
async function recordHistory(req, { entityType, entityId, action, stage = null, comment = null, actorName }) {
  if (!HISTORY_ENTITY_TYPES.includes(entityType)) return
  try {
    const { error } = await supabase.from('record_history').insert({
      entity_type: entityType,
      entity_id: Number(entityId),
      action,
      stage,
      comment: comment?.trim() || null,
      actor_user_id: req.user?.id ?? null,
      actor_name: actorName ?? req.user?.name ?? null,
      actor_position: req.user?.position ?? null,
    })
    if (error) console.error('recordHistory error:', error.message)
  } catch (err) {
    console.error('recordHistory exception:', err.message)
  }
}

async function historyFor(entityType, entityId) {
  const { data, error } = await supabase
    .from('record_history')
    .select('id, action, stage, comment, actor_name, actor_position, created_at, backfilled')
    .eq('entity_type', entityType).eq('entity_id', entityId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

module.exports = { HISTORY_VIEWER_POSITIONS, recordHistory, historyFor }
