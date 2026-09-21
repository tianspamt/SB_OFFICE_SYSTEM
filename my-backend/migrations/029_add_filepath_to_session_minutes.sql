-- 029_add_filepath_to_session_minutes.sql
--
-- Session minutes never kept the file they were uploaded from: an upload only
-- extracted its text (or OCR'd an image) and the file itself was thrown away,
-- so a PDF could not be opened afterwards and a Word file could not be
-- downloaded. `filepath` is where the stored file lives in the `assets`
-- storage bucket — the same column ordinances, resolutions and order of
-- business already have — so the View window can open the PDF or download the
-- Word file like every other legislative record.
--
-- Nullable: existing records (typed in, or uploaded before this) have no file
-- and simply keep showing their text. Nothing else about them changes, and
-- archive/restore (007) copies whole rows, so it picks the new column up
-- automatically.

BEGIN;

ALTER TABLE session_minutes ADD COLUMN IF NOT EXISTS filepath text;

COMMIT;
