const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const { body } = require('express-validator')

const supabase = require('../config/supabase')
const { verifyToken, adminOnly, validate } = require('../middleware/auth')
const { logActivity } = require('../helpers/logger')

const SALT_ROUNDS = 10

// GET /api/users
router.get('/', verifyToken, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('users').select('id, name, username, email, role')
    .order('id', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/users/:id
router.get('/:id', verifyToken, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('users').select('id, name, username, email, role').eq('id', req.params.id).single()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'User not found.' })
  res.json(data)
})

// PUT /api/users/:id
router.put('/:id', verifyToken, adminOnly, [
  body('name').trim().escape().notEmpty().withMessage('Name is required.'),
  body('username').trim().escape().notEmpty().isAlphanumeric().withMessage('Username must be alphanumeric.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required.'),
  body('role').isIn(['admin', 'user']).withMessage('Role must be admin or user.'),
], validate, async (req, res) => {
  const { id } = req.params
  const { name, username, email, role } = req.body
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('users').select('id').eq('id', id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'User not found.' })
    const { error } = await supabase
      .from('users').update({ name, username, email, role }).eq('id', id)
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
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  const { id } = req.params
  try {
    const { data: existing } = await supabase
      .from('users').select('id, username').eq('id', id).single()
    if (!existing) return res.status(404).json({ error: 'User not found.' })
    if (req.user.id === parseInt(id))
      return res.status(400).json({ error: 'You cannot delete your own account.' })
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'DELETE', 'Users', `Deleted user: ${existing.username}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
