# Database migrations

Plain, numbered SQL files — no migration framework, no magic. This project's
schema previously lived only in the Supabase dashboard with nothing in git,
so past changes aren't reviewable or reproducible. This folder fixes that
going forward.

## Convention

- `NNN_short_description.sql`, zero-padded, one more than the highest number
  currently in the folder (`001_...`, `002_...`, ...).
- Each file is idempotent where practical (`IF NOT EXISTS`, `ON CONFLICT DO
  NOTHING`) so re-running an already-applied file is a safe no-op rather than
  an error.
- Each file wraps its DDL + backfill in a single `BEGIN`/`COMMIT` transaction,
  so a failure partway through leaves the schema untouched rather than
  half-migrated.
- Files are never edited after being applied to any real environment — a
  correction ships as a new numbered file, the same rule every real migration
  tool enforces.

## Applying a migration

There's no CLI wired up yet — for now, open the file, paste its contents into
the Supabase project's SQL Editor, and run it. Read the comments at the top
of each file first; several of these encode a real business rule, not just a
column add, and are worth understanding before running against a database
with real data in it.

## Applied so far

| # | File | Summary |
|---|------|---------|
| 001 | `001_create_councils_table.sql` | Adds `councils` as a first-class entity; backfills one row per distinct (normalized) `term_period` already in use. |
| 002 | `002_add_council_id_and_position_to_terms.sql` | Adds `council_id` (FK) and `position` to `sb_council_member_terms`; backfills both from existing data. |
| 003 | `003_relax_sb_council_members_position_not_null.sql` | Drops the (now-obsolete) NOT NULL constraint on `sb_council_members.position`, since the app no longer writes it on new member rows. |
| 004 | `004_add_term_id_to_ordinance_and_resolution_officials.sql` | Adds `term_id` (FK to `sb_council_member_terms`) to `ordinance_officials`/`resolution_officials`; backfills using `COALESCE(reviewed_at, uploaded_at)` as the point-in-time to find each official's best-guess membership. |
| 005 | `005_unique_active_singular_position_per_council.sql` | Partial unique index: at most one active Vice Mayor / Liga President / SK Federated President per council. Will fail if existing data already conflicts — see the diagnostic query in the file. |
| 006 | `006_drop_sb_council_members_position.sql` | Drops the now-unused legacy `position` column from `sb_council_members` — every read was moved to compute position from the member's terms instead. |
| 007 | `007_archives_table_and_atomic_restore.sql` | Codifies the `archives` table (previously undocumented, created ad hoc in the dashboard) and adds `archive_ordinance`/`archive_resolution`/`archive_session_minutes`/`restore_archive` Postgres functions so the archive/restore sequences run as a single transaction instead of several sequential Supabase JS calls. |
| 008 | `008_archives_pagination_search_rpc.sql` | Adds `get_archives()`, a Postgres function that unions/filters/paginates the three archive sources (content snapshots, archived users, archived officials) in one query, so `GET /api/archives` can support search + LIMIT/OFFSET without loading the whole archive set into memory. |
| 009 | `009_archives_sort_direction.sql` | Adds a `p_sort` ('asc'/'desc') parameter to `get_archives()` so the Archives page's "Archived" column header can toggle sort order server-side (sorting only the current page client-side would be misleading under pagination). **Left a stale overload behind — see 010.** |
| 010 | `010_fix_get_archives_overload.sql` | Fixes 009: `CREATE OR REPLACE FUNCTION` can't change a function's argument count, so 009 created a second overloaded `get_archives` instead of replacing the first, and PostgREST couldn't disambiguate calls (breaking the endpoint entirely, not just sorting). Drops the stale 4-parameter overload. |
| 011 | `011_case_insensitive_username_email_uniqueness.sql` | Adds case-insensitive unique indexes on `users.username`/`users.email` (on top of the existing case-sensitive constraint) so e.g. "JDoe" and "jdoe" can't both exist. Verified no case-variant duplicates existed before writing this. |
| 012 | `012_add_must_change_password.sql` | Adds `users.must_change_password` (default false), backing the admin-initiated "reset this user's password" flow — set true when an admin forces a temp password, cleared automatically on the user's next successful password change. |
| 015 | `015_add_notifications.sql` | Adds `users.email_notifications` (default true), `created_by` (FK) on `ordinances`/`resolutions`/`session_minutes`, and the `notifications` table backing the two-channel (email + in-app) notification workflow — see `helpers/notify.js`. |
| 016 | `016_add_calendar_reminder_sent.sql` | Adds `calendar_events.reminder_sent` (default false), so the daily 8am reminder job (`helpers/reminderJob.js`) doesn't re-notify the same event twice. |
| 017 | `017_drop_notifications_table.sql` | Drops the `notifications` table added in 015 — the workflow moved to email-only, so there's no in-app bell/list backing it anymore. `users.email_notifications` and `calendar_events.reminder_sent` stay. |

Also required once, outside the numbered files (a raw `CREATE TABLE` in the
SQL Editor doesn't inherit the grants Supabase's Table Editor UI applies
automatically): after running 001, if querying `councils` comes back with
`permission denied for table councils` even via the service-role key, run:
```sql
GRANT ALL ON councils TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE councils_id_seq TO postgres, anon, authenticated, service_role;
```
