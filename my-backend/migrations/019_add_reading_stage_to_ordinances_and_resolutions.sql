-- 019_add_reading_stage_to_ordinances_and_resolutions.sql
--
-- Adds `reading_stage` to ordinances and resolutions, tracking the three
-- readings a draft goes through in session (RA 7160) before the Secretary
-- may Accept it (pending -> ready_to_publish). This is deliberately a
-- separate column from `status` rather than new status values — reading
-- progress is an orthogonal axis (it only ever changes while status stays
-- 'pending'), so keeping it out of the status enum avoids touching every
-- place that already branches on status (isLockedStatus,
-- actionableStatusesForRole, the Pending/Ready-to-Publish tab split, etc.)
-- for what's fundamentally a second, independent piece of progress.
--
-- NULL means "not yet read" (just uploaded). The CHECK constraint mirrors
-- the exact three string values the backend writes (see
-- helpers/legislativeReviewRoutes.js's READING_STAGES) so a typo in either
-- place fails loudly instead of silently drifting apart.
--
-- Nullable, no default, no backfill: existing pending drafts simply start
-- at "not yet read" and the Secretary advances them from there; already
-- ready_to_publish/approved/published records never use this column.

BEGIN;

ALTER TABLE ordinances
  ADD COLUMN IF NOT EXISTS reading_stage text
    CHECK (reading_stage IN ('first_reading', 'second_reading', 'third_reading'));

ALTER TABLE resolutions
  ADD COLUMN IF NOT EXISTS reading_stage text
    CHECK (reading_stage IN ('first_reading', 'second_reading', 'third_reading'));

COMMIT;
