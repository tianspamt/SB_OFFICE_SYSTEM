-- 027_drop_publish_on_from_ordinances_and_resolutions.sql
--
-- Removes 025's `publish_on`, which 026's `approved_on` replaced (records are
-- dated by when the Vice-Mayor approved them, not when they were published).
-- 026 deliberately left it in place so an already-running older backend kept
-- working through the switch; nothing reads or writes it any more, so run
-- this once the backend has been restarted on the current code — an older
-- build that still queries `publish_on` would fail against a dropped column.

BEGIN;

ALTER TABLE ordinances  DROP COLUMN IF EXISTS publish_on;
ALTER TABLE resolutions DROP COLUMN IF EXISTS publish_on;

COMMIT;
