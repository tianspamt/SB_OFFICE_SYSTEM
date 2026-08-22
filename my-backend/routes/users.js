const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const { body } = require('express-validator')

const supabase = require('../config/supabase')
const { verifyToken, adminOnly, secretaryOnly, validate } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')

const SALT_ROUNDS = 10

// GET /api/users
router.get('/', verifyToken, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('users').select('id, name, username, email, role, position, photo')
    .eq('is_archived', false)
    .order('id', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
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
  body('name').trim().escape().notEmpty().withMessage('Name is required.'),
  body('username').trim().escape().notEmpty().isAlphanumeric().withMessage('Username must be alphanumeric.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required.'),
  body('role').isIn(['admin', 'user']).withMessage('Role must be admin or user.'),
], validate, async (req, res) => {
  const { id } = req.params
  const { name, username, email, role, position } = req.body
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('users').select('id, photo_path').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'User not found.' })

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
    if (req.user.id === parseInt(id) && req.user.role !== 'admin') {
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
      .from('users').update({ password: hashedPassword }).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPDATE', 'Users', `Changed password for user ID: ${id}`)
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
