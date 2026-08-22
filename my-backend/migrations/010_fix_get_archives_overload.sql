-- 010_fix_get_archives_overload.sql
--
-- Fixes a real bug introduced by 009: CREATE OR REPLACE FUNCTION cannot
-- change a function's argument *count*, even when the new argument has a
-- default. Postgres doesn't treat that as "replacing" get_archives(text,
-- text, int, int) — it creates a second, separately-overloaded
-- get_archives(text, text, int, int, text) alongside the old one. Since
-- every parameter on both versions has a default, PostgREST can no longer
-- tell which one a 4-named-argument rpc() call means and starts failing
-- every request with PGRST203 ("Could not choose the best candidate
-- function") — not just sort requests, ALL of them, including plain lists.
--
-- The fix is to drop the stale 4-parameter overload so only the current
-- 5-parameter (with p_sort) version remains.

BEGIN;

DROP FUNCTION IF EXISTS get_archives(text, text, int, int);

COMMIT;
