const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { body } = require('express-validator')

const supabase = require('../config/supabase')
const { verifyToken, adminOnly, secretaryOnly, validate } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')
const { sendEmail } = require('../helpers/email')
const { ROLE_POSITIONS, ALL_POSITIONS, isValidPositionForRole } = require('../helpers/roles')

const SALT_ROUNDS = 10

// Builds a temp password guaranteed to pass the app's own complexity rule
// (8+ chars, 1 uppercase, 1 digit) without ambiguous-looking characters
// (no 0/O or 1/l/I) since this gets read off an email and typed by hand.
const generateTempPassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits
  const pick = (chars) => chars[crypto.randomInt(chars.length)]
  const chars = [pick(upper), pick(digits), ...Array.from({ length: 8 }, () => pick(all))]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

// POST /api/users
// Admin-gated creation of a role:'user' account (councilor/vice_mayor) —
// this is what the admin dashboard's "Add User" button actually calls now.
// It used to reuse POST /api/register (auth.js), which has no auth at all
// since it's the public self-registration endpoint — meaning the "Add User"
// button's protection was purely cosmetic (any unauthenticated caller could
// hit /register directly). /register stays as-is for public self-signup;
// this route is the admin-initiated equivalent with real access control.
router.post('/', verifyToken, adminOnly, upload.single('photo'), handleMulterError, [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('username').trim().notEmpty().isAlphanumeric().withMessage('Username must be alphanumeric.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least 1 uppercase letter.')
    .matches(/\d/).withMessage('Password must contain at least 1 number.'),
  body('position').isIn(ROLE_POSITIONS.user)
    .withMessage(`Position must be one of: ${ROLE_POSITIONS.user.join(', ')}.`),
], validate, async (req, res) => {
  const { name, username, email, password, position } = req.body
  try {
    let photo = null, photo_path = null
    if (req.file) {
      const { fileName, publicUrl } = await uploadToStorage(req.file, 'users')
      photo = publicUrl
      photo_path = fileName
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const { data, error } = await supabase
      .from('users')
      .insert({ name, username, email, password: hashedPassword, role: 'user', position, photo, photo_path })
      .select().single()
    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Username or email already exists.' })
      return res.status(500).json({ error: error.message })
    }
    await logActivity(req, 'CREATE', 'Users', `Added new user: ${username}`)
    res.json({ success: true, userId: data.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/users
router.get('/', verifyToken, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('users').select('id, name, username, email, role, position, photo')
    .eq('is_archived', false)
    .order('id', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/users/check-availability?field=username|email&value=&excludeId=
// Registered before GET /:id so Express doesn't swallow this path as an :id
// param. Backs the live "already taken" hint in the Add/Edit user form —
// the DB unique index (migrations/011) is still the real enforcement at
// insert/update time; this is just a UX nicety, not a security boundary.
router.get('/check-availability', verifyToken, adminOnly, async (req, res) => {
  const { field, value, excludeId } = req.query
  if (!['username', 'email'].includes(field) || !value)
    return res.status(400).json({ error: 'field must be "username" or "email", and value is required.' })
  try {
    let query = supabase.from('users').select('id').ilike(field, value)
    if (excludeId) query = query.neq('id', excludeId)
    const { data, error } = await query.limit(1)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ available: data.length === 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/users/:id
router.get('/:id', verifyToken, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('users').select('id, name, username, email, role, position, photo').eq('id', req.params.id).single()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'User not found.' })
  res.json(data)
})

// PUT /api/users/:id
router.put('/:id', verifyToken, adminOnly, upload.single('photo'), handleMulterError, [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('username').trim().escape().notEmpty().isAlphanumeric().withMessage('Username must be alphanumeric.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required.'),
  body('role').isIn(['admin', 'user']).withMessage('Role must be admin or user.'),
  body('position').optional({ checkFalsy: true }).isIn(ALL_POSITIONS)
    .withMessage(`Position must be one of: ${ALL_POSITIONS.join(', ')}.`),
], validate, async (req, res) => {
  const { id } = req.params
  const { name, username, email, role, position } = req.body
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('users').select('id, photo_path, position').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'User not found.' })

    // position is optional on this route (an edit can leave it untouched),
    // so validate the role this update actually produces against whichever
    // position it actually ends up with — catching both a mismatched
    // position sent directly, and a role change that would leave a
    // now-stale position from before this update.
    const finalPosition = position || existing.position
    if (finalPosition && !isValidPositionForRole(role, finalPosition)) {
      return res.status(400).json({
        error: `"${finalPosition}" is not a valid position for role "${role}". Valid positions: ${ROLE_POSITIONS[role].join(', ')}.`,
      })
    }

    const updateData = { name, username, email, role }
    if (position) updateData.position = position
    if (req.file) {
      if (existing.photo_path) await deleteFromStorage(existing.photo_path)
      const { fileName, publicUrl } = await uploadToStorage(req.file, 'users')
      updateData.photo = publicUrl
      updateData.photo_path = fileName
    }

    const { error } = await supabase
      .from('users').update(updateData).eq('id', id)
    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Username or email already in use.' })
      return res.status(500).json({ error: error.message })
    }
    await logActivity(req, 'UPDATE', 'Users', `Updated user ID: ${id}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/users/:id/email
router.put('/:id/email', verifyToken, [
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required.'),
], validate, async (req, res) => {
  const { id } = req.params
  const { email } = req.body
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden.' })
  const { error } = await supabase.from('users').update({ email }).eq('id', id)
  if (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Email already in use.' })
    return res.status(500).json({ error: error.message })
  }
  await logActivity(req, 'UPDATE', 'Users', `Updated email for user ID: ${id}`)
  res.json({ success: true })
})

// PUT /api/users/:id/password
router.put('/:id/password', verifyToken, [
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least 1 uppercase letter.')
    .matches(/\d/).withMessage('Password must contain at least 1 number.'),
], validate, async (req, res) => {
  const { id } = req.params
  const { currentPassword, newPassword } = req.body
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden.' })
  try {
    // Anyone — admin or not — changing their OWN password must prove they
    // know the current one. This used to be skipped for admins changing
    // their own password (the condition below required role !== 'admin'
    // too), which meant an admin session could silently overwrite its own
    // password with no re-authentication — the same shape of gap a stolen
    // session would exploit to lock out the real owner. Only an admin
    // changing SOMEONE ELSE's password (id !== req.user.id) skips this.
    if (req.user.id === parseInt(id)) {
      if (!currentPassword)
        return res.status(400).json({ error: 'Current password is required.' })
      const { data: user } = await supabase
        .from('users').select('password').eq('id', id).single()
      const isMatch = await bcrypt.compare(currentPassword, user.password)
      if (!isMatch)
        return res.status(400).json({ error: 'Current password is incorrect.' })
    }
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)
    const { error } = await supabase
      .from('users').update({ password: hashedPassword, must_change_password: false }).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPDATE', 'Users', `Changed password for user ID: ${id}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/users/:id/reset-password
// Admin-forced password reset: generates a temp password, emails it to the
// account's address, and flags must_change_password so the next login
// requires setting a real one (see LogIn.jsx's forced-change screen and the
// clearing of this flag above). The temp password is never returned in the
// API response — only the account owner sees it, via their own inbox.
//
// The email is sent BEFORE the password is changed in the DB, not after —
// if it were the other way around and the send failed (bad API key, Brevo
// outage, etc.), the account would be left with a temp password nobody
// knows, since it only ever exists in that one email. Sending first means a
// failure here leaves the real password untouched and safely retryable.
router.post('/:id/reset-password', verifyToken, adminOnly, async (req, res) => {
  const { id } = req.params
  try {
    const { data: existing } = await supabase
      .from('users').select('id, username, name, email').eq('id', id).single()
    if (!existing) return res.status(404).json({ error: 'User not found.' })

    const tempPassword = generateTempPassword()

    try {
      await sendEmail({
        to: [{ email: existing.email, name: existing.name }],
        subject: 'Your password has been reset',
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e0e0e0;border-radius:12px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h2 style="color:#2e7d32;margin:0 0 4px;">Office of Sangguniang Bayan</h2>
              <p style="color:#888;font-size:13px;margin:0;">Municipality of Balilihan, Bohol</p>
            </div>
            <p style="color:#555;font-size:15px;">An administrator reset the password for your account (<strong>${existing.username}</strong>). Your temporary password is:</p>
            <div style="font-size:24px;font-weight:bold;letter-spacing:2px;color:#2e7d32;text-align:center;margin:16px 0;padding:16px;background:#f0faf0;border-radius:8px;">${tempPassword}</div>
            <p style="color:#888;font-size:13px;">You'll be required to set a new password the next time you log in. If you didn't expect this, contact the office immediately.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Password reset email failed:', emailErr.message)
      return res.status(502).json({ error: 'Could not send the reset email. The password was not changed — please try again.' })
    }

    const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS)
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword, must_change_password: true })
      .eq('id', id)
    if (error) return res.status(500).json({ error: error.message })

    await logActivity(req, 'RESET_PASSWORD', 'Users', `Reset password for user: ${existing.username}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/users/:id
// Archives the account instead of a hard delete: the row stays in place (so
// historical references like activity_logs.user_id still resolve) and is
// flagged is_archived, which also blocks the account from authenticating.
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  const { id } = req.params
  try {
    const { data: existing } = await supabase
      .from('users').select('id, username').eq('id', id).single()
    if (!existing) return res.status(404).json({ error: 'User not found.' })
    if (req.user.id === parseInt(id))
      return res.status(400).json({ error: 'You cannot archive your own account.' })
    const { error } = await supabase
      .from('users')
      .update({ is_archived: true, archived_at: new Date().toISOString(), archived_by: req.user.id })
      .eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'ARCHIVE', 'Users', `Archived user: ${existing.username}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/users/:id/restore
// Only reachable from the Archives page, which is secretary-gated on the
// frontend (canViewArchives) — secretaryOnly here closes the gap where any
// admin-role account could otherwise call this directly.
router.put('/:id/restore', verifyToken, adminOnly, secretaryOnly, async (req, res) => {
  const { id } = req.params
  try {
    const { data: existing } = await supabase
      .from('users').select('id, username').eq('id', id).single()
    if (!existing) return res.status(404).json({ error: 'User not found.' })
    const { error } = await supabase
      .from('users')
      .update({ is_archived: false, archived_at: null, archived_by: null })
      .eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'RESTORE', 'Users', `Restored user: ${existing.username}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
