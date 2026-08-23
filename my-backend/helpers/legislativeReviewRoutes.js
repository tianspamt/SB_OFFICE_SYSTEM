const express = require('express')
const supabase = require('../config/supabase')
const { verifyToken, secretaryOnly, viceMayorOnly } = require('../middleware/auth')
const { canManageLegislativeRecord, escapeHtml } = require('./utils')
const { logActivity } = require('./logger')
const { notify, notifyByPosition, notificationEmailHtml } = require('./notify')

// Builds the shared review-workflow routes — accept / request-changes /
// vm-approve / publish / archive — for one legislative record type
// (ordinances, resolutions, or session_minutes). These five endpoints
// implement the exact same
//   pending → needs_revision → pending → ready_to_publish → approved → published
// state machine across all three record types; hand-applying a change to
// each copy separately is exactly how bugs have slipped through before —
// see useLegislativeReview.js's note on the Pending tab's loading flag, and
// the officials-relink fix, which needed the same edit made twice by hand.
// Only the table name, a few labels, and the archive RPC name actually
// differ per type — everything else here is identical.
//
// `singularLabel` drives every status/permission error message
// ("Ordinance not found.", "Session minutes is not pending review.", etc.)
// and the archive-related messages ("You are not allowed to archive this
// ordinance.", "Archived session minutes: ..."). The pre-extraction code
// had two one-off exceptions to that pattern for session_minutes ("session
// record" / "session" instead of "session minutes") — those looked like
// incidental copy-paste drift rather than a deliberate distinction, so they
// were normalized here rather than carried forward as permanent config.
function createLegislativeReviewRoutes({
  table,
  entityType,
  activityModule,
  singularLabel,
  archiveRpc,
  labelOf,
}) {
  const router = express.Router()
  const lower = singularLabel.toLowerCase()

  async function loadInStatus(id, expectedStatus) {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
    if (error || !data) return { notFound: true }
    if (data.status !== expectedStatus) return { wrongStatus: true, data }
    return { data }
  }

  // Runs the actual status-changing UPDATE with the expected *current*
  // status baked into the WHERE clause, so two near-simultaneous actions on
  // the same record can't both succeed — loadInStatus above is only a
  // friendly pre-check for the common case (stale UI), not a lock; this is
  // what actually closes the check-then-act race window between that check
  // and the write. PGRST116 means the UPDATE matched zero rows because the
  // status had already moved on by the time this ran — exactly that race —
  // reported as a 409 rather than passed through as a raw Postgrest error.
  async function atomicUpdate(id, fromStatus, patch) {
    const { data, error } = await supabase
      .from(table)
      .update(patch)
      .eq('id', id)
      .eq('status', fromStatus)
      .select().single()
    if (error?.code === 'PGRST116') return { conflict: true }
    if (error) return { error }
    return { data }
  }
  const conflictResponse = (res) =>
    res.status(409).json({ error: `${singularLabel} was just updated by someone else — please refresh.` })

  // PUT /:id/accept — Secretary, pending → ready_to_publish
  router.put('/:id/accept', verifyToken, secretaryOnly, async (req, res) => {
    const { id } = req.params
    const { notFound, wrongStatus, data: existing } = await loadInStatus(id, 'pending')
    if (notFound) return res.status(404).json({ error: `${singularLabel} not found.` })
    if (wrongStatus) return res.status(400).json({ error: `${singularLabel} is not pending review.` })
    try {
      const { data, conflict, error } = await atomicUpdate(id, 'pending', {
        status: 'ready_to_publish', reviewed_by: req.user.id, reviewed_at: new Date().toISOString(),
      })
      if (conflict) return conflictResponse(res)
      if (error) return res.status(500).json({ error: error.message })
      await logActivity(req, 'ACCEPT', activityModule, `Accepted draft: ${labelOf(existing)}`)
      notifyByPosition('vice_mayor', {
        message: `${singularLabel} ready for your approval: ${labelOf(existing)}`,
        entityType, entityId: id,
        emailSubject: `${singularLabel} Ready for Your Approval`,
        emailHtml: notificationEmailHtml(
          `${singularLabel} Ready for Your Approval`,
          `<strong>${escapeHtml(labelOf(existing))}</strong> was accepted by the Secretary and is now waiting on your Vice-Mayor approval.`
        ),
      })
      res.json({ success: true, data })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // PUT /:id/request-changes — Secretary, pending → needs_revision (comment required)
  router.put('/:id/request-changes', verifyToken, secretaryOnly, async (req, res) => {
    const { id } = req.params
    const { comment } = req.body
    if (!comment?.trim()) return res.status(400).json({ error: 'A comment is required when requesting changes.' })
    const { notFound, wrongStatus, data: existing } = await loadInStatus(id, 'pending')
    if (notFound) return res.status(404).json({ error: `${singularLabel} not found.` })
    if (wrongStatus) return res.status(400).json({ error: `${singularLabel} is not pending review.` })
    try {
      const { error: commentErr } = await supabase.from('comments').insert({
        entity_type: entityType,
        entity_id: id,
        author_id: req.user.id,
        author_role: req.user.position || req.user.role,
        text: comment.trim(),
      })
      if (commentErr) return res.status(500).json({ error: commentErr.message })

      const { data, conflict, error } = await atomicUpdate(id, 'pending', {
        status: 'needs_revision', reviewed_by: req.user.id, reviewed_at: new Date().toISOString(),
      })
      if (conflict) return conflictResponse(res)
      if (error) return res.status(500).json({ error: error.message })
      await logActivity(req, 'REQUEST_CHANGES', activityModule, `Requested changes on draft: ${labelOf(existing)}`)
      notify({
        recipientId: existing.created_by,
        message: `Changes requested on your ${lower}: ${labelOf(existing)}`,
        entityType, entityId: id,
        emailSubject: `Changes Requested: ${labelOf(existing)}`,
        emailHtml: notificationEmailHtml(
          'Changes Requested',
          `The Secretary requested changes on <strong>${escapeHtml(labelOf(existing))}</strong>:<br/><em>"${escapeHtml(comment.trim())}"</em>`
        ),
      })
      res.json({ success: true, data })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // PUT /:id/vm-approve — Vice-Mayor, ready_to_publish → approved
  router.put('/:id/vm-approve', verifyToken, viceMayorOnly, async (req, res) => {
    const { id } = req.params
    const { notFound, wrongStatus, data: existing } = await loadInStatus(id, 'ready_to_publish')
    if (notFound) return res.status(404).json({ error: `${singularLabel} not found.` })
    if (wrongStatus) return res.status(400).json({ error: `${singularLabel} is not ready for Vice-Mayor approval.` })
    try {
      const { data, conflict, error } = await atomicUpdate(id, 'ready_to_publish', {
        status: 'approved', reviewed_by: req.user.id, reviewed_at: new Date().toISOString(),
      })
      if (conflict) return conflictResponse(res)
      if (error) return res.status(500).json({ error: error.message })
      await logActivity(req, 'VM_APPROVE', activityModule, `Vice-Mayor approved: ${labelOf(existing)}`)
      notifyByPosition('secretary', {
        message: `Vice-Mayor approved, ready to publish: ${labelOf(existing)}`,
        entityType, entityId: id,
        emailSubject: `Approved — Ready to Publish: ${labelOf(existing)}`,
        emailHtml: notificationEmailHtml(
          'Ready to Publish',
          `<strong>${escapeHtml(labelOf(existing))}</strong> was approved by the Vice-Mayor and is ready for you to publish.`
        ),
      })
      res.json({ success: true, data })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // PUT /:id/publish — Secretary, approved → published
  router.put('/:id/publish', verifyToken, secretaryOnly, async (req, res) => {
    const { id } = req.params
    const { notFound, wrongStatus, data: existing } = await loadInStatus(id, 'approved')
    if (notFound) return res.status(404).json({ error: `${singularLabel} not found.` })
    if (wrongStatus) return res.status(400).json({ error: `${singularLabel} is not approved for publishing.` })
    try {
      const { data, conflict, error } = await atomicUpdate(id, 'approved', { status: 'published' })
      if (conflict) return conflictResponse(res)
      if (error) return res.status(500).json({ error: error.message })
      await logActivity(req, 'PUBLISH', activityModule, `Published: ${labelOf(existing)}`)
      notify({
        recipientId: existing.created_by,
        message: `Your ${lower} was published: ${labelOf(existing)}`,
        entityType, entityId: id,
        emailSubject: `Published: ${labelOf(existing)}`,
        emailHtml: notificationEmailHtml(
          'Published',
          `<strong>${escapeHtml(labelOf(existing))}</strong> has been officially published.`
        ),
      })
      res.json({ success: true, data })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // DELETE /:id — archive. Who may depends on which bucket the record is
  // currently in (see canManageLegislativeRecord). Archives instead of a
  // hard delete via the `archiveRpc` Postgres function (see migrations/007),
  // which snapshots the row + its links into `archives` and removes them
  // from the live tables as one transaction.
  router.delete('/:id', verifyToken, async (req, res) => {
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from(table).select('status').eq('id', req.params.id).single()
      if (fetchErr || !existing) return res.status(404).json({ error: `${singularLabel} not found.` })
      if (!canManageLegislativeRecord(req.user.position, existing.status))
        return res.status(403).json({ error: `You are not allowed to archive this ${lower}.` })

      const { data: snapshot, error } = await supabase.rpc(archiveRpc, {
        p_id: req.params.id,
        p_archived_by: req.user.id,
      })
      if (error) {
        if (error.code === 'P0002') return res.status(404).json({ error: `${singularLabel} not found.` })
        return res.status(500).json({ error: error.message })
      }

      await logActivity(req, 'ARCHIVE', activityModule, `Archived ${lower}: ${labelOf(snapshot)}`)
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}

module.exports = { createLegislativeReviewRoutes }
