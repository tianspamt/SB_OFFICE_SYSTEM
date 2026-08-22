-- 005_unique_active_singular_position_per_council.sql
--
-- Hard DB-level guarantee that at most one member can hold Vice Mayor, Liga
-- ng mga Barangay President, or SK Federated President "active" at the same
-- time within a single council — these are singular by law (RA 7160), unlike
-- "Councilor" which has multiple seats (see the app-level soft cap for that
-- one instead; a hard uniqueness constraint doesn't fit a multi-seat role).
--
-- This is a PARTIAL unique index: it only applies to active rows whose
-- position is one of the three singular ones, so any number of "Councilor"
-- rows (or terms_ended rows for any position) are unaffected. The index key
-- is (council_id, position) — not council_id alone — so the three singular
-- roles can each independently have their own active holder at once; it
-- only blocks TWO members holding the SAME one of those roles simultaneously.
--
-- If this fails with a duplicate-key error, there's already a live data
-- conflict — run the diagnostic query below first to find and manually
-- resolve it (e.g. end whichever term is actually stale) before retrying.
--
-- Diagnostic (run first if unsure whether this will succeed):
--   SELECT council_id, position, array_agg(id) AS term_ids, array_agg(council_member_id) AS member_ids
--   FROM sb_council_member_terms
--   WHERE status = 'active'
--     AND position IN ('Vice Mayor', 'Liga ng mga Barangay President', 'SK Federated President')
--   GROUP BY council_id, position
--   HAVING count(*) > 1;

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_singular_position_per_council
  ON sb_council_member_terms (council_id, position)
  WHERE status = 'active'
    AND position IN ('Vice Mayor', 'Liga ng mga Barangay President', 'SK Federated President');

COMMIT;
