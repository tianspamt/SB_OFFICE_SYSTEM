-- 006_drop_sb_council_members_position.sql
--
-- Final cleanup step of the councilor-management cutover. This column has
-- been unused for writes since migrations 002/003 moved position onto
-- sb_council_member_terms — every remaining read of it (in ordinances.js,
-- resolutions.js, and archives.js) has now been switched to compute
-- position from the member's terms instead, the same way
-- routes/councilMembers.js's own GET routes already did. Nothing in the
-- app reads this column anymore.
--
-- Requires 002 and 003 to have already run.

BEGIN;

ALTER TABLE sb_council_members
  DROP COLUMN IF EXISTS position;

COMMIT;
