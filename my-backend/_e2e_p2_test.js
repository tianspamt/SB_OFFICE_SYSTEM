require('dotenv').config();
const jwt = require('jsonwebtoken');
const supabase = require('./config/supabase');
const BASE = 'http://localhost:' + (process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET;

function ok(label, cond, extra) {
  console.log('[' + (cond ? 'OK' : 'FAIL') + '] ' + label + (extra ? ' — ' + extra : ''));
}

function mintToken(u) {
  return jwt.sign(
    { id: u.id, username: u.username, email: u.email, role: u.role, name: u.name, position: u.position },
    JWT_SECRET,
    { expiresIn: '10m', issuer: 'sangguniang-bayan-system', audience: 'sb-client' }
  );
}

let testUserId;

async function main() {
  const { data: secretary } = await supabase.from('users').select('*').eq('role', 'admin').eq('position', 'secretary').limit(1).single();
  const secToken = mintToken(secretary);
  const secHeaders = { Authorization: 'Bearer ' + secToken };

  // ===== Item 1 & new POST /api/users still works (regression check after modal refactor didn't touch backend, but confirms wiring) =====
  const uname = 'e2ep2test' + Date.now();
  const fd = new FormData();
  fd.append('name', 'P2 Test User');
  fd.append('username', uname);
  fd.append('email', uname + '@test.com');
  fd.append('password', 'TestPass123');
  fd.append('position', 'councilor');
  let res = await fetch(BASE + '/api/users', { method: 'POST', headers: secHeaders, body: fd });
  let body = await res.json();
  testUserId = body.userId;
  ok('Setup: create disposable test user', res.ok && body.success, JSON.stringify(body));

  // ===== Item 2: check-availability endpoint =====
  res = await fetch(BASE + `/api/users/check-availability?field=username&value=${uname}`, { headers: secHeaders });
  body = await res.json();
  ok('Availability check: existing username reported taken', res.ok && body.available === false, JSON.stringify(body));

  res = await fetch(BASE + `/api/users/check-availability?field=username&value=${uname}&excludeId=${testUserId}`, { headers: secHeaders });
  body = await res.json();
  ok('Availability check: excludeId lets a user "take" their own username', res.ok && body.available === true, JSON.stringify(body));

  const freshUname = 'e2efresh' + Date.now();
  res = await fetch(BASE + `/api/users/check-availability?field=username&value=${freshUname}`, { headers: secHeaders });
  body = await res.json();
  ok('Availability check: brand-new username reported available', res.ok && body.available === true, JSON.stringify(body));

  res = await fetch(BASE + '/api/users/check-availability', { headers: { Authorization: 'Bearer ' + secToken } });
  ok('Availability check: missing params rejected with 400', res.status === 400, 'status=' + res.status);

  // ===== Item 3: reset-password flow end-to-end =====
  res = await fetch(BASE + `/api/users/${testUserId}/reset-password`, { method: 'POST', headers: secHeaders });
  body = await res.json();
  ok('Reset-password: admin can trigger a reset', res.ok && body.success, JSON.stringify(body));

  const { data: afterReset } = await supabase.from('users').select('must_change_password, password').eq('id', testUserId).single();
  ok('Reset-password: must_change_password flag set true', afterReset.must_change_password === true);

  // Confirm login now reports mustChangePassword: true (can't know the temp
  // password since it only goes out by email, so verify via a minted token
  // + a direct DB read instead of a real login roundtrip).
  const testUserRow = { id: testUserId, username: uname, email: uname + '@test.com', role: 'user', name: 'P2 Test User', position: 'councilor' };
  const testToken = mintToken(testUserRow);

  // Simulate "logging in" by checking the login route's response shape via a
  // fresh bcrypt-known password instead: set a known password directly so
  // we can call /api/login for real and see mustChangePassword in the body.
  const bcrypt = require('bcrypt');
  const knownHash = await bcrypt.hash('KnownPass123', 10);
  await supabase.from('users').update({ password: knownHash }).eq('id', testUserId); // must_change_password stays true — only PUT /password clears it
  res = await fetch(BASE + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: uname, password: 'KnownPass123' }) });
  body = await res.json();
  ok('Login response includes mustChangePassword: true after a reset', body.success && body.user.mustChangePassword === true, JSON.stringify(body.user));

  // Now change the password via PUT /:id/password (as the forced-change
  // screen would) and confirm the flag clears.
  res = await fetch(BASE + `/api/users/${testUserId}/password`, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + body.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: 'KnownPass123', newPassword: 'BrandNewPass123' }),
  });
  const changeBody = await res.json();
  ok('Forced change: PUT /:id/password succeeds with correct temp/current password', res.ok && changeBody.success, JSON.stringify(changeBody));

  const { data: afterChange } = await supabase.from('users').select('must_change_password').eq('id', testUserId).single();
  ok('Forced change: must_change_password cleared to false', afterChange.must_change_password === false);

  res = await fetch(BASE + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: uname, password: 'BrandNewPass123' }) });
  body = await res.json();
  ok('Login with the new password now reports mustChangePassword: false', body.success && body.user.mustChangePassword === false, JSON.stringify(body.user));

  console.log('\nDone.');
}

main()
  .catch(function (err) { console.error('TEST CRASHED:', err); })
  .finally(async function () {
    if (testUserId) await supabase.from('users').delete().eq('id', testUserId);
    console.log('Cleanup done: disposable test account removed.');
  });
