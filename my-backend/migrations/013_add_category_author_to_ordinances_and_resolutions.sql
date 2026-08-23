-- 013_add_category_author_to_ordinances_and_resolutions.sql
--
-- The Category and Author filters on the Ordinances/Resolutions Published
-- and Pending tabs have existed in the UI since early on, but never had a
-- real column to filter against — the upload/edit forms never collected
-- either value, and the search/filter query never referenced them. This
-- adds the two columns so the filters (and the upload/edit forms that now
-- populate them) have real data to work with.
--
-- Nullable, no default: existing rows simply have no category/author until
-- someone edits them — there's nothing sensible to backfill.
--
-- IF NOT EXISTS on each column: `ordinances.category` turned out to already
-- exist (apparently a leftover from an earlier schema design that the app
-- code never wired up), which aborted the whole transaction on a bare
-- `ADD COLUMN`. This makes the migration safe to run regardless of which of
-- the four already exist, instead of requiring the exact pre-existing state
-- to be known up front.

BEGIN;

ALTER TABLE ordinances
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS author text;

ALTER TABLE resolutions
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS author text;

COMMIT;
