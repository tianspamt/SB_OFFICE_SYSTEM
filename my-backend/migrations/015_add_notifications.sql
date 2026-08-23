-- 015_add_notifications.sql
--
-- Backs the two-channel (email + in-app) notification workflow: every
-- trigger point fires through helpers/notify.js, which always writes a row
-- here (so the bell/list always has it) and additionally emails the
-- recipient via Brevo unless they've opted out.
--
-- `created_by` on the three legislative tables is not part of the original
-- notification design doc's schema section, but is required to make the
-- trigger matrix work correctly: canCreateDraft (see middleware/auth.js)
-- lets any of Secretary/Clerk/Councilor/Vice-Mayor originate a draft, so
-- "notify the Clerk who drafted this" needs a real column to resolve —
-- there's no other reliable way to identify who submitted a given record.
-- Nullable, no default/backfill: existing rows simply have no recorded
-- drafter, same reasoning as migrations/013's category/author columns.

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true;

ALTER TABLE ordinances
  ADD COLUMN IF NOT EXISTS created_by bigint REFERENCES users(id);

ALTER TABLE resolutions
  ADD COLUMN IF NOT EXISTS created_by bigint REFERENCES users(id);

ALTER TABLE session_minutes
  ADD COLUMN IF NOT EXISTS created_by bigint REFERENCES users(id);

-- Powers the in-app bell/list only — no channel/status/error_message
-- columns, since delivery auditing isn't the goal here (that's what
-- activity_logs is for). entity_type/entity_id are a polymorphic pointer
-- (no FK) matching the same pattern already used by `comments`.
CREATE TABLE IF NOT EXISTS notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  recipient_id bigint NOT NULL REFERENCES users(id),
  message text NOT NULL,
  entity_type text,
  entity_id bigint,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_id, is_read);

GRANT ALL ON notifications TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO postgres, anon, authenticated, service_role;

COMMIT;
