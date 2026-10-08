-- 033_author_approval_on_accept.sql
--
-- Adds an "accepted" step between Pending and First Reading, so the author
-- approves a draft before its first reading starts:
--   pending -> accepted -> first_reading -> second_reading -> third_reading
--           -> ready_to_publish -> approved -> published
-- Accept now moves a draft to 'accepted' and requests the author's approval
-- (stage 'accepted'). Once the author approves (or the Secretary records it on
-- the author's behalf), the Secretary clicks "Proceed to First Reading"
-- (PUT /:id/advance-reading). See helpers/legislativeReviewRoutes.js.
--
-- 1. resolutions.status — its CHECK (028) lists every allowed status; add
--    'accepted'.
-- 2. ordinances.status — 028 found no CHECK on ordinances. If one has since
--    been added in the dashboard, it is replaced with the same full list;
--    otherwise nothing changes.
-- 3. author_approvals.stage — add 'accepted'.
--
-- Records already in a reading stage are unaffected; they finish under the
-- existing per-reading approvals.

BEGIN;

ALTER TABLE resolutions DROP CONSTRAINT IF EXISTS resolutions_status_check;
ALTER TABLE resolutions ADD CONSTRAINT resolutions_status_check CHECK (status IN (
  'pending', 'needs_revision', 'accepted',
  'first_reading', 'second_reading', 'third_reading',
  'ready_to_publish', 'approved', 'published', 'rejected'
));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ordinances_status_check') THEN
    ALTER TABLE ordinances DROP CONSTRAINT ordinances_status_check;
    ALTER TABLE ordinances ADD CONSTRAINT ordinances_status_check CHECK (status IN (
      'pending', 'needs_revision', 'accepted',
      'first_reading', 'second_reading', 'third_reading',
      'ready_to_publish', 'approved', 'published', 'rejected'
    ));
  END IF;
END $$;

ALTER TABLE author_approvals DROP CONSTRAINT IF EXISTS author_approvals_stage_check;
ALTER TABLE author_approvals ADD CONSTRAINT author_approvals_stage_check
  CHECK (stage IN ('accepted', 'first_reading', 'second_reading', 'third_reading', 'publish'));

COMMIT;
