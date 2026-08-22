-- 001_create_councils_table.sql
--
-- Introduces `councils` as a first-class entity. Until now, a "council"
-- (the Sangguniang Bayan as it existed for a given term) only ever existed
-- as an implicit grouping of sb_council_member_terms rows that happened to
-- share the same free-text term_period string (see OfficialsPage.jsx's
-- buildCouncilGroups). That made two things possible:
--   1. A typo'd term_period (a hyphen vs an en dash, extra whitespace, ...)
--      silently created a second, bogus council with no error anywhere.
--   2. There was nowhere to hang council-level data (status, a canonical
--      label) — it had to be re-derived from scattered member rows.
--
-- This migration only adds the table and backfills it from what already
-- exists; sb_council_member_terms isn't touched here (see 002).

BEGIN;

CREATE TABLE IF NOT EXISTS councils (
  id          bigserial PRIMARY KEY,
  term_label  text NOT NULL UNIQUE,
  term_start  date,
  term_end    date,
  status      text NOT NULL DEFAULT 'concluded'
              CHECK (status IN ('upcoming', 'active', 'concluded')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Backfill: one row per distinct term_period currently in use, after
-- normalizing dash variants (en dash U+2013, em dash U+2014 -> plain
-- hyphen) and trimming whitespace, so "2022-2025" and "2022–2025" collapse
-- into the same council instead of creating a duplicate.
--
-- term_start/term_end are best-effort (MIN/MAX across whichever member
-- rows share the label) since there was never a single canonical source
-- for a council's own dates before this table existed — spot-check the
-- backfilled rows afterward and correct by hand if a date looks off.
WITH normalized AS (
  SELECT
    trim(regexp_replace(term_period, '[–—]', '-', 'g')) AS term_label,
    min(term_start) AS term_start,
    max(term_end)   AS term_end
  FROM sb_council_member_terms
  WHERE term_period IS NOT NULL AND trim(term_period) <> ''
  GROUP BY trim(regexp_replace(term_period, '[–—]', '-', 'g'))
)
INSERT INTO councils (term_label, term_start, term_end, status)
SELECT
  term_label,
  term_start,
  term_end,
  CASE
    WHEN term_end   IS NOT NULL AND term_end   < current_date THEN 'concluded'
    WHEN term_start IS NOT NULL AND term_start > current_date THEN 'upcoming'
    ELSE 'active'
  END AS status
FROM normalized
ON CONFLICT (term_label) DO NOTHING;

COMMIT;
