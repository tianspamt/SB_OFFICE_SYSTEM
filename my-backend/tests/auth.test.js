// Covers middleware/auth.js: verifyToken (missing/malformed/expired/wrong-
// audience tokens, archived accounts) and the role/position gates
// (adminOnly, secretaryOnly, viceMayorOnly, canCreateDraft, pendingEditors).
// Requires the server to be running locally (see tests/README.md) and a
// handful of already-seeded accounts — it only reads users, never creates
// or mutates any.
const { BASE, jwt, JWT_SECRET, ok, skip, summary, mintToken, authHeaders, findUser } = require('./_helpers')

async function main() {
  const secretary = await findUser({ role: 'admin', position: 'secretary' })
  const councilor = await findUser({ position: 'councilor', is_archived: false })
  const viceMayor = await findUser({ position: 'vice_mayor' })
  const archived = await findUser({ is_archived: true })

  if (!secretary || !councilor || !viceMayor) {
    skip('auth.test.js needs seeded secretary, councilor, and vice_mayor accounts — one or more missing.')
    return
  }

  // ── verifyToken ──────────────────────────────────────────────────────────────
  let res = await fetch(`${BASE}/api/ordinances`)
  ok('verifyToken: no Authorization header is rejected (401)', res.status === 401, `status=${res.status}`)

  res = await fetch(`${BASE}/api/ordinances`, { headers: authHeaders('not-a-real-token') })
  ok('verifyToken: malformed token is rejected (401)', res.status === 401, `status=${res.status}`)

  const expired = jwt.sign({ id: secretary.id }, JWT_SECRET, {
    expiresIn: '-10s', issuer: 'sangguniang-bayan-system', audience: 'sb-client',
  })
  res = await fetch(`${BASE}/api/ordinances`, { headers: authHeaders(expired) })
  ok('verifyToken: expired token is rejected (401)', res.status === 401, `status=${res.status}`)

  const wrongAudience = jwt.sign({ id: secretary.id }, JWT_SECRET, {
    expiresIn: '10m', issuer: 'sangguniang-bayan-system', audience: 'someone-else',
  })
  res = await fetch(`${BASE}/api/ordinances`, { headers: authHeaders(wrongAudience) })
  ok('verifyToken: token signed for a different audience is rejected (401)', res.status === 401, `status=${res.status}`)

  if (archived) {
    res = await fetch(`${BASE}/api/ordinances`, { headers: authHeaders(mintToken(archived)) })
    ok('verifyToken: a valid token for an archived account is rejected (401)', res.status === 401, `status=${res.status}`)
  } else {
    skip('No archived account seeded — cannot exercise verifyToken\'s archived-account check.')
  }

  res = await fetch(`${BASE}/api/ordinances`, { headers: authHeaders(mintToken(secretary)) })
  ok('verifyToken: a valid, current token is accepted (200)', res.status === 200, `status=${res.status}`)

  // ── Role/position gates ──────────────────────────────────────────────────────
  const councilorHeaders = authHeaders(mintToken(councilor))
  const secretaryHeaders = authHeaders(mintToken(secretary))
  const viceMayorHeaders = authHeaders(mintToken(viceMayor))

  // canCreateDraft gates creating a draft — all four legislative positions
  // may originate one (Secretary and Vice-Mayor sometimes draft directly
  // rather than only reviewing/approving what Clerk/Councilor submit). Each
  // should pass the position gate and hit the next check down (missing file
  // -> 400) rather than being rejected for role/position.
  res = await fetch(`${BASE}/api/ordinances/upload`, { method: 'POST', headers: secretaryHeaders })
  ok('canCreateDraft: Secretary passes the create gate (400 for missing file, not 403)', res.status === 400, `status=${res.status}`)

  res = await fetch(`${BASE}/api/ordinances/upload`, { method: 'POST', headers: councilorHeaders })
  ok('canCreateDraft: Councilor passes the create gate (400 for missing file, not 403)', res.status === 400, `status=${res.status}`)

  res = await fetch(`${BASE}/api/ordinances/upload`, { method: 'POST', headers: viceMayorHeaders })
  ok('canCreateDraft: Vice-Mayor passes the create gate (400 for missing file, not 403)', res.status === 400, `status=${res.status}`)

  res = await fetch(`${BASE}/api/ordinances/999999999/vm-approve`, { method: 'PUT', headers: secretaryHeaders })
  ok('viceMayorOnly: secretary (wrong position) is rejected (403)', res.status === 403, `status=${res.status}`)

  res = await fetch(`${BASE}/api/ordinances/999999999/replace-file`, { method: 'PUT', headers: viceMayorHeaders })
  ok('pendingEditors: vice-mayor is rejected (403)', res.status === 403, `status=${res.status}`)

  res = await fetch(`${BASE}/api/ordinances/999999999/accept`, { method: 'PUT', headers: councilorHeaders })
  ok('secretaryOnly: a plain councilor is rejected (403)', res.status === 403, `status=${res.status}`)

  summary('auth.test.js')
}

main().catch((err) => {
  console.error('TEST CRASHED:', err)
  process.exitCode = 1
})
