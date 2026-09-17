-- 023_relax_content_posts_body_not_null.sql
--
-- The Content Management "New Post" form only marks Title as required (see
-- ContentPostModal.jsx) — Caption ("body" in the DB/API) has no asterisk,
-- meaning a photo-only post with no caption text was always meant to be
-- allowed. The backend disagreed on both ends: routes/contentPosts.js
-- rejected a request with an empty body ("Title and body are required."),
-- and the column itself was NOT NULL, so even fixing that check alone would
-- still have failed at insert time. This drops the DB-level constraint;
-- the application-level check is relaxed to title-only in the same change.
--
-- content_posts itself predates this migrations folder (created directly in
-- the Supabase dashboard, like councils/archives before 001/007), so there
-- is no earlier migration to amend.

BEGIN;

ALTER TABLE content_posts ALTER COLUMN body DROP NOT NULL;

COMMIT;
