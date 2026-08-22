-- 012_add_must_change_password.sql
--
-- Backs the new admin-initiated password reset flow: an admin can force a
-- temporary password onto a user's account (emailed to them), and this flag
-- marks that the account must set a real password before doing anything
-- else. Cleared automatically by PUT /api/users/:id/password on a
-- successful change — see routes/users.js.

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

COMMIT;
