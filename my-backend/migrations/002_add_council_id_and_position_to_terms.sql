-- 002_add_council_id_and_position_to_terms.sql
--
-- Term-scopes what used to be a person-level, no-history attribute.
-- sb_council_members.position previously applied to a person forever, so a
-- councilor who later became Vice Mayor would look like they'd always held
-- that seat — there was no way to represent "this person's role changed
-- between terms". This adds `position` to the term row itself, and
-- `council_id` as a real foreign key to councils (001) instead of the
-- implicit term_period string match.
--
-- sb_council_members.position is intentionally left in place for now —
-- dropping it is a later cleanup step, once the app is confirmed to read
-- and write the new per-term column everywhere instead.
--
-- Requires 001_create_councils_table.sql to have already run.

BEGIN;

ALTER TABLE sb_council_member_terms
  ADD COLUMN IF NOT EXISTS council_id bigint REFERENCES councils(id),
  ADD COLUMN IF NOT EXISTS position    text;

-- Backfill council_id: match this term's (normalized) term_period against
-- the council created for it in 001. Same normalization as 001 so a
-- previously-deduped typo variant still resolves to the right council.
UPDATE sb_council_member_terms t
SET council_id = c.id
FROM councils c
WHERE t.council_id IS NULL
  AND trim(regexp_replace(t.term_period, '[–—]', '-', 'g')) = c.term_label;

-- Backfill position: copy the member's current (only, pre-migration)
-- position onto every term row they have. This is necessarily "whatever
-- their position is today" — if a member's actual seat changed between
-- terms, that history was never captured under the old schema and can't be
-- recovered by this backfill; correct those specific rows by hand if you
-- know the real history.
UPDATE sb_council_member_terms t
SET position = m.position
FROM sb_council_members m
WHERE t.council_member_id = m.id
  AND t.position IS NULL;

COMMIT;

-- Not done here, deliberately: council_id/position are left nullable, and
-- sb_council_members.position is left in place. Both are safe to tighten
-- (NOT NULL / column drop) only after the app is confirmed to populate the
-- new columns on every write path — see the councilor-management punch
-- list for that follow-up work.
