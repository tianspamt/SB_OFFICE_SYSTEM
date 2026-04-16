const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { body } = require('express-validator')
const SibApiV3Sdk = require('sib-api-v3-sdk')

const supabase = require('../config/supabase')
const { verifyToken, adminOnly, validate } = require('../middleware/auth')
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter')
const { logActivity } = require('../helpers/logger')
const { isValidEmail, getIP } = require('../helpers/utils')

const JWT_SECRET = process.env.JWT_SECRET
const SALT_ROUNDS = 10

// ---- BREVO CLIENT ----
const brevoClient = SibApiV3Sdk.ApiClient.instance
brevoClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi()

// ---- OTP STORE (in-memory) ----
const otpStore = new Map()

// POST /api/send-otp
router.post('/send-otp', otpLimiter, async (req, res) => {
  const { email } = req.body
  if (!email || !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim())) {
    return res.status(400).json({ error: 'A valid Gmail address (@gmail.com) is required.' })
  }
  const otp = crypto.randomInt(100000, 999999).toString()
  const expiresAt = Date.now() + 10 * 60 * 1000
  otpStore.set(email.trim().toLowerCase(), { otp, expiresAt })
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
    sendSmtpEmail.sender = { name: 'Sangguniang Bayan Balilihan', email: process.env.BREVO_SENDER_EMAIL }
    sendSmtpEmail.to = [{ email: email.trim() }]
    sendSmtpEmail.subject = 'Your Registration Verification Code'
    sendSmtpEmail.htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e0e0e0;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#2e7d32;margin:0 0 4px;">Office of Sangguniang Bayan</h2>
          <p style="color:#888;font-size:13px;margin:0;">Municipality of Balilihan, Bohol</p>
        </div>
        <p style="color:#555;text-align:center;font-size:15px;margin-bottom:8px;">Your verification code is:</p>
        <div style="font-size:42px;font-weight:bold;letter-spacing:14px;color:#2e7d32;text-align:center;margin:16px 0;padding:16px;background:#f0faf0;border-radius:8px;">${otp}</div>
        <p style="color:#888;font-size:13px;text-align:center;margin-top:16px;">
          This code expires in <strong>10 minutes</strong>.<br/>Do not share this code with anyone.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="color:#aaa;font-size:11px;text-align:center;">If you did not request this, please ignore this email.</p>
      </div>
    `
    await emailApi.sendTransacEmail(sendSmtpEmail)
    res.json({ success: true, message: 'OTP sent successfully.' })
  } catch (err) {
    console.error('Brevo error:', JSON.stringify(err, null, 2))
    res.status(500).json({ error: 'Failed to send verification email. Please try again.' })
  }
})

// POST /api/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body
  const key = email?.trim().toLowerCase()
  const record = otpStore.get(key)
  if (!record)
    return res.status(400).json({ error: 'No verification code found. Please request a new one.' })
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key)
    return res.status(400).json({ error: 'Code has expired. Please request a new one.' })
  }
  if (record.otp !== otp)
    return res.status(400).json({ error: 'Incorrect code. Please try again.' })
  otpStore.delete(key)
  res.json({ success: true, message: 'Email verified successfully.' })
})

// POST /api/register
router.post('/register', [
  body('name').trim().escape().notEmpty().withMessage('Full name is required.'),
  body('username').trim().escape().notEmpty().isAlphanumeric().withMessage('Username must be alphanumeric.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Invalid email format.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least 1 uppercase letter.')
    .matches(/\d/).withMessage('Password must contain at least 1 number.'),
], validate, async (req, res) => {
  const { name, username, email, password } = req.body
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const { data, error } = await supabase
      .from('users')
      .insert({ name, username, email, password: hashedPassword, role: 'user' })
      .select().single()
    if (error) {
      if (error.code === '23505')
        return res.status(400).json({ error: 'Username or email already exists.' })
      return res.status(500).json({ error: error.message })
    }
    await supabase.from('activity_logs').insert({
      user_id: data.id, user_name: name, user_role: 'user',
      action: 'REGISTER', module: 'Auth',
      description: `New user registered: ${username}`,
      ip_address: getIP(req), status: 'success'
    })
    res.json({ success: true, userId: data.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/login
router.post('/login', loginLimiter, [
  body('identifier').trim().notEmpty().withMessage('Username or email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
], validate, async (req, res) => {
  const { identifier, password } = req.body
  try {
    const isEmail = isValidEmail(identifier)
    const { data: users, error } = await supabase
      .from('users').select('*')
      .eq(isEmail ? 'email' : 'username', identifier).limit(1)
    if (error) return res.status(500).json({ error: error.message })
    if (!users || users.length === 0) {
      await supabase.from('activity_logs').insert({
        user_name: identifier, user_role: 'unknown',
        action: 'LOGIN', module: 'Auth',
        description: `Failed login attempt: ${identifier}`,
        ip_address: getIP(req), status: 'failed'
      })
      return res.json({ success: false, message: 'Invalid username/email or password.' })
    }
    const user = users[0]
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      await supabase.from('activity_logs').insert({
        user_id: user.id, user_name: user.name, user_role: user.role,
        action: 'LOGIN', module: 'Auth',
        description: `Wrong password for: ${identifier}`,
        ip_address: getIP(req), status: 'failed'
      })
      return res.json({ success: false, message: 'Invalid username/email or password.' })
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h', issuer: 'sangguniang-bayan-system', audience: 'sb-client' }
    )
    await supabase.from('activity_logs').insert({
      user_id: user.id, user_name: user.name, user_role: user.role,
      action: 'LOGIN', module: 'Auth',
      description: `${user.name} logged in`,
      ip_address: getIP(req), status: 'success'
    })
    res.json({
      success: true, token,
      user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role }
    })
  } catch (err) {
    console.error('LOGIN ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/logout
router.post('/logout', verifyToken, async (req, res) => {
  await logActivity(req, 'LOGOUT', 'Auth', `${req.user.name} logged out`)
  res.json({ success: true })
})

// POST /api/admin/add
router.post('/admin/add', verifyToken, adminOnly, [
  body('name').trim().escape().notEmpty().withMessage('Name is required.'),
  body('username').trim().escape().notEmpty().isAlphanumeric().withMessage('Username must be alphanumeric.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Invalid email format.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least 1 uppercase letter.')
    .matches(/\d/).withMessage('Password must contain at least 1 number.'),
], validate, async (req, res) => {
  const { name, username, email, password } = req.body
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const { data, error } = await supabase
      .from('users')
      .insert({ name, username, email, password: hashedPassword, role: 'admin' })
      .select().single()
    if (error) {
      if (error.code === '23505')
        return res.status(400).json({ error: 'Username or email already exists.' })
      return res.status(500).json({ error: error.message })
    }
    await logActivity(req, 'CREATE', 'Users', `Added new admin: ${username}`)
    res.json({ success: true, userId: data.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
