// Covers the ordinance review state machine (routes/ordinances.js) under the
// RBAC split: all four positions can create a draft (Secretary and Vice-
// Mayor sometimes draft directly rather than only reviewing/approving), but
// only Clerk/Councilor may edit one afterward — Secretary alone
// approves/rejects and does the final publish, and Vice-Mayor's only other
// action is approving a ready_to_publish item. Once published, only
// Secretary/Clerk may still edit — Councilor becomes read-only.
//   pending -> ready_to_publish -> approved -> published        (accept path)
//   pending -> needs_revision -> pending                        (revision path,
//     driven by Clerk/Councilor editing in place — replacing the file on a
//     needs_revision record auto-flips it back to pending, no separate
//     "resubmit" call)
// Resolutions and session-minutes run the identical code shape — this file
// exercises ordinances as the representative case rather than tripling the
// same assertions three ways.
//
// Creates four disposable ordinances and purges all of them (archived +
// permanently deleted) in `finally`, regardless of where the test stopped.
const {
  BASE, ok, skip, summary, mintToken, authHeaders, findUser,
  putJson, uploadOrdinance, replaceOrdinanceFile, purgeArchivedByTitle,
} = require('./_helpers')

async function main() {
  const secretary = await findUser({ role: 'admin', position: 'secretary' })
  const clerk = await findUser({ position: 'clerk' })
  const viceMayor = await findUser({ position: 'vice_mayor' })
  const councilor = await findUser({ position: 'councilor' })

  if (!secretary || !clerk || !viceMayor || !councilor) {
    skip('legislative-review.test.js needs seeded secretary, clerk, vice_mayor, and councilor accounts — one or more missing.')
    return
  }

  const secHeaders = authHeaders(mintToken(secretary))
  const clerkHeaders = authHeaders(mintToken(clerk))
  const vmHeaders = authHeaders(mintToken(viceMayor))
  const councilorHeaders = authHeaders(mintToken(councilor))

  const titleAccept = `E2E accept-path ${Date.now()}`
  const titleRevise = `E2E revision-path ${Date.now()}`
  const titleDirect = `E2E secretary-direct-create ${Date.now()}`
  const titleVmDirect = `E2E vm-direct-create ${Date.now()}`
  let idAccept = null
  let idRevise = null
  let idDirect = null
  let idVmDirect = null

  try {
    // ── Accept path: pending -> ready_to_publish -> approved -> published ──────
    let res = await uploadOrdinance(clerkHeaders, titleAccept)
    let body = await res.json()
    idAccept = body.id
    ok('Clerk upload starts an ordinance in "pending"', res.ok && body.data?.status === 'pending', JSON.stringify(body.data))

    // Secretary can also create directly — they sometimes draft the
    // ordinance themselves rather than only reviewing Clerk/Councilor's work.
    res = await uploadOrdinance(secHeaders, titleDirect)
    body = await res.json()
    idDirect = body.id
    ok('Secretary upload also starts an ordinance in "pending"', res.ok && body.data?.status === 'pending', JSON.stringify(body.data))

    // Vice-Mayor can also create directly — same reasoning as Secretary above.
    res = await uploadOrdinance(vmHeaders, titleVmDirect)
    body = await res.json()
    idVmDirect = body.id
    ok('Vice-Mayor upload also starts an ordinance in "pending"', res.ok && body.data?.status === 'pending', JSON.stringify(body.data))

    // Creating one doesn't grant edit rights — Vice-Mayor's only other
    // action stays approving a ready_to_publish item.
    if (idVmDirect) {
      res = await replaceOrdinanceFile(vmHeaders, idVmDirect)
      ok('Vice-Mayor cannot replace the file on their own draft (403)', res.status === 403, `status=${res.status}`)
    }

    if (idAccept) {
      res = await putJson(`${BASE}/api/ordinances/${idAccept}/accept`, secHeaders)
      body = await res.json()
      ok('Secretary accept: pending -> ready_to_publish', res.ok && body.data?.status === 'ready_to_publish', JSON.stringify(body))

      res = await putJson(`${BASE}/api/ordinances/${idAccept}/accept`, secHeaders)
      ok('Secretary accept: rejected once no longer pending (400)', res.status === 400, `status=${res.status}`)

      res = await putJson(`${BASE}/api/ordinances/${idAccept}/vm-approve`, clerkHeaders)
      ok('Clerk cannot vm-approve — wrong position (403)', res.status === 403, `status=${res.status}`)

      res = await putJson(`${BASE}/api/ordinances/${idAccept}/vm-approve`, vmHeaders)
      body = await res.json()
      ok('Vice-Mayor vm-approve: ready_to_publish -> approved', res.ok && body.data?.status === 'approved', JSON.stringify(body))

      res = await putJson(`${BASE}/api/ordinances/${idAccept}/publish`, clerkHeaders)
      ok('Clerk cannot publish — wrong position (403)', res.status === 403, `status=${res.status}`)

      res = await putJson(`${BASE}/api/ordinances/${idAccept}/publish`, secHeaders)
      body = await res.json()
      ok('Secretary publish: approved -> published', res.ok && body.data?.status === 'published', JSON.stringify(body))

      res = await fetch(`${BASE}/api/ordinances`, { headers: secHeaders })
      body = await res.json()
      ok('Published ordinance appears in the default (published-only) listing', Array.isArray(body) && body.some((o) => o.id === idAccept))

      // ── Bucket-aware edit rights once published ───────────────────────────
      res = await replaceOrdinanceFile(councilorHeaders, idAccept)
      ok('Councilor cannot replace the file on a published ordinance (403)', res.status === 403, `status=${res.status}`)

      res = await putJson(`${BASE}/api/ordinances/${idAccept}`, councilorHeaders, { title: 'Should not be allowed' })
      ok('Councilor cannot PUT-edit a published ordinance (403)', res.status === 403, `status=${res.status}`)

      res = await putJson(`${BASE}/api/ordinances/${idAccept}`, secHeaders, { title: titleAccept, ordinance_number: null, year: new Date().getFullYear() })
      body = await res.json()
      ok('Secretary can still edit a published ordinance', res.ok && body.success, JSON.stringify(body))
    }

    // ── Revision path: pending -> needs_revision -> pending ────────────────────
    res = await uploadOrdinance(councilorHeaders, titleRevise)
    body = await res.json()
    idRevise = body.id
    ok('Councilor upload starts an ordinance in "pending"', res.ok && body.data?.status === 'pending', JSON.stringify(body.data))

    if (idRevise) {
      res = await putJson(`${BASE}/api/ordinances/${idRevise}/request-changes`, secHeaders, {})
      ok('Secretary request-changes: rejected without a comment (400)', res.status === 400, `status=${res.status}`)

      const comment = 'Please correct the ordinance number before resubmitting.'
      res = await putJson(`${BASE}/api/ordinances/${idRevise}/request-changes`, secHeaders, { comment })
      body = await res.json()
      ok('Secretary request-changes: pending -> needs_revision', res.ok && body.data?.status === 'needs_revision', JSON.stringify(body))

      // Replacing the file doubles as the resubmit — no separate call needed.
      res = await replaceOrdinanceFile(councilorHeaders, idRevise)
      body = await res.json()
      ok('Councilor replace-file on a rejected draft auto-flips needs_revision -> pending', res.ok && body.data?.status === 'pending', JSON.stringify(body))

      res = await fetch(`${BASE}/api/comments?entity_type=ordinance&entity_id=${idRevise}`, { headers: secHeaders })
      body = await res.json()
      ok('The request-changes comment was recorded', Array.isArray(body) && body.some((c) => c.text === comment))

      res = await fetch(`${BASE}/api/ordinances/${idRevise}`, { method: 'DELETE', headers: councilorHeaders })
      body = await res.json()
      ok('Councilor can archive their own pending draft', res.ok && body.success, JSON.stringify(body))
    }
  } finally {
    // idAccept ends up published (Secretary/Clerk may archive it); idRevise
    // is already archived by the test itself (the DELETE below just 404s
    // harmlessly); idDirect/idVmDirect are still sitting in "pending" when
    // we get here, which only Clerk/Councilor may archive — see
    // canManageLegislativeRecord.
    for (const [id, title, headers] of [
      [idAccept, titleAccept, secHeaders],
      [idRevise, titleRevise, secHeaders],
      [idDirect, titleDirect, clerkHeaders],
      [idVmDirect, titleVmDirect, clerkHeaders],
    ]) {
      if (!id) continue
      await fetch(`${BASE}/api/ordinances/${id}`, { method: 'DELETE', headers })
      await purgeArchivedByTitle(secHeaders, 'ordinance', title)
    }
    console.log('Cleanup done: disposable ordinances permanently purged.')
  }

  summary('legislative-review.test.js')
}

main().catch((err) => {
  console.error('TEST CRASHED:', err)
  process.exitCode = 1
})
