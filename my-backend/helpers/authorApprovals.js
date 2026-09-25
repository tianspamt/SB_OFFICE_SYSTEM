const supabase = require('../config/supabase')

// Shared bits of the author-approval workflow (migrations/031,
// Author_Approval_Workflow_v2.docx Section 4): the routes themselves live in
// helpers/legislativeReviewRoutes.js next to the state machine they gate.

const READING_STATUSES = ['first_reading', 'second_reading', 'third_reading']

// Which approval stage a record's current status waits on — each reading, then
// a final 'publish' approval once the Vice-Mayor has approved. null = none.
const stageForStatus = (status) =>
  READING_STATUSES.includes(status) ? status : status === 'approved' ? 'publish' : null

const STAGE_LABELS = {
  first_reading: 'First Reading',
  second_reading: 'Second Reading',
  third_reading: 'Third Reading',
  publish: 'final approval to publish',
}

// ordinance → ordinance_officials / ordinance_id, same for resolution.
const linkTableFor = (entityType) => ({ table: `${entityType}_officials`, idColumn: `${entityType}_id` })

// The record's (single) principal Author, as { id, full_name } or null.
async function authorOf(entityType, entityId) {
  const { table, idColumn } = linkTableFor(entityType)
  const { data, error } = await supabase
    .from(table)
    .select('official_id, sb_council_members ( id, full_name )')
    .eq(idColumn, entityId).eq('role', 'author')
    .limit(1)
  if (error) throw new Error(error.message)
  const m = data?.[0]?.sb_council_members
  return m ? { id: m.id, full_name: m.full_name } : null
}

async function approvalFor(entityType, entityId, stage) {
  const { data, error } = await supabase
    .from('author_approvals').select('*')
    .eq('entity_type', entityType).eq('entity_id', entityId).eq('stage', stage)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data || null
}

// Called when a record's Author is changed on edit: approvals given or
// pending for the previous author no longer count, so the new author has
// to give them again (Section 5, "Author is changed after approving").
async function clearApprovalsForReplacedAuthor(entityType, entityId, newAuthorIds) {
  let query = supabase.from('author_approvals').delete()
    .eq('entity_type', entityType).eq('entity_id', entityId)
  const keep = (newAuthorIds || []).map(Number).filter(Number.isFinite)
  if (keep.length > 0) query = query.or(`official_id.is.null,official_id.not.in.(${keep.join(',')})`)
  const { error } = await query
  if (error) console.error('clearApprovalsForReplacedAuthor failed:', error.message)
}

module.exports = {
  READING_STATUSES,
  STAGE_LABELS,
  stageForStatus,
  authorOf,
  approvalFor,
  clearApprovalsForReplacedAuthor,
}
