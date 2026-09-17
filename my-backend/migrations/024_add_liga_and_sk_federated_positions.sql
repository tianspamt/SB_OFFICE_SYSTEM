-- 024_add_liga_and_sk_federated_positions.sql
--
-- Adds "Liga ng mga Barangay" and "SK Federated" as selectable positions for
-- role:'user' accounts in the Add User form (UserFormModal.jsx) — both are
-- ex-officio Sangguniang Bayan members, so they're treated exactly like an
-- elected Councilor everywhere in the backend's RBAC (canCreateDraft in
-- middleware/auth.js, canArchiveLegislativeRecord in helpers/utils.js), just
-- recorded under their own position value rather than literally 'councilor'.
--
-- users.position has a `users_position_check` CHECK constraint restricting
-- it to the fixed set in helpers/roles.js's ROLE_POSITIONS, applied directly
-- in the Supabase dashboard (no earlier migration defines it, so there's
-- nothing to amend — this replaces it outright by the name surfaced in the
-- constraint-violation error). Confirmed live via a throwaway insert before
-- writing this: inserting position 'liga_ng_mga_barangay' failed with
-- "violates check constraint users_position_check" prior to this migration.

BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_position_check;

ALTER TABLE users ADD CONSTRAINT users_position_check
  CHECK (position IN (
    'secretary', 'clerk',
    'councilor', 'vice_mayor', 'liga_ng_mga_barangay', 'sk_federated'
  ));

COMMIT;
