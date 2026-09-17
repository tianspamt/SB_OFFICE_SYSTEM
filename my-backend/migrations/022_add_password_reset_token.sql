-- 022_add_password_reset_token.sql
--
-- Backs a real "reset password" email flow. The admin-forced reset used to
-- generate and email a temporary password (see
-- 012_add_must_change_password.sql), requiring the account to log in with
-- it and get funneled through LogIn.jsx's forced-change screen before doing
-- anything else. This replaces that with a time-limited, single-use link:
-- the account clicks it and sets their own new password directly, without
-- ever having to authenticate with a temp credential first — see
-- POST /:id/reset-password (link issuance) and the new public
-- GET/POST /api/reset-password/:token (link validation + confirm) in
-- routes/users.js and routes/auth.js.
--
-- must_change_password (012) is left in place — nothing sets it `true`
-- anymore going forward, but any account already mid-reset under the old
-- flow still gets funneled through the existing forced-change screen on
-- their next login rather than being silently broken by this migration.

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires timestamptz;

-- Partial (nulls excluded) since most rows will have no active reset token
-- at any given time — this only needs to guarantee two live tokens can
-- never collide, not index every null.
CREATE UNIQUE INDEX IF NOT EXISTS users_reset_token_idx
  ON users (reset_token) WHERE reset_token IS NOT NULL;

COMMIT;
