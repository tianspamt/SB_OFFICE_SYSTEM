-- 025_add_publish_on_to_ordinances_and_resolutions.sql
--
-- Records were only ever dated by `uploaded_at` — when the draft was first
-- entered into the system — so a published ordinance kept showing its
-- upload date (often weeks before the Secretary actually published it, or
-- the date an old record was scanned in) instead of the date it became
-- official. `publish_on` records the moment the Secretary publishes (set by
-- PUT /:id/publish, see helpers/legislativeReviewRoutes.js); the Published
-- lists sort/filter by it and the record views label it "Published".
-- `uploaded_at` is untouched and still means "entered into the system".
--
-- Backfill for records that are already published: the best evidence of the
-- real publish time is the PUBLISH entry the publish route writes to
-- activity_logs ("Published: <title>"), so that's used when there is a
-- matching one at/after the upload; otherwise `reviewed_at` (the last
-- reviewer action, the Vice-Mayor's approval — normally shortly before the
-- publish), otherwise `uploaded_at`. Backfilled values are therefore
-- best-effort; only records published from here on carry an exact time.

BEGIN;

ALTER TABLE ordinances  ADD COLUMN IF NOT EXISTS publish_on timestamptz;
ALTER TABLE resolutions ADD COLUMN IF NOT EXISTS publish_on timestamptz;

UPDATE ordinances o
SET publish_on = COALESCE(
  (SELECT max(l.created_at) FROM activity_logs l
    WHERE l.action = 'PUBLISH'
      AND l.module = 'Ordinances'
      AND l.description = 'Published: ' || o.title
      AND l.created_at >= o.uploaded_at),
  o.reviewed_at,
  o.uploaded_at
)
WHERE o.status = 'published' AND o.publish_on IS NULL;

UPDATE resolutions r
SET publish_on = COALESCE(
  (SELECT max(l.created_at) FROM activity_logs l
    WHERE l.action = 'PUBLISH'
      AND l.module = 'Resolutions'
      AND l.description = 'Published: ' || r.title
      AND l.created_at >= r.uploaded_at),
  r.reviewed_at,
  r.uploaded_at
)
WHERE r.status = 'published' AND r.publish_on IS NULL;

COMMIT;
