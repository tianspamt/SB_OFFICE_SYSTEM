-- 004_add_term_id_to_ordinance_and_resolution_officials.sql
--
-- ordinance_officials / resolution_officials previously stored only
-- official_id (-> sb_council_members.id, the PERSON), and the GET routes
-- live-joined straight to that person's row for display. So an ordinance's
-- author card would silently start showing a DIFFERENT position years
-- later if that person's council membership changed — even though the
-- ordinance itself never changed. term_id anchors each authorship credit to
-- the specific membership (sb_council_member_terms row) that was actually
-- current when the record was reviewed/uploaded, so the position displayed
-- is permanently correct for that document.
--
-- official_id is left in place (not touched, not dropped) — see the
-- councilor-management punch list for the later cleanup step once the app
-- is confirmed to read term_id everywhere instead.
--
-- Requires 002_add_council_id_and_position_to_terms.sql to have already run.

BEGIN;

ALTER TABLE ordinance_officials
  ADD COLUMN IF NOT EXISTS term_id bigint REFERENCES sb_council_member_terms(id);

ALTER TABLE resolution_officials
  ADD COLUMN IF NOT EXISTS term_id bigint REFERENCES sb_council_member_terms(id);

-- Backfill: for each existing row, pick the "best guess" membership using
-- COALESCE(reviewed_at, uploaded_at) as the point in time that mattered —
-- neither table has a date_approved column, so this is the closest
-- available proxy for "when was this record actually acted on" (falling
-- back to when it was first uploaded if it was never reviewed).
--
-- Preference order per candidate term (lowest tier wins; ties within a tier
-- broken by whichever term_start is temporally closest to that point date):
--   tier 0 — the term's date range actually covers the point date
--   tier 1 — the term started before the point date (best available
--            predecessor, even if it had already formally ended by then)
--   tier 2 — only terms starting AFTER the point date exist (a data-entry
--            oddity: the record predates this person's earliest known term)
--
-- A member with zero terms at all (possible — see 003) leaves term_id NULL;
-- the app falls back to the live sb_council_members join for those rows,
-- same as it did before this migration.
-- Note: the LATERAL subquery below can't reference the UPDATE target's own
-- alias (oo) — Postgres doesn't expose it to a LATERAL item in the FROM
-- clause, only ordinary preceding FROM-clause entries. So oo2 re-joins the
-- same table as a normal (non-target) alias for LATERAL to reference, and
-- the outer WHERE ties it back to the real target row via oo.id = oo2.id.
UPDATE ordinance_officials oo
SET term_id = best.id
FROM ordinances o
JOIN ordinance_officials oo2 ON oo2.ordinance_id = o.id
LEFT JOIN LATERAL (
  SELECT t.id
  FROM sb_council_member_terms t
  WHERE t.council_member_id = oo2.official_id
  ORDER BY
    CASE
      WHEN t.term_start <= COALESCE(o.reviewed_at, o.uploaded_at)::date
       AND (t.term_end IS NULL OR t.term_end >= COALESCE(o.reviewed_at, o.uploaded_at)::date)
      THEN 0
      WHEN t.term_start <= COALESCE(o.reviewed_at, o.uploaded_at)::date THEN 1
      ELSE 2
    END,
    CASE
      WHEN t.term_start <= COALESCE(o.reviewed_at, o.uploaded_at)::date
      THEN COALESCE(o.reviewed_at, o.uploaded_at)::date - t.term_start
      ELSE t.term_start - COALESCE(o.reviewed_at, o.uploaded_at)::date
    END
  LIMIT 1
) AS best ON true
WHERE oo.id = oo2.id
  AND oo.term_id IS NULL;

UPDATE resolution_officials ro
SET term_id = best.id
FROM resolutions r
JOIN resolution_officials ro2 ON ro2.resolution_id = r.id
LEFT JOIN LATERAL (
  SELECT t.id
  FROM sb_council_member_terms t
  WHERE t.council_member_id = ro2.official_id
  ORDER BY
    CASE
      WHEN t.term_start <= COALESCE(r.reviewed_at, r.uploaded_at)::date
       AND (t.term_end IS NULL OR t.term_end >= COALESCE(r.reviewed_at, r.uploaded_at)::date)
      THEN 0
      WHEN t.term_start <= COALESCE(r.reviewed_at, r.uploaded_at)::date THEN 1
      ELSE 2
    END,
    CASE
      WHEN t.term_start <= COALESCE(r.reviewed_at, r.uploaded_at)::date
      THEN COALESCE(r.reviewed_at, r.uploaded_at)::date - t.term_start
      ELSE t.term_start - COALESCE(r.reviewed_at, r.uploaded_at)::date
    END
  LIMIT 1
) AS best ON true
-- resolution_officials has no surrogate id column (unlike ordinance_officials
-- above) — just resolution_id + official_id — so match back on that pair.
WHERE ro.resolution_id = ro2.resolution_id
  AND ro.official_id = ro2.official_id
  AND ro.term_id IS NULL;

COMMIT;
