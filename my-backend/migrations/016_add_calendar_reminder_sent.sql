-- 016_add_calendar_reminder_sent.sql
--
-- Backs the daily "event tomorrow" reminder job (helpers/reminderJob.js).
-- `reminder_sent` prevents that job from notifying the same event twice if
-- it runs more than once on the same day (e.g. a server restart) — it's
-- flipped true the same run it sends the reminder, and never reset.

BEGIN;

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;

COMMIT;
