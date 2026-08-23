-- 017_drop_notifications_table.sql
--
-- Reverses 015's `notifications` table: the workflow moved to email-only
-- (see helpers/notify.js) — there is no in-app bell/list to power anymore.
-- users.email_notifications and calendar_events.reminder_sent (also from
-- 015/016) stay; both still back the email-only flow.

BEGIN;

DROP TABLE IF EXISTS notifications;

COMMIT;
