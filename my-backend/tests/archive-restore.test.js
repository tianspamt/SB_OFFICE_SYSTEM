// Covers the archive/restore/permanently-delete cycle for a legislative
// record (routes/ordinances.js DELETE /:id + routes/archives.js), including
// that archive_ordinance()/restore_archive() (migrations/007) actually move
// the row between the live and archives tables rather than just flipping a
// flag. Creates one disposable ordinance and always purges it (soft-archived
// or not) in the `finally` block, regardless of where the test failed.
//
// Uses two accounts on purpose: Clerk creates and archives the record (it
// stays in the pending bucket throughout, which only Clerk/Councilor may
// archive — see helpers/utils.js's canManageLegislativeRecord), while
// Secretary drives the Archives-module endpoints (list/restore/permanent
// delete), which stay Secretary-only regardless of bucket.
const { BASE, ok, skip, summary, mintToken, authHeaders, findUser, uploadOrdinance, purgeArchivedByTitle } = require('./_helpers')

async function main() {
  const secretary = await findUser({ role: 'admin', position: 'secretary' })
  const clerk = await findUser({ position: 'clerk' })
  if (!secretary || !clerk) {
    skip('archive-restore.test.js needs seeded secretary and clerk accounts — one or more missing.')
    return
  }
  const secHeaders = authHeaders(mintToken(secretary))
  const clerkHeaders = authHeaders(mintToken(clerk))
  const title = `E2E archive-restore ${Date.now()}`
  let ordinanceId = null

  try {
    let res = await uploadOrdinance(clerkHeaders, title)
    let body = await res.json()
    ordinanceId = body.id
    ok('Setup: disposable ordinance created', res.ok && body.success, JSON.stringify(body))
    if (!ordinanceId) return

    res = await fetch(`${BASE}/api/ordinances/${ordinanceId}`, { method: 'DELETE', headers: clerkHeaders })
    body = await res.json()
    ok('DELETE /:id archives the ordinance (soft delete)', res.ok && body.success, JSON.stringify(body))

    res = await fetch(`${BASE}/api/ordinances/${ordinanceId}`, { headers: secHeaders })
    ok('Archived ordinance no longer resolves from the live table (404)', res.status === 404, `status=${res.status}`)

    res = await fetch(`${BASE}/api/archives?module=ordinance&search=${encodeURIComponent(title)}`, { headers: secHeaders })
    body = await res.json()
    let archiveRow = (body.rows || []).find((r) => r.title === title)
    ok('Archived ordinance shows up in GET /api/archives', !!archiveRow, JSON.stringify(body.rows?.map((r) => r.title)))
    if (!archiveRow) return

    res = await fetch(`${BASE}/api/archives/${archiveRow.id}/restore`, { method: 'PUT', headers: secHeaders })
    body = await res.json()
    ok('PUT /api/archives/:id/restore succeeds', res.ok && body.success, JSON.stringify(body))

    res = await fetch(`${BASE}/api/ordinances/${ordinanceId}`, { headers: secHeaders })
    ok('Restored ordinance resolves from the live table again, under its original id', res.status === 200, `status=${res.status}`)

    res = await fetch(`${BASE}/api/archives?module=ordinance&search=${encodeURIComponent(title)}`, { headers: secHeaders })
    body = await res.json()
    const stillArchived = (body.rows || []).some((r) => r.title === title)
    ok('Restored ordinance no longer appears in the archives list', !stillArchived)
  } finally {
    if (ordinanceId) {
      // Archive it again (idempotent: 404s harmlessly if it's already
      // archived from a failed restore step above) then purge for real.
      // Still in the pending bucket, so Clerk (not Secretary) archives it.
      await fetch(`${BASE}/api/ordinances/${ordinanceId}`, { method: 'DELETE', headers: clerkHeaders })
      const purged = await purgeArchivedByTitle(secHeaders, 'ordinance', title)
      console.log(purged ? 'Cleanup done: disposable ordinance permanently purged.' : 'Cleanup: nothing left to purge.')
    }
  }

  summary('archive-restore.test.js')
}

main().catch((err) => {
  console.error('TEST CRASHED:', err)
  process.exitCode = 1
})
