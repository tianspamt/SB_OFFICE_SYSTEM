const express = require('express')
const supabase = require('../config/supabase')
const { verifyToken, secretaryOnly, viceMayorOnly } = require('../middleware/auth')
const { canArchiveLegislativeRecord, escapeHtml, yearInManila, parseApprovedDay } = require('./utils')
const { logActivity } = require('./logger')
const { findDuplicateRecord } = require('./duplicates')
const { notify, notifyByPosition, notifyAllStaff, notificationEmailHtml } = require('./notify')

// Builds the shared review-workflow routes — accept / request-changes /
// vm-approve / publish / archive (plus advance-reading for ordinances/
// resolutions) — for one legislative record type (ordinances, resolutions,
// or session_minutes). These endpoints implement the same
//   pending → needs_revision → pending → first_reading → second_reading →
//     third_reading → ready_to_publish → approved → published
// (session_minutes skips the three reading statuses — see `hasReadings`)
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
// `numberField`/`numberLabel` are set only for ordinances/resolutions —
// session_minutes assigns its number at creation time and publishes with no
// extra input, same as before. When set, the record's official number is no
// longer collected at draft-upload time (see routes/ordinances.js and
// routes/resolutions.js — the field there is now optional and unvalidated):
// at upload time nobody yet knows which draft the Vice-Mayor will approve
// first, so requiring a number then produced out-of-order/duplicate numbers
// that had to be hand-corrected later. Requiring it here instead, at the
// moment Secretary actually publishes, means the number reflects the real
// publish order.
// The three readings an ordinance/resolution draft goes through in session
// (RA 7160), inserted into the state machine as three extra `status` values
// between "Secretary accepted" and "ready for Vice-Mayor" — Accept (below)
// now lands on 'first_reading' instead of jumping straight to
// 'ready_to_publish', and /advance-reading walks it the rest of the way:
//   pending → needs_revision → pending → first_reading → second_reading →
//     third_reading → ready_to_publish → approved → published
// session_minutes has no reading requirement, so it keeps the original
// direct pending → ready_to_publish jump on Accept (see `hasReadings` below).
const READING_STATUSES = ['first_reading', 'second_reading', 'third_reading']

