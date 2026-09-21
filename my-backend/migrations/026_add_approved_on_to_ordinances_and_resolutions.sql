-- 026_add_approved_on_to_ordinances_and_resolutions.sql
--
-- Supersedes 025's `publish_on`. That column dated a record by when the
-- Secretary *published* it, but the date the office actually wants a
-- finished ordinance/resolution to carry is when it was *approved* (the
-- Vice-Mayor's approval, the `ready_to_publish` -> `approved` step) — publishing
-- is just the follow-up click that makes it public. `approved_on` is stamped
-- by PUT /:id/vm-approve (see helpers/legislativeReviewRoutes.js); the
-- Published lists sort/filter by it and the record views label it
-- "Approved". `uploaded_at` is untouched and still means "entered into the
-- system".
--
-- Backfill for records already approved or published: `reviewed_at` is set
-- by every reviewer action and nothing writes it after the Vice-Mayor's
-- approval (publishing only changes status/number), so for these rows it *is*
-- the approval time. Falls back to `uploaded_at` if it's somehow empty.
--
-- 025's `publish_on` is deliberately left in place rather than dropped or
-- renamed: adding a new column keeps an already-running older backend
-- working through the switch, whereas dropping one it queries would break it
-- until restart. Nothing reads or writes `publish_on` any more; it can be
-- dropped in a later migration once no old build is in use.

BEGIN;

ALTER TABLE ordinances  ADD COLUMN IF NOT EXISTS approved_on timestamptz;
ALTER TABLE resolutions ADD COLUMN IF NOT EXISTS approved_on timestamptz;

UPDATE ordinances
SET approved_on = COALESCE(reviewed_at, uploaded_at)
WHERE status IN ('approved', 'published') AND approved_on IS NULL;

UPDATE resolutions
SET approved_on = COALESCE(reviewed_at, uploaded_at)
WHERE status IN ('approved', 'published') AND approved_on IS NULL;

COMMIT;
