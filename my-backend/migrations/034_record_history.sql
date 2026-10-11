-- 034_record_history.sql
--
-- Thesis adviser request: the details of a published (or rejected)
-- ordinance/resolution show its whole trail — from upload to publish —
-- including every time the author declined, with the date and their comment,
-- up to the moment they approved. Visible only to staff (Secretary, Clerk,
-- Vice-Mayor, Councilor, SK Federated, Liga ng mga Barangay); never public.
--
-- `author_approvals` (031) can't serve this on its own: it keeps one row per
-- (record, stage), and re-requesting a declined stage overwrites that row, so
-- the decline and its comment are lost. `activity_logs` has the events but
-- only as free text with no record id. `record_history` is append-only: one
-- row per event, never updated.
--
-- Actor name/position are copied at write time so the trail still reads
-- correctly after an account is renamed, reassigned, or archived.
--
-- Same polymorphic entity_type/entity_id shape (no FK) as `comments` and
-- `author_approvals`, so archiving a record keeps its history for a restore.
--
-- Backfill: records that existed before this shipped get what can be rebuilt
-- from existing data — the upload, each author approval decision (the latest
-- one per stage; earlier overwritten declines can't be recovered), the
-- Vice-Mayor's approval, and the rejection with its reason.

BEGIN;

CREATE TABLE IF NOT EXISTS record_history (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('ordinance', 'resolution')),
  entity_id bigint NOT NULL,
  action text NOT NULL,
  stage text,
  comment text,
  actor_user_id bigint REFERENCES users(id) ON DELETE SET NULL,
  actor_name text,
  actor_position text,
  created_at timestamptz NOT NULL DEFAULT now(),
  backfilled boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_record_history_entity
  ON record_history (entity_type, entity_id, created_at);

-- Only the backend's service-role key touches this table (see 031).
GRANT ALL ON record_history TO postgres, service_role;
GRANT USAGE, SELECT ON SEQUENCE record_history_id_seq TO postgres, service_role;

-- Backfill only once: skip entirely if any backfilled rows already exist.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM record_history WHERE backfilled) THEN

    -- Uploads
    INSERT INTO record_history (entity_type, entity_id, action, actor_user_id, actor_name, actor_position, created_at, backfilled)
    SELECT 'ordinance', o.id, 'uploaded', o.created_by, u.name, u.position, COALESCE(o.uploaded_at, now()), true
    FROM ordinances o LEFT JOIN users u ON u.id = o.created_by;
    INSERT INTO record_history (entity_type, entity_id, action, actor_user_id, actor_name, actor_position, created_at, backfilled)
    SELECT 'resolution', r.id, 'uploaded', r.created_by, u.name, u.position, COALESCE(r.uploaded_at, now()), true
    FROM resolutions r LEFT JOIN users u ON u.id = r.created_by;

    -- Author approval decisions (latest per stage)
    INSERT INTO record_history (entity_type, entity_id, action, stage, comment, actor_user_id, actor_name, actor_position, created_at, backfilled)
    SELECT a.entity_type, a.entity_id,
           CASE WHEN a.on_behalf THEN 'author_approved_on_behalf'
                WHEN a.decision = 'approved' THEN 'author_approved'
                ELSE 'author_declined' END,
           a.stage, a.comment, a.decided_by_user_id,
           CASE WHEN a.on_behalf THEN u.name ELSE COALESCE(m.full_name, u.name) END,
           u.position, a.decided_at, true
    FROM author_approvals a
    LEFT JOIN users u ON u.id = a.decided_by_user_id
    LEFT JOIN sb_council_members m ON m.id = a.official_id
    WHERE a.decision IN ('approved', 'declined') AND a.decided_at IS NOT NULL;

    -- Vice-Mayor approvals (approved/published records: reviewed_* is the VM's)
    INSERT INTO record_history (entity_type, entity_id, action, actor_user_id, actor_name, actor_position, created_at, backfilled)
    SELECT 'ordinance', o.id, 'vm_approved', o.reviewed_by, u.name, u.position, COALESCE(o.reviewed_at, o.approved_on), true
    FROM ordinances o LEFT JOIN users u ON u.id = o.reviewed_by
    WHERE o.status IN ('approved', 'published') AND COALESCE(o.reviewed_at, o.approved_on) IS NOT NULL;
    INSERT INTO record_history (entity_type, entity_id, action, actor_user_id, actor_name, actor_position, created_at, backfilled)
    SELECT 'resolution', r.id, 'vm_approved', r.reviewed_by, u.name, u.position, COALESCE(r.reviewed_at, r.approved_on), true
    FROM resolutions r LEFT JOIN users u ON u.id = r.reviewed_by
    WHERE r.status IN ('approved', 'published') AND COALESCE(r.reviewed_at, r.approved_on) IS NOT NULL;

    -- Rejections, with the latest comment as the reason
    INSERT INTO record_history (entity_type, entity_id, action, comment, actor_user_id, actor_name, actor_position, created_at, backfilled)
    SELECT 'ordinance', o.id, 'rejected',
           (SELECT c.text FROM comments c WHERE c.entity_type = 'ordinance' AND c.entity_id = o.id ORDER BY c.created_at DESC LIMIT 1),
           o.reviewed_by, u.name, u.position, COALESCE(o.reviewed_at, now()), true
    FROM ordinances o LEFT JOIN users u ON u.id = o.reviewed_by
    WHERE o.status = 'rejected';
    INSERT INTO record_history (entity_type, entity_id, action, comment, actor_user_id, actor_name, actor_position, created_at, backfilled)
    SELECT 'resolution', r.id, 'rejected',
           (SELECT c.text FROM comments c WHERE c.entity_type = 'resolution' AND c.entity_id = r.id ORDER BY c.created_at DESC LIMIT 1),
           r.reviewed_by, u.name, u.position, COALESCE(r.reviewed_at, now()), true
    FROM resolutions r LEFT JOIN users u ON u.id = r.reviewed_by
    WHERE r.status = 'rejected';

  END IF;
END $$;

COMMIT;
