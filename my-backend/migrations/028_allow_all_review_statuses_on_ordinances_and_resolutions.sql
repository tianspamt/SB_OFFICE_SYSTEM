-- 028_allow_all_review_statuses_on_ordinances_and_resolutions.sql
--
-- Fixes: accepting a pending resolution failed with
--   new row for relation "resolutions" violates check constraint
--   "resolutions_status_check"
-- `resolutions` carries a CHECK on `status` that was created in the Supabase
-- dashboard (it isn't in any earlier migration) and predates the reading
-- stages, so it doesn't allow `first_reading` / `second_reading` /
-- `third_reading` — the very first step of Accept. 020 assumed `status` had no
-- CHECK; for resolutions that turned out to be wrong. (Ordinances already work
-- through every reading stage, so they are deliberately left untouched.)
--
-- Replaces it with the full set of statuses the review workflow uses (see
-- helpers/legislativeReviewRoutes.js):
--   pending -> needs_revision -> pending
--   pending -> first_reading -> second_reading -> third_reading
--           -> ready_to_publish -> approved -> published
--   any reading stage -> rejected
--
-- Every status currently stored on `resolutions` (published, pending) is in
-- the list, so adding the constraint back can't fail on existing rows.
--
-- (File name keeps its original "ordinances_and_resolutions" wording so it
-- stays the same file if it was already opened or copied elsewhere.)

BEGIN;

ALTER TABLE resolutions DROP CONSTRAINT IF EXISTS resolutions_status_check;
ALTER TABLE resolutions ADD CONSTRAINT resolutions_status_check CHECK (status IN (
  'pending', 'needs_revision',
  'first_reading', 'second_reading', 'third_reading',
  'ready_to_publish', 'approved', 'published', 'rejected'
));

COMMIT;
