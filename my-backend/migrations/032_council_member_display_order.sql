-- 032_council_member_display_order.sql
--
-- Lets the Secretary/Clerk arrange the members of a council in their official
-- order (Vice Mayor, 1st Councilor, 2nd Councilor, ..., ex-officio members) by
-- dragging their cards in Councilor Management. That saved order is then used
-- everywhere members are listed: the author / co-author / sponsor / co-sponsor
-- pickers and the public website's council pages.
--
-- The order lives on sb_council_member_terms, not sb_council_members, because
-- it is per council: a re-elected member has one term row per council and can
-- hold a different rank in each.
--
-- display_order is NULL for a term that hasn't been placed yet (a member just
-- added) — every reader sorts NULLs last, so a new member shows up at the end
-- of their council until someone drags them into place.
--
-- Backfill: each existing council gets a sensible starting order — Vice Mayor,
-- then Councilors, then the Liga President, then the SK Federated President —
-- oldest term first within a position, so nothing has to be dragged on day one.

BEGIN;

ALTER TABLE sb_council_member_terms
  ADD COLUMN IF NOT EXISTS display_order integer;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(council_id::text, 'legacy:' || COALESCE(term_period, ''))
      ORDER BY
        CASE position
          WHEN 'Vice Mayor' THEN 1
          WHEN 'Councilor' THEN 2
          WHEN 'Liga ng mga Barangay President' THEN 3
          WHEN 'SK Federated President' THEN 4
          ELSE 5
        END,
        term_start,
        id
    ) AS rn
  FROM sb_council_member_terms
)
UPDATE sb_council_member_terms t
SET display_order = ranked.rn
FROM ranked
WHERE t.id = ranked.id
  AND t.display_order IS NULL;

CREATE INDEX IF NOT EXISTS idx_sb_council_member_terms_council_order
  ON sb_council_member_terms (council_id, display_order);

COMMIT;
