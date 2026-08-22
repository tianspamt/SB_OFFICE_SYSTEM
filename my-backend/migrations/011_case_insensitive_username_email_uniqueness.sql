-- 011_case_insensitive_username_email_uniqueness.sql
--
-- username/email uniqueness was only enforced by a plain (case-sensitive)
-- unique constraint, so "JDoe"/"jdoe" or "Foo@Gmail.com"/"foo@gmail.com"
-- could exist as two "different" accounts. This adds a case-insensitive
-- unique index on top of the existing constraint — casing is still
-- preserved for display, only uniqueness becomes case-insensitive.
--
-- No application code changes needed: a violation of this index raises the
-- same Postgres unique_violation error code (23505) the app already checks
-- for when handling the original constraint.
--
-- Verified against production data before writing this migration — zero
-- case-variant duplicates existed. If running against a different
-- environment, check first (this migration fails outright if either finds
-- rows):
--   SELECT lower(username), count(*) FROM users GROUP BY 1 HAVING count(*) > 1;
--   SELECT lower(email), count(*) FROM users GROUP BY 1 HAVING count(*) > 1;

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_ci ON users (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_ci ON users (lower(email));

COMMIT;
