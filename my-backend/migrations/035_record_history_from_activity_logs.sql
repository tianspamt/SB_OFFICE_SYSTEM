-- 035_record_history_from_activity_logs.sql
--
-- 034's backfill could only rebuild what the record tables still hold, so
-- records that predate `record_history` were missing their Accept, each
-- reading (First/Second/Third, "Send for VM Approval"), the author approval
-- requests, every earlier author decline that a re-request had overwritten,
-- Request Changes, and Publish. All of those were written to `activity_logs`
-- as "<what happened>: <record title>" (see helpers/legislativeReviewRoutes.js),
-- so they're recovered here by matching that text to the record's title —
-- the same approach 025 used for publish dates.
--
-- Limits: a decline's comment was only ever kept in `author_approvals`, which
-- a re-request clears, so an overwritten decline comes back with its date but
-- no comment. A record whose title was edited after an event won't match
-- that event's log line.
--
-- Only logs written before live history recording started are imported, so
-- nothing recorded since 034 is duplicated. Runs once (guarded below).

BEGIN;

DO $$
DECLARE
  cutoff timestamptz := COALESCE((SELECT min(created_at) FROM record_history WHERE NOT backfilled), now());
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM record_history
    WHERE backfilled AND action IN ('accepted', 'advanced', 'author_approval_requested', 'changes_requested', 'published')
  ) THEN

    WITH recs AS (
      SELECT 'ordinance'::text AS et, 'Ordinances'::text AS module, id, title, ordinance_number AS num, uploaded_at FROM ordinances
      UNION ALL
      SELECT 'resolution', 'Resolutions', id, title, resolution_number, uploaded_at FROM resolutions
    ),
    matched AS (
      SELECT l.action AS log_action, l.user_id, l.user_name, l.created_at,
             r.et, r.id AS rid, r.num,
             left(l.description, length(l.description) - length(r.title) - 2) AS prefix
      FROM activity_logs l
      JOIN recs r
        ON l.module = r.module
       AND right(l.description, length(r.title) + 2) = ': ' || r.title
       AND l.created_at >= COALESCE(r.uploaded_at, '-infinity'::timestamptz)
      WHERE l.action IN ('ACCEPT', 'ADVANCE_READING', 'AUTHOR_DECLINE', 'REQUEST_AUTHOR_APPROVAL', 'REQUEST_CHANGES', 'PUBLISH')
        AND COALESCE(l.status, 'success') = 'success'
        AND l.created_at < cutoff
    ),
    parsed AS (
      SELECT m.*,
             CASE
               WHEN log_action = 'ACCEPT' THEN 'accepted'
               WHEN log_action = 'ADVANCE_READING' THEN 'advanced'
               WHEN log_action = 'AUTHOR_DECLINE' THEN 'author_declined'
               WHEN log_action = 'REQUEST_AUTHOR_APPROVAL' THEN 'author_approval_requested'
               WHEN log_action = 'REQUEST_CHANGES' THEN 'changes_requested'
               WHEN log_action = 'PUBLISH' THEN 'published'
             END AS action,
             CASE
               WHEN log_action = 'ADVANCE_READING' THEN
                 CASE prefix
                   WHEN 'Marked first reading' THEN 'first_reading'
                   WHEN 'Marked second reading' THEN 'second_reading'
                   WHEN 'Marked third reading' THEN 'third_reading'
                   WHEN 'Completed third reading' THEN 'ready_to_publish'
                 END
               WHEN log_action IN ('AUTHOR_DECLINE', 'REQUEST_AUTHOR_APPROVAL') THEN
                 CASE substring(prefix FROM '\((acceptance \(before First Reading\)|First Reading|Second Reading|Third Reading|final approval to publish)\)$')
                   WHEN 'acceptance (before First Reading)' THEN 'accepted'
                   WHEN 'First Reading' THEN 'first_reading'
                   WHEN 'Second Reading' THEN 'second_reading'
                   WHEN 'Third Reading' THEN 'third_reading'
                   WHEN 'final approval to publish' THEN 'publish'
                 END
             END AS stage
      FROM matched m
    )
    INSERT INTO record_history (entity_type, entity_id, action, stage, comment, actor_user_id, actor_name, actor_position, created_at, backfilled)
    SELECT p.et, p.rid, p.action, p.stage,
           CASE
             WHEN p.action = 'published' THEN p.num
             -- Request Changes always posts its reason to the comment thread
             -- just before the log line.
             WHEN p.action = 'changes_requested' THEN (
               SELECT c.text FROM comments c
               WHERE c.entity_type = p.et AND c.entity_id = p.rid
                 AND c.created_at BETWEEN p.created_at - interval '10 minutes' AND p.created_at + interval '1 minute'
               ORDER BY c.created_at DESC LIMIT 1)
           END,
           p.user_id, p.user_name, u.position, p.created_at, true
    FROM parsed p
    LEFT JOIN users u ON u.id = p.user_id
    WHERE p.action IS NOT NULL
      -- Unrecognized wording (e.g. an older log format) is skipped rather than
      -- shown as a step with no stage.
      AND (p.action NOT IN ('advanced', 'author_declined', 'author_approval_requested') OR p.stage IS NOT NULL)
      -- 034 already imported each stage's latest decision from author_approvals
      -- (with its comment) — don't add the same decline twice.
      AND NOT (p.action = 'author_declined' AND EXISTS (
        SELECT 1 FROM record_history h
        WHERE h.backfilled AND h.action = 'author_declined'
          AND h.entity_type = p.et AND h.entity_id = p.rid AND h.stage = p.stage
          AND abs(extract(epoch FROM h.created_at - p.created_at)) < 120));

  END IF;
END $$;

COMMIT;
