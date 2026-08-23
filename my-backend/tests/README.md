# Backend tests

Black-box e2e scripts, not a mocked unit-test suite: each file starts from
`tests/_helpers.js`, mints JWTs directly (skipping the login roundtrip), and
drives the real, already-running API against the real Supabase project in
`.env`. This matches the style of the pre-existing root-level
`_e2e_p2_test.js` — same idea, just organized per concern instead of as one
growing script.

## Running

1. Start the API: `node index.js` (or your usual dev command) — leave it running.
2. In another terminal: `npm test`

Each file is also runnable on its own, e.g. `node tests/auth.test.js`.

## What's covered so far

- `auth.test.js` — `verifyToken` (missing/malformed/expired/wrong-audience
  tokens, archived accounts) and the role/position gates (`adminOnly`,
  `secretaryOnly`, `viceMayorOnly`, `pendingEditors` — Secretary, Clerk, and
  Councilor may all create a draft; Vice-Mayor may not).
- `archive-restore.test.js` — archive → restore → permanent-delete for a
  legislative record, including that the row actually moves between the
  live and `archives` tables.
- `legislative-review.test.js` — the ordinance review state machine (accept
  path to `published`, and the `needs_revision` → pending revision path,
  where a Clerk/Councilor edit does the resubmit implicitly — there's no
  separate resubmit call anymore), wrong-status and wrong-reviewer-position
  rejections, that Secretary can create a draft directly (not just review
  one), and the bucket-aware edit rule (`canManageLegislativeRecord`):
  Clerk/Councilor own a record until it's published, Secretary/Clerk own it
  after. Resolutions and session-minutes share the identical code shape, so
  this isn't repeated three ways.

This is a first pass, not full coverage — CRUD validation, the announcements/
content-posts modules, and file-upload edge cases (bad mimetypes, the new
`multer` size limit) aren't exercised yet.

## Requirements & side effects

- Needs a seeded admin/secretary account, a clerk, a vice-mayor, a councilor,
  a plain non-admin user, and (for one check) an archived account. Tests
  read these from the DB by role/position rather than assuming fixed IDs; a
  file skips (not fails) the checks that need an account it can't find.
- Tests create disposable ordinances (title-prefixed `E2E ...`) and always
  purge them — archived and permanently deleted — in a `finally` block, even
  if an earlier assertion in the same file failed. They never create or
  modify user accounts.
- Real network calls: this hits your actual Supabase project, including
  Storage uploads for the disposable ordinances. Don't point `.env` at
  production data while running these.
