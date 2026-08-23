// Shared plumbing for the e2e test scripts in this folder. These hit a real,
// already-running server (see BASE) and a real Supabase project — same
// black-box style as the pre-existing _e2e_p2_test.js at the repo root, just
// organized into one file per concern instead of one growing script. Tokens
// are minted directly rather than logged in via /api/login, since the tests
// only need to exercise what happens *after* auth, not the login flow itself.
require('dotenv').config()
const jwt = require('jsonwebtoken')
const supabase = require('../config/supabase')

const BASE = `http://localhost:${process.env.PORT || 5000}`
const JWT_SECRET = process.env.JWT_SECRET

let pass = 0
let fail = 0

// Logs a pass/fail line and tracks a running tally — call summary() at the
// end of each test file so a failure anywhere sets a non-zero exit code
// (what `npm test` / CI actually look at, the console output is for humans).
function ok(label, cond, extra) {
  const status = cond ? 'OK' : 'FAIL'
  console.log(`[${status}] ${label}${extra !== undefined ? ' — ' + extra : ''}`)
  if (cond) pass++
  else { fail++; process.exitCode = 1 }
}

function skip(reason) {
  console.log(`[SKIP] ${reason}`)
}

function summary(suiteName) {
  console.log(`\n${suiteName}: ${pass} passed, ${fail} failed.\n`)
}

function mintToken(user, opts = {}) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name, position: user.position },
    JWT_SECRET,
    { expiresIn: opts.expiresIn || '10m', issuer: 'sangguniang-bayan-system', audience: 'sb-client', ...opts.signOverrides }
  )
}

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` })

// Looks up a real seeded account matching `where` (e.g. { role: 'admin',
// position: 'secretary' }) instead of creating one — these tests only ever
// create/delete disposable *content* rows (ordinances etc.), never user
// accounts, so there's nothing account-related to clean up afterward.
async function findUser(where) {
  let q = supabase.from('users').select('*')
  for (const [k, v] of Object.entries(where)) q = q.eq(k, v)
  const { data } = await q.limit(1)
  return data?.[0] || null
}

async function putJson(url, headers, body) {
  return fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  })
}

// Uploads a disposable ordinance/resolution — multer only checks the
// declared mimetype on the multipart part (see middleware/multer.js's
// fileFilter), not the actual bytes, so a tiny fake PDF is enough to pass
// validation without needing a real document.
function fakeFile(name = 'test.pdf') {
  return new Blob(['%PDF-1.4 e2e test fixture'], { type: 'application/pdf' })
}

async function uploadOrdinance(headers, title, extra = {}) {
  const fd = new FormData()
  fd.append('title', title)
  fd.append('year', String(extra.year || new Date().getFullYear()))
  fd.append('file', fakeFile(), 'test.pdf')
  return fetch(`${BASE}/api/ordinances/upload`, { method: 'POST', headers, body: fd })
}

async function uploadResolution(headers, title, extra = {}) {
  const fd = new FormData()
  fd.append('title', title)
  fd.append('year', String(extra.year || new Date().getFullYear()))
  fd.append('file', fakeFile(), 'test.pdf')
  return fetch(`${BASE}/api/resolutions/upload`, { method: 'POST', headers, body: fd })
}

async function replaceOrdinanceFile(headers, id) {
  const fd = new FormData()
  fd.append('file', fakeFile(), 'revised.pdf')
  return fetch(`${BASE}/api/ordinances/${id}/replace-file`, { method: 'PUT', headers, body: fd })
}

// Finds an archived row by title (get_archives flattens the jsonb snapshot's
// title onto the row) and permanently deletes it — used to fully purge
// disposable test records instead of leaving them soft-archived forever
// (see archives.js's no-auto-purge retention policy: nothing else will ever
// clean these up).
async function purgeArchivedByTitle(headers, module, title) {
  const res = await fetch(`${BASE}/api/archives?module=${module}&search=${encodeURIComponent(title)}`, { headers })
  if (!res.ok) return false
  const body = await res.json()
  const row = (body.rows || []).find((r) => r.title === title)
  if (!row) return false
  const delRes = await fetch(`${BASE}/api/archives/${row.id}`, { method: 'DELETE', headers })
  return delRes.ok
}

module.exports = {
  BASE, JWT_SECRET, jwt, supabase,
  ok, skip, summary,
  mintToken, authHeaders, findUser,
  putJson, uploadOrdinance, uploadResolution, replaceOrdinanceFile, purgeArchivedByTitle,
}
