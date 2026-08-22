-- 003_relax_sb_council_members_position_not_null.sql
--
-- sb_council_members.position predates 002_add_council_id_and_position_to_...
-- and still has a NOT NULL constraint from when position lived on the
-- person. Now that a member can be created with no term yet (position is
-- only ever known once you know which term/seat it's for), the app no
-- longer supplies a value on insert — so without this, every "Add Official
-- with no term" request fails with a not-null constraint violation.
--
-- The column itself is untouched otherwise (still readable, still holds
-- whatever legacy value existing rows have) — this migration only removes
-- the constraint blocking new member rows from being created without it.

BEGIN;

ALTER TABLE sb_council_members
  ALTER COLUMN position DROP NOT NULL;

COMMIT;