function createLegislativeReviewRoutes({
  table,
  entityType,
  activityModule,
  singularLabel,
  archiveRpc,
  labelOf,
  numberField,
  numberLabel,
  // Store the published number in capitals (resolutions: "RESOLUTION NO. 02 - 2025").
  uppercaseNumber = false,
  approvedDateField,
  hasReadings,
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

  const notifyVmReadyForApproval = (existing, id) => notifyByPosition('vice_mayor', {
    message: `${singularLabel} ready for your approval: ${labelOf(existing)}`,
    entityType, entityId: id,
    emailSubject: `${singularLabel} Ready for Your Approval`,
    emailHtml: notificationEmailHtml(
      `${singularLabel} Ready for Your Approval`,
      `<strong>${escapeHtml(labelOf(existing))}</strong> was accepted by the Secretary and is now waiting on your Vice-Mayor approval.`
    ),
  })

  // PUT /:id/accept — Secretary. hasReadings types land on 'first_reading'
  // (the three readings happen next, see /advance-reading below); others
  // (session_minutes) jump straight to 'ready_to_publish' as before.
  router.put('/:id/accept', verifyToken, secretaryOnly, async (req, res) => {
    const { id } = req.params
    const { notFound, wrongStatus, data: existing } = await loadInStatus(id, 'pending')
    if (notFound) return res.status(404).json({ error: `${singularLabel} not found.` })
    if (wrongStatus) return res.status(400).json({ error: `${singularLabel} is not pending review.` })
    const targetStatus = hasReadings ? READING_STATUSES[0] : 'ready_to_publish'
    try {
      const { data, conflict, error } = await atomicUpdate(id, 'pending', {
        status: targetStatus, reviewed_by: req.user.id, reviewed_at: new Date().toISOString(),
      })
      if (conflict) return conflictResponse(res)
      if (error) return res.status(500).json({ error: error.message })
      await logActivity(req, 'ACCEPT', activityModule, `Accepted draft: ${labelOf(existing)}`)
      // hasReadings types don't notify the Vice-Mayor yet — that happens once
      // /advance-reading actually reaches 'ready_to_publish'.
      if (!hasReadings) notifyVmReadyForApproval(existing, id)
      res.json({ success: true, data })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // PUT /:id/advance-reading — Secretary only, hasReadings types only.
  // Walks first_reading → second_reading → third_reading → ready_to_publish,
  // one status at a time; the last step is what actually notifies the
  // Vice-Mayor, since only then is the record really ready for them.
  if (hasReadings) {
    router.put('/:id/advance-reading', verifyToken, secretaryOnly, async (req, res) => {
      const { id } = req.params
      const { data: existing, error: fetchErr } = await supabase.from(table).select('*').eq('id', id).single()
      if (fetchErr || !existing) return res.status(404).json({ error: `${singularLabel} not found.` })
      const currentIndex = READING_STATUSES.indexOf(existing.status)
      if (currentIndex === -1) return res.status(400).json({ error: `${singularLabel} is not currently in a reading stage.` })
      const isFinalReading = currentIndex === READING_STATUSES.length - 1
      const nextStatus = isFinalReading ? 'ready_to_publish' : READING_STATUSES[currentIndex + 1]
      try {
        const { data, conflict, error } = await atomicUpdate(id, existing.status, { status: nextStatus })
        if (conflict) return conflictResponse(res)
        if (error) return res.status(500).json({ error: error.message })
        await logActivity(
          req, 'ADVANCE_READING', activityModule,
          `${isFinalReading ? 'Completed third reading' : `Marked ${nextStatus.replace('_', ' ')}`}: ${labelOf(existing)}`
        )
        if (isFinalReading) notifyVmReadyForApproval(existing, id)
        res.json({ success: true, data })
      } catch (err) {
        res.status(500).json({ error: err.message })
      }
    })
  }

  // PUT /:id/reject — Secretary, hasReadings types only, any reading status
  // → rejected. Distinct from request-changes: that one sends a draft back
  // to the creator to fix and resubmit (pending → needs_revision → pending);
  // this is terminal — the record stays visible (never archived
  // automatically) as a record of what was turned down, but there's no path
  // back into the pipeline for it.
  //
  // A comment explaining the rejection is optional at every reading stage —
  // if one is given it's saved to the record and included in the email.
  if (hasReadings) {
    router.put('/:id/reject', verifyToken, secretaryOnly, async (req, res) => {
      const { id } = req.params
      const { comment } = req.body
      const { data: existing, error: fetchErr } = await supabase.from(table).select('*').eq('id', id).single()
      if (fetchErr || !existing) return res.status(404).json({ error: `${singularLabel} not found.` })
      if (!READING_STATUSES.includes(existing.status)) {
        return res.status(400).json({ error: `${singularLabel} is not currently in a reading stage.` })
      }
      try {
        if (comment?.trim()) {
          const { error: commentErr } = await supabase.from('comments').insert({
            entity_type: entityType,
            entity_id: id,
            author_id: req.user.id,
            author_role: req.user.position || req.user.role,
            text: comment.trim(),
          })
          if (commentErr) return res.status(500).json({ error: commentErr.message })
        }

        const { data, conflict, error } = await atomicUpdate(id, existing.status, {
          status: 'rejected', reviewed_by: req.user.id, reviewed_at: new Date().toISOString(),
        })
        if (conflict) return conflictResponse(res)
        if (error) return res.status(500).json({ error: error.message })
        await logActivity(req, 'REJECT', activityModule, `Rejected: ${labelOf(existing)}`)
        notify({
          recipientId: existing.created_by,
          message: `Your ${lower} was rejected: ${labelOf(existing)}`,
          entityType, entityId: id,
          emailSubject: `Rejected: ${labelOf(existing)}`,
          emailHtml: notificationEmailHtml(
            'Rejected',
            comment?.trim()
              ? `The Secretary rejected <strong>${escapeHtml(labelOf(existing))}</strong>:<br/><em>"${escapeHtml(comment.trim())}"</em>`
              : `The Secretary rejected <strong>${escapeHtml(labelOf(existing))}</strong>.`
          ),
        })
        res.json({ success: true, data })
      } catch (err) {
        res.status(500).json({ error: err.message })
      }
    })
  }

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
      const approvedAt = new Date().toISOString()
      const { data, conflict, error } = await atomicUpdate(id, 'ready_to_publish', {
        status: 'approved', reviewed_by: req.user.id, reviewed_at: approvedAt,
        // The date a finished record carries — see migrations/026. Its `year`
        // follows the approval, not the upload: a draft entered in one year and
        // approved in the next belongs to the year it was approved.
        ...(approvedDateField && { [approvedDateField]: approvedAt, year: yearInManila(approvedAt) }),
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

    const patch = { status: 'published' }
    // The Secretary can set the record's approved date here (the dialog
    // pre-fills it from the document). Stored at noon UTC so it reads as the
    // same calendar day in any timezone the office might view it from.
    if (approvedDateField && typeof req.body[approvedDateField] === 'string' && req.body[approvedDateField].trim()) {
      const parsed = parseApprovedDay(req.body[approvedDateField])
      if (!parsed) return res.status(400).json({ error: 'Approved date must be a valid date (YYYY-MM-DD).' })
      patch[approvedDateField] = parsed.toISOString()
      patch.year = parsed.getUTCFullYear()
    }
    if (numberField) {
      let number = typeof req.body[numberField] === 'string' ? req.body[numberField].trim() : ''
      if (uppercaseNumber) number = number.toUpperCase()
      if (!number) return res.status(400).json({ error: `${numberLabel} is required to publish.` })

      // Case-insensitive duplicate check across every other record of this
      // type, not just the currently loaded page — the frontend's own check
      // only sees what it already fetched, so this is the authoritative one.
      let isDuplicate
      try {
        isDuplicate = !!(await findDuplicateRecord({ table, numberField, number, excludeId: id }))
      } catch (dupErr) {
        return res.status(500).json({ error: dupErr.message })
      }
      if (isDuplicate) {
        return res.status(400).json({ error: `"${number}" is already in use by another ${lower}. Please choose a different number.` })
      }
      patch[numberField] = number
    }

    try {
      const { data, conflict, error } = await atomicUpdate(id, 'approved', patch)
      if (conflict) return conflictResponse(res)
      if (error) return res.status(500).json({ error: error.message })
      await logActivity(req, 'PUBLISH', activityModule, `Published: ${labelOf(existing)}`)
      // Broadcast to every active staff account (Secretary/Clerk/Councilor/
      // Vice-Mayor), same as "new session minutes recorded"/"new session
      // agenda posted" — publishing is the record going officially live, a
      // office-wide event, not a personal heads-up to whoever happened to
      // draft it. The old version only notified `created_by`, which (a)
      // silently notified no one at all for the many existing records with
      // no recorded drafter, and (b) never told anyone else that a new law
      // just went into effect.
      notifyAllStaff({
        message: `New ${lower} published: ${labelOf(existing)}`,
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
  // currently in and, for Councilor/Vice-Mayor, whether they created it
  // (see canArchiveLegislativeRecord). Archives instead of a hard delete via
  // the `archiveRpc` Postgres function (see migrations/007), which
  // snapshots the row + its links into `archives` and removes them from the
  // live tables as one transaction.
  router.delete('/:id', verifyToken, async (req, res) => {
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from(table).select('status, created_by').eq('id', req.params.id).single()
      if (fetchErr || !existing) return res.status(404).json({ error: `${singularLabel} not found.` })
      const isOwner = existing.created_by === req.user.id
      if (!canArchiveLegislativeRecord(req.user.position, existing.status, isOwner))
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
