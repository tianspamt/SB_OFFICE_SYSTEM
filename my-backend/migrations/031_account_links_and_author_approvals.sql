-- 031_account_links_and_author_approvals.sql
--
-- Backs the panel-requested "author approval" workflow: the author of an
-- ordinance/resolution must approve each completed reading (and the final
-- publish) before the record may move on. See Author_Approval_Workflow_v2.docx.
--
-- 1. sb_council_members.user_id — links a council member (who gets tagged as
--    Author) to the login account (users) that person signs in with. The two
--    tables stay separate on purpose: past officials have no account, and the
--    Secretary/Clerk have accounts but aren't council members. Nullable and
--    unique — one account per member, one member per account. Set
--    automatically when a member is added with "Create login account"
--    (Option A) or by certain-match auto-linking (Option B); see
--    helpers/accountLinks.js.
--
-- 2. author_approvals — one row per (record, stage). `decision` starts as
--    'pending' when the Secretary requests approval and becomes 'approved' or
--    'declined'. A declined stage can be requested again (the same row goes
--    back to 'pending'). `on_behalf` marks an approval the Secretary recorded
--    for an author who has no linked account (a note is required for those).
--    No FK to ordinances/resolutions — same polymorphic entity_type/entity_id
--    shape as `comments`, so archiving a record leaves its approval history
--    intact for a later restore.
--
-- 3. author_approval_required on ordinances/resolutions — set true by Accept.
--    Records that were already mid-reading when this shipped keep false, so
--    they finish under the old rules (grandfathered) instead of getting stuck.

BEGIN;

ALTER TABLE sb_council_members
  ADD COLUMN IF NOT EXISTS user_id bigint REFERENCES users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sb_council_members_user_id_unique
  ON sb_council_members (user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS author_approvals (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('ordinance', 'resolution')),
  entity_id bigint NOT NULL,
  stage text NOT NULL CHECK (stage IN ('first_reading', 'second_reading', 'third_reading', 'publish')),
  official_id bigint REFERENCES sb_council_members(id) ON DELETE SET NULL,
  decision text NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending', 'approved', 'declined')),
  comment text,
  on_behalf boolean NOT NULL DEFAULT false,
  requested_by bigint REFERENCES users(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_by_user_id bigint REFERENCES users(id),
  decided_at timestamptz,
  reminder_sent_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS author_approvals_unique_stage
  ON author_approvals (entity_type, entity_id, stage);
CREATE INDEX IF NOT EXISTS idx_author_approvals_official_pending
  ON author_approvals (official_id) WHERE decision = 'pending';

-- A raw CREATE TABLE in the SQL Editor doesn't get the grants the Table
-- Editor UI applies (see README, the councils note). Only the backend's
-- service-role key ever touches this table, so anon/authenticated get none.
GRANT ALL ON author_approvals TO postgres, service_role;
GRANT USAGE, SELECT ON SEQUENCE author_approvals_id_seq TO postgres, service_role;

ALTER TABLE ordinances
  ADD COLUMN IF NOT EXISTS author_approval_required boolean NOT NULL DEFAULT false;
ALTER TABLE resolutions
  ADD COLUMN IF NOT EXISTS author_approval_required boolean NOT NULL DEFAULT false;

COMMIT;
