-- 021_add_role_to_ordinance_and_resolution_officials.sql
--
-- Introduces Co-Author and Sponsor as two new roles a council member can
-- hold on an ordinance/resolution, alongside the existing (single) Author.
-- Author is set at draft/upload time (see routes/ordinances.js's own
-- POST/PUT); Co-Author and Sponsor are only ever added later, once the
-- Secretary has accepted the draft into a reading — RA 7160's three-reading
-- process is where co-authorship/sponsorship actually gets recorded, not at
-- drafting time. See helpers/officialRoleRoutes.js's PUT /:id/officials.
--
-- All existing rows are implicitly authors (this table only ever recorded
-- authorship before now), so the DEFAULT backfills them correctly with no
-- separate UPDATE needed.

BEGIN;

ALTER TABLE ordinance_officials
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'author'
    CHECK (role IN ('author', 'co_author', 'sponsor'));

ALTER TABLE resolution_officials
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'author'
    CHECK (role IN ('author', 'co_author', 'sponsor'));

-- Guards against double-adding the same councilor in the same role on the
-- same record (the "+ Add Councilor" UI calling through twice, a race,
-- etc.) — a person can still hold different roles on the same record, this
-- only blocks an exact (record, person, role) repeat.
CREATE UNIQUE INDEX IF NOT EXISTS ordinance_officials_unique_role
  ON ordinance_officials (ordinance_id, official_id, role);
CREATE UNIQUE INDEX IF NOT EXISTS resolution_officials_unique_role
  ON resolution_officials (resolution_id, official_id, role);

COMMIT;
