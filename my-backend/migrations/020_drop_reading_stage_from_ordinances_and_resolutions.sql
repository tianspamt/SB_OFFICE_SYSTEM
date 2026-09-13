-- 020_drop_reading_stage_from_ordinances_and_resolutions.sql
--
-- Reverts 019. That migration tracked the three RA 7160 readings as a
-- separate `reading_stage` column alongside `status`, on the theory that
-- reading progress was an axis independent of the main review pipeline.
-- In practice it's simpler to fold the three readings directly into
-- `status` as three more values (first_reading, second_reading,
-- third_reading) sitting between "Secretary accepted" and "ready for
-- Vice-Mayor" — see helpers/legislativeReviewRoutes.js's updated state
-- machine. `status` is a plain text column with no CHECK constraint, so
-- that change needed no schema migration of its own; this one only cleans
-- up the now-unused column from 019.
--
-- IF EXISTS: safe to run whether or not 019 was ever applied to this
-- database.

BEGIN;

ALTER TABLE ordinances DROP COLUMN IF EXISTS reading_stage;
ALTER TABLE resolutions DROP COLUMN IF EXISTS reading_stage;

COMMIT;
