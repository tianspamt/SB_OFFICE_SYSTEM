<<<<<<< HEAD
const SALT_ROUNDS = 10;

=======
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') })
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
<<<<<<< HEAD
const mysql = require("mysql2")
=======
const { createClient } = require('@supabase/supabase-js')
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Tesseract = require('tesseract.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
<<<<<<< HEAD


const app = express()
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
}))
=======
const rateLimit = require('express-rate-limit')
const { body, validationResult } = require('express-validator')
const helmet = require('helmet')
const crypto = require('crypto')

const app = express()
const JWT_SECRET = process.env.JWT_SECRET
const SALT_ROUNDS = 10

// ---- BREVO CLIENT ----
const SibApiV3Sdk = require('sib-api-v3-sdk')
const brevoClient = SibApiV3Sdk.ApiClient.instance
brevoClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi()

// ---- OTP STORE (in-memory) ----
const otpStore = new Map()

// ---- SUPABASE CLIENT ----
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ---- SECURITY: Helmet ----
app.use(helmet())

// ---- CORS ----
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-app-name.vercel.app',
    /\.vercel\.app$/,
  ],
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  credentials: true
}))

>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
app.use(bodyParser.json())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

<<<<<<< HEAD
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})

const upload = multer({
  storage,
=======
// ---- SECURITY: Global Rate Limit ----
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
}))

// ---- SECURITY: Strict Login Rate Limit ----
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
})

// ---- OTP Rate Limit ----
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests. Please wait 10 minutes.' }
})

// ---- MULTER ----
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only images and PDFs are allowed'))
  }
})

<<<<<<< HEAD
app.use('/uploads', express.static('uploads'))

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "myapp"
})

db.connect(err => {
  if (err) console.log("DB Connection Error:", err)
  else {
    console.log("Connected to Database")
    
  }
})

// ---- HELPERS ----
const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)

// ---- MIDDLEWARE: Verify JWT Token ----
=======
// ---- SUPABASE STORAGE HELPERS ----
const uploadToStorage = async (file, folder) => {
  const ext = path.extname(file.originalname)
  const fileName = `${folder}/${Date.now()}${ext}`
  const { error: uploadError } = await supabase.storage
    .from('files')
    .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false })
  if (uploadError) throw new Error(uploadError.message)
  const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(fileName)
  return { fileName, publicUrl }
}

const deleteFromStorage = async (filePath) => {
  if (!filePath) return
  const { error } = await supabase.storage.from('files').remove([filePath])
  if (error) console.error('Storage delete error:', error.message)
}

// ---- ACTIVITY LOGGER ----
const logActivity = async (req, action, module, description, status = 'success') => {
  try {
    await supabase.from('activity_logs').insert({
      user_id:    req.user?.id || null,
      user_name:  req.user?.name || 'Unknown',
      user_role:  req.user?.role || 'unknown',
      action,
      module,
      description,
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      status
    })
  } catch (err) {
    console.error('Log error:', err.message)
  }
}

// ---- HELPERS ----
const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)
const getIP = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress

// ---- MIDDLEWARE: Verify JWT ----
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' })
  try {
<<<<<<< HEAD
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' })
=======
    req.user = jwt.verify(token, JWT_SECRET, {
      issuer: 'sangguniang-bayan-system',
      audience: 'sb-client'
    })
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Session expired. Please login again.' })
    return res.status(403).json({ error: 'Invalid token.' })
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  }
}

// ---- MIDDLEWARE: Admin only ----
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' })
  next()
}

<<<<<<< HEAD
// ---- USER ROUTES ----

app.post("/api/register", async (req, res) => {
  const { name, username, email, password } = req.body
  if (!name || !username || !email || !password)
    return res.status(400).json({ error: 'All fields are required.' })
  if (!isValidEmail(email))
    return res.status(400).json({ error: 'Invalid email format.' })
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    db.query(
      "INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, 'user')",
      [name, username, email, hashedPassword],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            const field = err.message.toLowerCase().includes('email') ? 'Email' : 'Username'
            return res.status(400).json({ error: `${field} already exists.` })
          }
          return res.status(500).json({ error: err.message })
        }
        res.json({ success: true, userId: result.insertId })
      }
    )
=======
// ---- MIDDLEWARE: Validation error handler ----
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty())
    return res.status(400).json({ error: errors.array()[0].msg })
  next()
}

// ==================================================
// ---- OTP ROUTES ----
// ==================================================

// POST /api/send-otp
app.post('/api/send-otp', otpLimiter, async (req, res) => {
  const { email } = req.body

  if (!email || !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim())) {
    return res.status(400).json({ error: 'A valid Gmail address (@gmail.com) is required.' })
  }

  const otp = crypto.randomInt(100000, 999999).toString()
  const expiresAt = Date.now() + 10 * 60 * 1000

  otpStore.set(email.trim().toLowerCase(), { otp, expiresAt })

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
    sendSmtpEmail.sender = {
      name: 'Sangguniang Bayan Balilihan',
      email: process.env.BREVO_SENDER_EMAIL
    }
    sendSmtpEmail.to = [{ email: email.trim() }]
    sendSmtpEmail.subject = 'Your Registration Verification Code'
    sendSmtpEmail.htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e0e0e0;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#2e7d32;margin:0 0 4px;">Office of Sangguniang Bayan</h2>
          <p style="color:#888;font-size:13px;margin:0;">Municipality of Balilihan, Bohol</p>
        </div>
        <p style="color:#555;text-align:center;font-size:15px;margin-bottom:8px;">Your verification code is:</p>
        <div style="font-size:42px;font-weight:bold;letter-spacing:14px;color:#2e7d32;text-align:center;margin:16px 0;padding:16px;background:#f0faf0;border-radius:8px;">
          ${otp}
        </div>
        <p style="color:#888;font-size:13px;text-align:center;margin-top:16px;">
          This code expires in <strong>10 minutes</strong>.<br/>Do not share this code with anyone.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="color:#aaa;font-size:11px;text-align:center;">
          If you did not request this, please ignore this email.
        </p>
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
app.post('/api/verify-otp', async (req, res) => {
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

// ==================================================
// ---- USER ROUTES ----
// ==================================================

app.post("/api/register", [
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
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

<<<<<<< HEAD
app.post("/api/login", (req, res) => {
  const { identifier, password } = req.body
  if (!identifier || !password)
    return res.status(400).json({ success: false, message: 'Username/email and password are required.' })
  const isEmail = isValidEmail(identifier)
  const query = isEmail ? "SELECT * FROM users WHERE email = ?" : "SELECT * FROM users WHERE username = ?"
  db.query(query, [identifier], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0)
      return res.json({ success: false, message: 'Invalid username/email or password.' })
    const user = results[0]
    try {
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch)
        return res.json({ success: false, message: 'Invalid username/email or password.' })
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '8h' }
      )
      res.json({
        success: true, token,
        user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role }
      })
    } catch (err) {
    console.error('LOGIN ERROR:', err); // add this
    res.status(500).json({ error: err.message });
  }
  })
})

app.post("/api/admin/add", verifyToken, adminOnly, async (req, res) => {
  const { name, username, email, password } = req.body
  if (!name || !username || !email || !password)
    return res.status(400).json({ error: 'All fields are required.' })
  if (!isValidEmail(email))
    return res.status(400).json({ error: 'Invalid email format.' })
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    db.query(
      "INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, 'admin')",
      [name, username, email, hashedPassword],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            const field = err.message.toLowerCase().includes('email') ? 'Email' : 'Username'
            return res.status(400).json({ error: `${field} already exists.` })
          }
          return res.status(500).json({ error: err.message })
        }
        res.json({ success: true, userId: result.insertId })
      }
    )
=======
app.post("/api/login", loginLimiter, [
  body('identifier').trim().notEmpty().withMessage('Username or email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
], validate, async (req, res) => {
  const { identifier, password } = req.body
  console.log('1. LOGIN ATTEMPT:', identifier)
  try {
    const isEmail = isValidEmail(identifier)
    console.log('2. IS EMAIL:', isEmail)
    const { data: users, error } = await supabase
      .from('users').select('*')
      .eq(isEmail ? 'email' : 'username', identifier).limit(1)
    console.log('3. USERS FOUND:', users?.length)
    console.log('4. DB ERROR:', error)
    if (error) return res.status(500).json({ error: error.message })
    if (!users || users.length === 0) {
      console.log('5. NO USER FOUND')
      await supabase.from('activity_logs').insert({
        user_name: identifier, user_role: 'unknown',
        action: 'LOGIN', module: 'Auth',
        description: `Failed login attempt: ${identifier}`,
        ip_address: getIP(req), status: 'failed'
      })
      return res.json({ success: false, message: 'Invalid username/email or password.' })
    }
    const user = users[0]
    console.log('6. USER FOUND:', user.username, user.role)
    const isMatch = await bcrypt.compare(password, user.password)
    console.log('7. PASSWORD MATCH:', isMatch)
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
    console.log('8. LOGIN SUCCESS:', user.username)
    res.json({
      success: true, token,
      user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role }
    })
  } catch (err) {
    console.error('LOGIN ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

// ---- LOGOUT ----
app.post("/api/logout", verifyToken, async (req, res) => {
  await logActivity(req, 'LOGOUT', 'Auth', `${req.user.name} logged out`)
  res.json({ success: true })
})

app.post("/api/admin/add", verifyToken, adminOnly, [
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
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

<<<<<<< HEAD
app.get("/api/users", verifyToken, adminOnly, (req, res) => {
  db.query("SELECT id, name, username, email, role FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: err })
    res.json(results)
  })
})

app.delete("/api/users/:id", verifyToken, adminOnly, (req, res) => {
  db.query("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err })
    res.json({ success: true })
  })
})

app.put("/api/users/:id/email", verifyToken, (req, res) => {
=======
app.get("/api/users", verifyToken, adminOnly, async (req, res) => {
  const { data, error } = await supabase.from('users').select('id, name, username, email, role')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.delete("/api/users/:id", verifyToken, adminOnly, async (req, res) => {
  const { error } = await supabase.from('users').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'DELETE', 'Users', `Deleted user ID: ${req.params.id}`)
  res.json({ success: true })
})

app.put("/api/users/:id/email", verifyToken, [
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required.'),
], validate, async (req, res) => {
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const { id } = req.params
  const { email } = req.body
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden.' })
<<<<<<< HEAD
  if (!email || !isValidEmail(email))
    return res.status(400).json({ error: 'Valid email is required.' })
  db.query('UPDATE users SET email = ? WHERE id = ?', [email, id], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already in use.' })
      return res.status(500).json({ error: err.message })
    }
    res.json({ success: true })
  })
})

// ---- SB OFFICIALS ROUTES ----
app.get('/api/sb-officials', (req, res) => {
  db.query('SELECT * FROM sb_officials ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err })
    res.json(results)
  })
})

app.post('/api/sb-officials/add', verifyToken, adminOnly, upload.single('photo'), (req, res) => {
  const { full_name, position, term_period } = req.body
  const photo = req.file ? req.file.filename : null
  db.query(
    'INSERT INTO sb_officials (full_name, position, term_period, photo) VALUES (?, ?, ?, ?)',
    [full_name, position, term_period, photo],
    (err, result) => {
      if (err) return res.status(500).json({ error: err })
      res.json({ success: true, id: result.insertId })
    }
  )
})

app.delete('/api/sb-officials/:id', verifyToken, adminOnly, (req, res) => {
  const { id } = req.params
  db.query('SELECT photo FROM sb_officials WHERE id = ?', [id], (err, results) => {
    if (results.length > 0 && results[0].photo) {
      const filepath = `./uploads/${results[0].photo}`
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
    }
    db.query('DELETE FROM sb_officials WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err })
      res.json({ success: true })
    })
  })
})

// ---- ORDINANCE ROUTES ----

app.post('/api/ordinances/upload', verifyToken, adminOnly, upload.single('file'), (req, res) => {
  const { ordinance_number, title, year, officials } = req.body
  const { filename, mimetype } = req.file
  const filepath = `/uploads/${filename}`
  const officialIds = JSON.parse(officials || '[]')
  db.query(
    'INSERT INTO ordinances (ordinance_number, title, year, filename, filetype, filepath) VALUES (?, ?, ?, ?, ?, ?)',
    [ordinance_number, title, year, filename, mimetype, filepath],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message })
      const ordinanceId = result.insertId
      if (officialIds.length > 0) {
        const values = officialIds.map(oid => [ordinanceId, oid])
        db.query('INSERT INTO ordinance_officials (ordinance_id, official_id) VALUES ?', [values], () => {})
      }
      res.json({ success: true, id: ordinanceId })
    }
  )
=======
  const { error } = await supabase.from('users').update({ email }).eq('id', id)
  if (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Email already in use.' })
    return res.status(500).json({ error: error.message })
  }
  await logActivity(req, 'UPDATE', 'Users', `Updated email for user ID: ${id}`)
  res.json({ success: true })
})

// ==================================================
// ---- ACTIVITY LOGS ROUTES ----
// ==================================================

app.get('/api/activity-logs', verifyToken, adminOnly, async (req, res) => {
  const { module, action, limit = 100, page = 1 } = req.query
  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)
  if (module && module !== 'all') query = query.eq('module', module)
  if (action && action !== 'all') query = query.eq('action', action)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.get('/api/activity-logs/stats', verifyToken, adminOnly, async (req, res) => {
  const { data, error } = await supabase.from('activity_logs').select('action, module, status')
  if (error) return res.status(500).json({ error: error.message })
  res.json({
    total:   data.length,
    logins:  data.filter(l => l.action === 'LOGIN').length,
    uploads: data.filter(l => l.action === 'UPLOAD').length,
    deletes: data.filter(l => l.action === 'DELETE').length,
    creates: data.filter(l => l.action === 'CREATE').length,
    failed:  data.filter(l => l.status === 'failed').length,
  })
})

// ==================================================
// ---- SB OFFICIALS ROUTES ----
// ==================================================

app.get('/api/sb-officials', async (req, res) => {
  const { data, error } = await supabase
    .from('sb_officials').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/sb-officials/add', verifyToken, adminOnly, upload.single('photo'), async (req, res) => {
  const { full_name, position, term_period } = req.body
  try {
    let photo = null, photo_path = null
    if (req.file) {
      const { fileName, publicUrl } = await uploadToStorage(req.file, 'officials')
      photo = publicUrl
      photo_path = fileName
    }
    const { data, error } = await supabase
      .from('sb_officials')
      .insert({ full_name, position, term_period, photo, photo_path })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'CREATE', 'Officials', `Added official: ${full_name}`)
    res.json({ success: true, id: data.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/sb-officials/:id', verifyToken, adminOnly, async (req, res) => {
  const { data: official } = await supabase
    .from('sb_officials').select('photo_path, full_name').eq('id', req.params.id).single()
  if (official?.photo_path) await deleteFromStorage(official.photo_path)
  const { error } = await supabase.from('sb_officials').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'DELETE', 'Officials', `Deleted official: ${official?.full_name || req.params.id}`)
  res.json({ success: true })
})

// ==================================================
// ---- ORDINANCE ROUTES ----
// ==================================================

app.post('/api/ordinances/upload', verifyToken, adminOnly, upload.single('file'), async (req, res) => {
  const { ordinance_number, title, year, officials } = req.body
  const officialIds = JSON.parse(officials || '[]')
  try {
    const { fileName, publicUrl } = await uploadToStorage(req.file, 'ordinances')
    const { data: ordinance, error } = await supabase
      .from('ordinances')
      .insert({
        ordinance_number, title, year,
        filename: req.file.originalname,
        filetype: req.file.mimetype,
        filepath: publicUrl,
        file_path: fileName
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    if (officialIds.length > 0) {
      await supabase.from('ordinance_officials').insert(
        officialIds.map(oid => ({ ordinance_id: ordinance.id, official_id: oid }))
      )
    }
    await logActivity(req, 'UPLOAD', 'Ordinances', `Uploaded ordinance: ${title}`)
    res.json({ success: true, id: ordinance.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
})

app.post('/api/ordinances/upload-image-text', verifyToken, adminOnly, upload.single('file'), async (req, res) => {
  const { ordinance_number, title, year, officials } = req.body
<<<<<<< HEAD
  const { filename, mimetype } = req.file
  const filepath = `/uploads/${filename}`
  const officialIds = JSON.parse(officials || '[]')
  try {
    const { data: { text } } = await Tesseract.recognize(`./uploads/${filename}`, 'eng')
    db.query(
      'INSERT INTO ordinances (ordinance_number, title, year, filename, filetype, filepath, extracted_text) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ordinance_number, title, year, filename, mimetype, filepath, text.trim()],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message })
        const ordinanceId = result.insertId
        if (officialIds.length > 0) {
          const values = officialIds.map(oid => [ordinanceId, oid])
          db.query('INSERT INTO ordinance_officials (ordinance_id, official_id) VALUES ?', [values], () => {})
        }
        res.json({ success: true, id: ordinanceId, text: text.trim() })
      }
    )
=======
  const officialIds = JSON.parse(officials || '[]')
  try {
    const tempPath = path.join('/tmp', `${Date.now()}-${req.file.originalname}`)
    fs.writeFileSync(tempPath, req.file.buffer)
    const { data: { text } } = await Tesseract.recognize(tempPath, 'eng')
    fs.unlinkSync(tempPath)
    const { fileName, publicUrl } = await uploadToStorage(req.file, 'ordinances')
    const { data: ordinance, error } = await supabase
      .from('ordinances')
      .insert({
        ordinance_number, title, year,
        filename: req.file.originalname,
        filetype: req.file.mimetype,
        filepath: publicUrl,
        file_path: fileName,
        extracted_text: text.trim()
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    if (officialIds.length > 0) {
      await supabase.from('ordinance_officials').insert(
        officialIds.map(oid => ({ ordinance_id: ordinance.id, official_id: oid }))
      )
    }
    await logActivity(req, 'UPLOAD', 'Ordinances', `Uploaded ordinance (OCR): ${title}`)
    res.json({ success: true, id: ordinance.id, text: text.trim() })
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

<<<<<<< HEAD
app.get('/api/ordinances', (req, res) => {
  const query = `
    SELECT o.*,
      GROUP_CONCAT(
        IF(s.id IS NOT NULL,
          CONCAT(s.id, '|', s.full_name, '|', s.position, '|', IFNULL(s.photo, ''))
        , NULL)
      ) as officials_raw
    FROM ordinances o
    LEFT JOIN ordinance_officials oo ON o.id = oo.ordinance_id
    LEFT JOIN sb_officials s ON oo.official_id = s.id
    GROUP BY o.id
    ORDER BY o.uploaded_at DESC
  `
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    const parsed = results.map(r => ({
      ...r,
      officials: r.officials_raw
        ? r.officials_raw.split(',').map(o => {
            const [id, full_name, position, photo] = o.split('|')
            return { id: parseInt(id), full_name, position, photo: photo || null }
          })
        : []
    }))
    res.json(parsed)
  })
})

app.put('/api/ordinances/:id', verifyToken, adminOnly, upload.single('file'), (req, res) => {
  const { id } = req.params
  const { ordinance_number, title, year, officials } = req.body
  let sql = 'UPDATE ordinances SET ordinance_number = ?, title = ?, year = ?'
  let params = [ordinance_number, title, year]
  if (req.file) {
    db.query('SELECT filename FROM ordinances WHERE id = ?', [id], (err, results) => {
      if (results && results.length > 0) {
        const oldPath = `./uploads/${results[0].filename}`
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }
    })
    sql += ', filename = ?, filetype = ?, filepath = ?'
    params.push(req.file.filename, req.file.mimetype, `/uploads/${req.file.filename}`)
  }
  sql += ' WHERE id = ?'
  params.push(id)
  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ error: err.message })
    db.query('DELETE FROM ordinance_officials WHERE ordinance_id = ?', [id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message })
      const officialIds = JSON.parse(officials || '[]')
      if (officialIds.length > 0) {
        const values = officialIds.map(oid => [id, oid])
        db.query('INSERT INTO ordinance_officials (ordinance_id, official_id) VALUES ?', [values], (err3) => {
          if (err3) return res.status(500).json({ error: err3.message })
          res.json({ success: true })
        })
      } else {
        res.json({ success: true })
      }
    })
  })
})

app.delete('/api/ordinances/:id', verifyToken, adminOnly, (req, res) => {
  const { id } = req.params
  db.query('SELECT filename FROM ordinances WHERE id = ?', [id], (err, results) => {
    if (results && results.length > 0) {
      const filepath = `./uploads/${results[0].filename}`
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
    }
    db.query('DELETE FROM ordinances WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err })
      res.json({ success: true })
    })
  })
})

app.get('/api/ordinances/:id/print', (req, res) => {
  const { id } = req.params
  db.query('SELECT * FROM ordinances WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err })
    if (results.length === 0) return res.status(404).send('Not found')
    const o = results[0]
    res.send(`
      <!DOCTYPE html><html><head>
        <title>${o.ordinance_number || o.title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 40px; color: #000; }
          h2 { text-align: center; font-size: 15px; color: #555; margin-bottom: 4px; }
          h1 { text-align: center; font-size: 20px; margin: 0 0 8px; }
          .meta { text-align: center; font-size: 13px; color: #555; margin-bottom: 32px; border-bottom: 2px solid #000; padding-bottom: 16px; }
          .content { font-size: 14px; line-height: 1.8; white-space: pre-wrap; }
          .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #1a365d; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
          @media print { .print-btn { display: none; } }
        </style>
      </head><body>
        <button class="print-btn" onclick="window.print()">🖨 Print</button>
        ${o.ordinance_number ? `<h2>${o.ordinance_number}</h2>` : ''}
        <h1>${o.title}</h1>
        <div class="meta">${o.year ? `Year: ${o.year} &nbsp;|&nbsp;` : ''}Date: ${new Date(o.uploaded_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div class="content">${o.extracted_text || 'No extracted text available.'}</div>
      </body></html>
    `)
  })
})

// GET all resolutions (public)
app.get('/api/resolutions', (req, res) => {
  const query = `
    SELECT r.*,
      GROUP_CONCAT(
        IF(s.id IS NOT NULL,
          CONCAT(s.id, '|', s.full_name, '|', s.position, '|', IFNULL(s.photo, ''))
        , NULL)
      ) as officials_raw
    FROM resolutions r
    LEFT JOIN resolution_officials ro ON r.id = ro.resolution_id
    LEFT JOIN sb_officials s ON ro.official_id = s.id
    GROUP BY r.id
    ORDER BY r.uploaded_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const parsed = results.map(r => ({
      ...r,
      officials: r.officials_raw
        ? r.officials_raw.split(',').map(o => {
            const [id, full_name, position, photo] = o.split('|');
            return { id: parseInt(id), full_name, position, photo: photo || null };
          })
        : []
    }));
    res.json(parsed);
  });
});

// POST upload resolution as PDF (admin)
app.post('/api/resolutions/upload', verifyToken, adminOnly, upload.single('file'), (req, res) => {
  const { resolution_number, title, year, officials } = req.body;
  const { filename, mimetype } = req.file;
  const officialIds = JSON.parse(officials || '[]');
  db.query(
    'INSERT INTO resolutions (resolution_number, title, year, filename, filetype, filepath) VALUES (?, ?, ?, ?, ?, ?)',
    [resolution_number, title, year, filename, mimetype, `/uploads/${filename}`],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const rid = result.insertId;
      if (officialIds.length > 0) {
        db.query('INSERT INTO resolution_officials (resolution_id, official_id) VALUES ?', [officialIds.map(oid => [rid, oid])], () => {});
      }
      res.json({ success: true, id: rid });
    }
  );
});

// POST upload resolution as image → OCR (admin)
app.post('/api/resolutions/upload-image-text', verifyToken, adminOnly, upload.single('file'), async (req, res) => {
  const { resolution_number, title, year, officials } = req.body;
  const { filename, mimetype } = req.file;
  const officialIds = JSON.parse(officials || '[]');
  try {
    const { data: { text } } = await Tesseract.recognize(`./uploads/${filename}`, 'eng');
    db.query(
      'INSERT INTO resolutions (resolution_number, title, year, filename, filetype, filepath, extracted_text) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [resolution_number, title, year, filename, mimetype, `/uploads/${filename}`, text.trim()],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const rid = result.insertId;
        if (officialIds.length > 0) {
          db.query('INSERT INTO resolution_officials (resolution_id, official_id) VALUES ?', [officialIds.map(oid => [rid, oid])], () => {});
        }
        res.json({ success: true, id: rid, text: text.trim() });
      }
    );
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update resolution (admin)
app.put('/api/resolutions/:id', verifyToken, adminOnly, upload.single('file'), (req, res) => {
  const { id } = req.params;
  const { resolution_number, title, year, officials } = req.body;
  let sql = 'UPDATE resolutions SET resolution_number=?, title=?, year=?';
  let params = [resolution_number, title, year];
  if (req.file) {
    db.query('SELECT filename FROM resolutions WHERE id=?', [id], (err, rows) => {
      if (rows && rows[0]) { const p = `./uploads/${rows[0].filename}`; if (fs.existsSync(p)) fs.unlinkSync(p); }
    });
    sql += ', filename=?, filetype=?, filepath=?';
    params.push(req.file.filename, req.file.mimetype, `/uploads/${req.file.filename}`);
  }
  sql += ' WHERE id=?';
  params.push(id);
  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query('DELETE FROM resolution_officials WHERE resolution_id=?', [id], () => {
      const officialIds = JSON.parse(officials || '[]');
      if (officialIds.length > 0) {
        db.query('INSERT INTO resolution_officials (resolution_id, official_id) VALUES ?', [officialIds.map(oid => [id, oid])], (e) => {
          if (e) return res.status(500).json({ error: e.message });
          res.json({ success: true });
        });
      } else { res.json({ success: true }); }
    });
  });
});

// DELETE resolution (admin)
app.delete('/api/resolutions/:id', verifyToken, adminOnly, (req, res) => {
  const { id } = req.params;
  db.query('SELECT filename FROM resolutions WHERE id=?', [id], (err, rows) => {
    if (rows && rows[0]) { const p = `./uploads/${rows[0].filename}`; if (fs.existsSync(p)) fs.unlinkSync(p); }
    db.query('DELETE FROM resolutions WHERE id=?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// GET print page for resolution (public)
app.get('/api/resolutions/:id/print', (req, res) => {
  db.query('SELECT * FROM resolutions WHERE id=?', [req.params.id], (err, rows) => {
    if (err || !rows.length) return res.status(404).send('Not found');
    const r = rows[0];
    res.send(`<!DOCTYPE html><html><head><title>${r.resolution_number || r.title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Times New Roman', serif; max-width: 850px; margin: 0 auto; padding: 48px 60px; color: #111; }
        .letterhead { display: flex; align-items: center; gap: 28px; padding-bottom: 18px; border-bottom: 3px solid #000; margin-bottom: 24px; }
        .letterhead img { width: 90px; height: 90px; object-fit: contain; }
        .republic { font-size: 13px; font-style: italic; }
        .province { font-size: 13.5px; font-weight: bold; text-transform: uppercase; }
        .municipality { font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
        .office { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 8px; padding-top: 8px; border-top: 1px solid #bbb; }
        .doc-title { text-align: center; margin-bottom: 20px; }
        .doc-title h2 { font-size: 13px; color: #555; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
        .doc-title h1 { font-size: 19px; color: #1a365d; }
        .meta { text-align: center; font-size: 13px; color: #555; margin-bottom: 28px; border-bottom: 2px solid #000; padding-bottom: 14px; }
        .content { font-size: 14px; line-height: 1.8; white-space: pre-wrap; text-align: justify; }
        .footer { margin-top: 60px; border-top: 1px solid #cbd5e0; padding-top: 14px; text-align: center; font-size: 11px; color: #888; }
        .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #1a365d; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-family: sans-serif; }
        @media print { .print-btn { display: none; } body { padding: 24px 40px; } }
      </style></head><body>
      <button class="print-btn" onclick="window.print()">🖨 Print</button>
      <div class="letterhead">
        <img src="http://localhost:5000/uploads/balilihan-logo-Large-1.jpg" alt="Seal" onerror="this.style.display='none'" />
        <div>
          <div class="republic">Republic of the Philippines</div>
          <div class="province">Province of Bohol</div>
          <div class="municipality">Municipality of Balilihan</div>
          <div class="office">Office of the Sangguniang Bayan</div>
        </div>
      </div>
      <div class="doc-title">
        ${r.resolution_number ? `<h2>${r.resolution_number}</h2>` : ''}
        <h1>${r.title}</h1>
      </div>
      <div class="meta">
        ${r.year ? `Year: ${r.year} &nbsp;|&nbsp;` : ''}
        Date: ${new Date(r.uploaded_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div class="content">${r.extracted_text || 'No extracted text available for this resolution.'}</div>
      <div class="footer">Sangguniang Bayan of Balilihan, Bohol &nbsp;•&nbsp; Official Public Record</div>
    </body></html>`);
  });
});

// ============================================================
// ---- SESSION MINUTES & AGENDA ROUTES ----
// ============================================================

// PUBLIC: Get all session minutes (for public viewing)
app.get('/api/session-minutes', (req, res) => {
  const { month, year, type } = req.query
  let sql = 'SELECT id, session_number, session_date, session_type, venue, agenda, minutes_text, filename, filetype, created_at FROM session_minutes WHERE 1=1'
  const params = []
  if (month) { sql += ' AND MONTH(session_date) = ?'; params.push(month) }
  if (year)  { sql += ' AND YEAR(session_date) = ?';  params.push(year) }
  if (type && type !== 'all') { sql += ' AND session_type = ?'; params.push(type) }
  sql += ' ORDER BY session_date DESC'
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// PUBLIC: Get single session minutes
app.get('/api/session-minutes/:id', (req, res) => {
  db.query('SELECT * FROM session_minutes WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(results[0])
  })
})

// PUBLIC: Print/view session minutes as HTML page
app.get('/api/session-minutes/:id/print', (req, res) => {
  db.query('SELECT * FROM session_minutes WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0) return res.status(404).send('Not found')
    const s = results[0]
    const agendaItems = s.agenda ? s.agenda.split('\n').filter(Boolean) : []
    const agendaHTML = agendaItems.length
      ? `<ol>${agendaItems.map(a => `<li>${a.trim()}</li>`).join('')}</ol>`
      : '<p><em>No agenda items listed.</em></p>'
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Session Minutes — ${s.session_number || new Date(s.session_date).toLocaleDateString('en-PH')}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: Arial, sans-serif;
            text-align: justify;
            max-width: 850px;
            margin: 0 auto;
            padding: 40px 60px 60px;
            color: #111;
            background: #fff;
          }

          /* ── LETTERHEAD ── */
          .letterhead {
            display: flex;
            text-align: center;
            align-items: center;
            gap: 119.5px;
            padding-bottom: 18px;
            margin-bottom: 6px;
          }

          .letterhead-seal {
            flex-shrink: 0;
            width: 100px;
            height: 100px;
            object-fit: contain;
          }

          .letterhead-seal-placeholder {
            flex-shrink: 0;
            width: 100px;
            height: 100px;
            border: 2px solid #333;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            text-align: center;
            color: #555;
            line-height: 1.3;
            padding: 8px;
          }

          .letterhead-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .letterhead-text .republic {
            font-size: 13px;
            font-weight: normal;
            font-style: italic;
            color: #222;
            letter-spacing: 0.2px;
          }

          .letterhead-text .province {
            font-size: 13.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #111;
          }

          .letterhead-text .municipality {
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #000;
          }

          .letterhead-text .office {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #000;
            padding-top: 8px;
          }

          /* thin accent line below letterhead */
          .letterhead-rule {
            height: 2px;
            background: #000;
            margin-bottom: 28px;
          }

          /* ── DOCUMENT TITLE BLOCK ── */
          .doc-title-block {
            text-align: center;
            margin-bottom: 24px;
          }

          .doc-title-block .doc-label {
            font-size: 11px;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #555;
            margin-bottom: 6px;
          }

          .doc-title-block .session-num {
            font-size: 17px;
            font-weight: bold;
            color: #000;
            margin-bottom: 6px;
          }

          .type-badge {
            display: inline-block;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 3px 14px;
            border-radius: 20px;
          }
          .type-regular { background: #ebf8ff; color: #2b6cb0; border: 1px solid #bee3f8; }
          .type-special  { background: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }

          /* ── META TABLE ── */
          .meta-grid {
            display: grid;
            grid-template-columns: 160px 1fr;
            gap: 5px 16px;
            margin: 0 0 28px;
            font-size: 13px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 14px 18px;
            background: #fafafa;
          }
          .meta-grid .label {
            font-weight: bold;
            color: #1a365d;
          }
          .meta-grid .value {
            color: #333;
          }

          /* ── SECTIONS ── */
          .section { margin: 24px 0; }

          .section-title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #1a365d;
            border-bottom: 1.5px solid #1a365d;
            padding-bottom: 5px;
            margin-bottom: 14px;
          }

          .agenda-list {
            padding-left: 22px;
          }
          .agenda-list li {
            font-size: 13.5px;
            line-height: 1.9;
            padding: 1px 0;
          }

          .minutes-body {
            font-size: 13.5px;
            line-height: 1.9;
            white-space: pre-wrap;
            text-align: justify;
          }

          /* ── FOOTER ── */
          .footer {
            margin-top: 60px;
            border-top: 1px solid #cbd5e0;
            padding-top: 16px;
            text-align: center;
            font-size: 10.5px;
            color: #888;
            letter-spacing: 0.3px;
          }

          /* ── PRINT BUTTON (hidden on print) ── */
          .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 22px;
            background: #1a365d;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            z-index: 999;
          }
          .print-btn:hover { background: #2c4f8a; }

          @media print {
            .print-btn { display: none; }
            body { padding: 20px 40px 40px; }
            .meta-grid { border: 1px solid #ccc; background: #fff; }
          }
        </style>
      </head>
      <body>

        <button class="print-btn" onclick="window.print()">🖨&nbsp; Print</button>

        <!-- ══ OFFICIAL LETTERHEAD ══ -->
        <div class="letterhead">
          <!-- Seal: tries to load from your uploads; falls back to a placeholder circle -->
          <img
            class="letterhead-seal"
            src="./assets/image/balilihan-logo-Large-1.png"
            alt="Official Seal of Balilihan, Bohol"
            onerror="this.style.display='none'; document.getElementById('seal-placeholder').style.display='flex';"
          />
          <div class="letterhead-seal-placeholder" id="seal-placeholder" style="display:none;">
            Official Seal<br>Balilihan<br>Bohol
          </div>

          <div class="letterhead-text">
            <div class="republic">Republic of the Philippines</div>
            <div class="province">Province of Bohol</div>
            <div class="municipality">Municipality of Balilihan</div>
            <div class="office">Office of the Sangguniang Bayan</div>
          </div>
        </div>

        <!-- ══ DOCUMENT TITLE BLOCK ══ -->
        <div class="doc-title-block">
          <div class="doc-label">Session Minutes &amp; Agenda</div>
          ${s.session_number ? `<div class="session-num">${s.session_number}</div>` : ''}
          <span class="type-badge ${s.session_type === 'special' ? 'type-special' : 'type-regular'}">
            ${s.session_type === 'special' ? 'Special Session' : 'Regular Session'}
          </span>
        </div>

        <!-- ══ META INFO ══ -->
        <div class="meta-grid">
          <div class="label">Date of Session:</div>
          <div class="value">${new Date(s.session_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>

          ${s.venue ? `<div class="label">Venue:</div><div class="value">${s.venue}</div>` : ''}

          <div class="label">Date Recorded:</div>
          <div class="value">${new Date(s.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <!-- ══ AGENDA ══ -->
        <div class="section">
          <div class="section-title">Agenda</div>
          <ol class="agenda-list">
            ${agendaItems.length
              ? agendaItems.map(a => `<li>${a.trim()}</li>`).join('')
              : '<li><em>No agenda items listed.</em></li>'
            }
          </ol>
        </div>

        <!-- ══ MINUTES ══ -->
        <div class="section">
          <div class="section-title">Minutes of the Session</div>
          <div class="minutes-body">${s.minutes_text || '<em>No minutes content available.</em>'}</div>
        </div>

        <!-- ══ FOOTER ══ -->
        <div class="footer">
          Sangguniang Bayan of Balilihan &nbsp;•&nbsp; Province of Bohol &nbsp;•&nbsp; Official Public Record
        </div>

      </body>
      </html>
    `)
  })
})

// ADMIN: Create session minutes — direct text entry
app.post('/api/session-minutes', verifyToken, adminOnly, (req, res) => {
  const { session_number, session_date, session_type, venue, agenda, minutes_text } = req.body
  if (!session_date) return res.status(400).json({ error: 'Session date is required.' })
  db.query(
    'INSERT INTO session_minutes (session_number, session_date, session_type, venue, agenda, minutes_text) VALUES (?, ?, ?, ?, ?, ?)',
    [session_number || null, session_date, session_type || 'regular', venue || null, agenda || null, minutes_text || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ success: true, id: result.insertId })
    }
  )
})

// ADMIN: Create session minutes via image OCR upload
app.post('/api/session-minutes/upload-image', verifyToken, adminOnly, upload.single('file'), async (req, res) => {
  const { session_number, session_date, session_type, venue, agenda, ocr_target } = req.body
  if (!session_date) return res.status(400).json({ error: 'Session date is required.' })
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' })
  const { filename, mimetype } = req.file
  try {
    const { data: { text } } = await Tesseract.recognize(`./uploads/${filename}`, 'eng')
    const extractedText = text.trim()
    // ocr_target: 'minutes' or 'agenda'
    const minutesText = ocr_target !== 'agenda' ? extractedText : (req.body.minutes_text || null)
    const agendaText  = ocr_target === 'agenda'  ? extractedText : (agenda || null)
    db.query(
      'INSERT INTO session_minutes (session_number, session_date, session_type, venue, agenda, minutes_text, filename, filetype) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [session_number || null, session_date, session_type || 'regular', venue || null, agendaText, minutesText, filename, mimetype],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message })
        res.json({ success: true, id: result.insertId, extracted_text: extractedText, ocr_target })
      }
    )
=======
app.get('/api/ordinances', async (req, res) => {
  const { data, error } = await supabase
    .from('ordinances')
    .select(`*, ordinance_officials ( sb_officials ( id, full_name, position, photo ) )`)
    .order('uploaded_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  const parsed = data.map(o => ({
    ...o,
    officials: o.ordinance_officials?.map(oo => oo.sb_officials).filter(Boolean) || [],
    ordinance_officials: undefined
  }))
  res.json(parsed)
})

app.put('/api/ordinances/:id', verifyToken, adminOnly, upload.single('file'), async (req, res) => {
  const { id } = req.params
  const { ordinance_number, title, year, officials } = req.body
  const updateData = { ordinance_number, title, year }
  try {
    if (req.file) {
      const { data: old } = await supabase.from('ordinances').select('file_path').eq('id', id).single()
      if (old?.file_path) await deleteFromStorage(old.file_path)
      const { fileName, publicUrl } = await uploadToStorage(req.file, 'ordinances')
      updateData.filename = req.file.originalname
      updateData.filetype = req.file.mimetype
      updateData.filepath = publicUrl
      updateData.file_path = fileName
    }
    const { error } = await supabase.from('ordinances').update(updateData).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    await supabase.from('ordinance_officials').delete().eq('ordinance_id', id)
    const officialIds = JSON.parse(officials || '[]')
    if (officialIds.length > 0) {
      await supabase.from('ordinance_officials').insert(
        officialIds.map(oid => ({ ordinance_id: id, official_id: oid }))
      )
    }
    await logActivity(req, 'UPDATE', 'Ordinances', `Updated ordinance: ${title}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/ordinances/:id', verifyToken, adminOnly, async (req, res) => {
  const { data: old } = await supabase.from('ordinances').select('file_path, title').eq('id', req.params.id).single()
  if (old?.file_path) await deleteFromStorage(old.file_path)
  const { error } = await supabase.from('ordinances').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'DELETE', 'Ordinances', `Deleted ordinance: ${old?.title || req.params.id}`)
  res.json({ success: true })
})

app.get('/api/ordinances/:id/print', async (req, res) => {
  const { data: o, error } = await supabase
    .from('ordinances').select('*').eq('id', req.params.id).single()
  if (error || !o) return res.status(404).send('Not found')
  res.send(`<!DOCTYPE html><html><head>
    <title>${o.ordinance_number || o.title}</title>
    <style>
      body { font-family:'Times New Roman',serif; max-width:800px; margin:40px auto; padding:40px; color:#000; }
      h2 { text-align:center; font-size:15px; color:#555; margin-bottom:4px; }
      h1 { text-align:center; font-size:20px; margin:0 0 8px; }
      .meta { text-align:center; font-size:13px; color:#555; margin-bottom:32px; border-bottom:2px solid #000; padding-bottom:16px; }
      .content { font-size:14px; line-height:1.8; white-space:pre-wrap; }
      .print-btn { position:fixed; top:20px; right:20px; padding:10px 20px; background:#1a365d; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; }
      @media print { .print-btn { display:none; } }
    </style>
    </head><body>
    <button class="print-btn" onclick="window.print()">🖨 Print</button>
    ${o.ordinance_number ? `<h2>${o.ordinance_number}</h2>` : ''}
    <h1>${o.title}</h1>
    <div class="meta">${o.year ? `Year: ${o.year} &nbsp;|&nbsp;` : ''}Date: ${new Date(o.uploaded_at).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</div>
    <div class="content">${o.extracted_text || 'No extracted text available.'}</div>
    </body></html>`)
})

// ==================================================
// ---- RESOLUTION ROUTES ----
// ==================================================

app.get('/api/resolutions', async (req, res) => {
  const { data, error } = await supabase
    .from('resolutions')
    .select(`*, resolution_officials ( sb_officials ( id, full_name, position, photo ) )`)
    .order('uploaded_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  const parsed = data.map(r => ({
    ...r,
    officials: r.resolution_officials?.map(ro => ro.sb_officials).filter(Boolean) || [],
    resolution_officials: undefined
  }))
  res.json(parsed)
})

app.post('/api/resolutions/upload', verifyToken, adminOnly, upload.single('file'), async (req, res) => {
  const { resolution_number, title, year, officials } = req.body
  const officialIds = JSON.parse(officials || '[]')
  try {
    const { fileName, publicUrl } = await uploadToStorage(req.file, 'resolutions')
    const { data: resolution, error } = await supabase
      .from('resolutions')
      .insert({
        resolution_number, title, year,
        filename: req.file.originalname,
        filetype: req.file.mimetype,
        filepath: publicUrl,
        file_path: fileName
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    if (officialIds.length > 0) {
      await supabase.from('resolution_officials').insert(
        officialIds.map(oid => ({ resolution_id: resolution.id, official_id: oid }))
      )
    }
    await logActivity(req, 'UPLOAD', 'Resolutions', `Uploaded resolution: ${title}`)
    res.json({ success: true, id: resolution.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/resolutions/upload-image-text', verifyToken, adminOnly, upload.single('file'), async (req, res) => {
  const { resolution_number, title, year, officials } = req.body
  const officialIds = JSON.parse(officials || '[]')
  try {
    const tempPath = path.join('/tmp', `${Date.now()}-${req.file.originalname}`)
    fs.writeFileSync(tempPath, req.file.buffer)
    const { data: { text } } = await Tesseract.recognize(tempPath, 'eng')
    fs.unlinkSync(tempPath)
    const { fileName, publicUrl } = await uploadToStorage(req.file, 'resolutions')
    const { data: resolution, error } = await supabase
      .from('resolutions')
      .insert({
        resolution_number, title, year,
        filename: req.file.originalname,
        filetype: req.file.mimetype,
        filepath: publicUrl,
        file_path: fileName,
        extracted_text: text.trim()
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    if (officialIds.length > 0) {
      await supabase.from('resolution_officials').insert(
        officialIds.map(oid => ({ resolution_id: resolution.id, official_id: oid }))
      )
    }
    await logActivity(req, 'UPLOAD', 'Resolutions', `Uploaded resolution (OCR): ${title}`)
    res.json({ success: true, id: resolution.id, text: text.trim() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/resolutions/:id', verifyToken, adminOnly, upload.single('file'), async (req, res) => {
  const { id } = req.params
  const { resolution_number, title, year, officials } = req.body
  const updateData = { resolution_number, title, year }
  try {
    if (req.file) {
      const { data: old } = await supabase.from('resolutions').select('file_path').eq('id', id).single()
      if (old?.file_path) await deleteFromStorage(old.file_path)
      const { fileName, publicUrl } = await uploadToStorage(req.file, 'resolutions')
      updateData.filename = req.file.originalname
      updateData.filetype = req.file.mimetype
      updateData.filepath = publicUrl
      updateData.file_path = fileName
    }
    const { error } = await supabase.from('resolutions').update(updateData).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    await supabase.from('resolution_officials').delete().eq('resolution_id', id)
    const officialIds = JSON.parse(officials || '[]')
    if (officialIds.length > 0) {
      await supabase.from('resolution_officials').insert(
        officialIds.map(oid => ({ resolution_id: id, official_id: oid }))
      )
    }
    await logActivity(req, 'UPDATE', 'Resolutions', `Updated resolution: ${title}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/resolutions/:id', verifyToken, adminOnly, async (req, res) => {
  const { data: old } = await supabase.from('resolutions').select('file_path, title').eq('id', req.params.id).single()
  if (old?.file_path) await deleteFromStorage(old.file_path)
  const { error } = await supabase.from('resolutions').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'DELETE', 'Resolutions', `Deleted resolution: ${old?.title || req.params.id}`)
  res.json({ success: true })
})

app.get('/api/resolutions/:id/print', async (req, res) => {
  const { data: r, error } = await supabase
    .from('resolutions').select('*').eq('id', req.params.id).single()
  if (error || !r) return res.status(404).send('Not found')
  res.send(`<!DOCTYPE html><html><head><title>${r.resolution_number || r.title}</title>
    <style>
      * { box-sizing:border-box; margin:0; padding:0; }
      body { font-family:'Times New Roman',serif; max-width:850px; margin:0 auto; padding:48px 60px; color:#111; }
      .letterhead { display:flex; align-items:center; gap:28px; padding-bottom:18px; border-bottom:3px solid #000; margin-bottom:24px; }
      .letterhead img { width:90px; height:90px; object-fit:contain; }
      .republic { font-size:13px; font-style:italic; }
      .province { font-size:13.5px; font-weight:bold; text-transform:uppercase; }
      .municipality { font-size:15px; font-weight:900; text-transform:uppercase; letter-spacing:1px; }
      .office { font-size:14px; font-weight:bold; text-transform:uppercase; margin-top:8px; padding-top:8px; border-top:1px solid #bbb; }
      .doc-title { text-align:center; margin-bottom:20px; }
      .doc-title h2 { font-size:13px; color:#555; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px; }
      .doc-title h1 { font-size:19px; color:#1a365d; }
      .meta { text-align:center; font-size:13px; color:#555; margin-bottom:28px; border-bottom:2px solid #000; padding-bottom:14px; }
      .content { font-size:14px; line-height:1.8; white-space:pre-wrap; text-align:justify; }
      .footer { margin-top:60px; border-top:1px solid #cbd5e0; padding-top:14px; text-align:center; font-size:11px; color:#888; }
      .print-btn { position:fixed; top:20px; right:20px; padding:10px 20px; background:#1a365d; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; }
      @media print { .print-btn { display:none; } }
    </style></head><body>
    <button class="print-btn" onclick="window.print()">🖨 Print</button>
    <div class="letterhead">
      <img src="${process.env.LOGO_URL || ''}" alt="Seal" onerror="this.style.display='none'" />
      <div>
        <div class="republic">Republic of the Philippines</div>
        <div class="province">Province of Bohol</div>
        <div class="municipality">Municipality of Balilihan</div>
        <div class="office">Office of the Sangguniang Bayan</div>
      </div>
    </div>
    <div class="doc-title">
      ${r.resolution_number ? `<h2>${r.resolution_number}</h2>` : ''}
      <h1>${r.title}</h1>
    </div>
    <div class="meta">
      ${r.year ? `Year: ${r.year} &nbsp;|&nbsp;` : ''}
      Date: ${new Date(r.uploaded_at).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}
    </div>
    <div class="content">${r.extracted_text || 'No extracted text available for this resolution.'}</div>
    <div class="footer">Sangguniang Bayan of Balilihan, Bohol &nbsp;•&nbsp; Official Public Record</div>
  </body></html>`)
})

// ==================================================
// ---- SESSION MINUTES ROUTES ----
// ==================================================

app.get('/api/session-minutes', async (req, res) => {
  const { month, year, type } = req.query
  let query = supabase
    .from('session_minutes')
    .select('id, session_number, session_date, session_type, venue, agenda, minutes_text, filename, filetype, created_at')
    .order('session_date', { ascending: false })
  if (type && type !== 'all') query = query.eq('session_type', type)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  let results = data
  if (month) results = results.filter(r => new Date(r.session_date).getMonth() + 1 === parseInt(month))
  if (year)  results = results.filter(r => new Date(r.session_date).getFullYear() === parseInt(year))
  res.json(results)
})

app.get('/api/session-minutes/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('session_minutes').select('*').eq('id', req.params.id).single()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Not found' })
  res.json(data)
})

app.get('/api/session-minutes/:id/print', async (req, res) => {
  const { data: s, error } = await supabase
    .from('session_minutes').select('*').eq('id', req.params.id).single()
  if (error || !s) return res.status(404).send('Not found')
  const agendaItems = s.agenda ? s.agenda.split('\n').filter(Boolean) : []
  res.send(`<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8"/>
    <title>Session Minutes — ${s.session_number || new Date(s.session_date).toLocaleDateString('en-PH')}</title>
    <style>
      * { box-sizing:border-box; margin:0; padding:0; }
      body { font-family:Arial,sans-serif; text-align:justify; max-width:850px; margin:0 auto; padding:40px 60px 60px; color:#111; }
      .letterhead { display:flex; align-items:center; gap:119.5px; padding-bottom:18px; margin-bottom:6px; }
      .letterhead-seal { flex-shrink:0; width:100px; height:100px; object-fit:contain; }
      .letterhead-text { display:flex; flex-direction:column; gap:2px; }
      .letterhead-text .republic { font-size:13px; font-style:italic; }
      .letterhead-text .province { font-size:13.5px; font-weight:bold; text-transform:uppercase; }
      .letterhead-text .municipality { font-size:15px; font-weight:900; text-transform:uppercase; letter-spacing:1px; }
      .letterhead-text .office { font-size:14px; font-weight:bold; text-transform:uppercase; padding-top:8px; }
      .letterhead-rule { height:2px; background:#000; margin-bottom:28px; }
      .doc-title-block { text-align:center; margin-bottom:24px; }
      .doc-label { font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#555; margin-bottom:6px; }
      .session-num { font-size:17px; font-weight:bold; margin-bottom:6px; }
      .type-badge { display:inline-block; font-size:10px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; padding:3px 14px; border-radius:20px; }
      .type-regular { background:#ebf8ff; color:#2b6cb0; border:1px solid #bee3f8; }
      .type-special { background:#fff5f5; color:#c53030; border:1px solid #fed7d7; }
      .meta-grid { display:grid; grid-template-columns:160px 1fr; gap:5px 16px; margin:0 0 28px; font-size:13px; border:1px solid #d1d5db; border-radius:6px; padding:14px 18px; background:#fafafa; }
      .meta-grid .label { font-weight:bold; color:#1a365d; }
      .section { margin:24px 0; }
      .section-title { font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:2px; color:#1a365d; border-bottom:1.5px solid #1a365d; padding-bottom:5px; margin-bottom:14px; }
      .agenda-list { padding-left:22px; }
      .agenda-list li { font-size:13.5px; line-height:1.9; }
      .minutes-body { font-size:13.5px; line-height:1.9; white-space:pre-wrap; text-align:justify; }
      .footer { margin-top:60px; border-top:1px solid #cbd5e0; padding-top:16px; text-align:center; font-size:10.5px; color:#888; }
      .print-btn { position:fixed; top:20px; right:20px; padding:10px 22px; background:#1a365d; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; }
      @media print { .print-btn { display:none; } body { padding:20px 40px 40px; } }
    </style>
    </head><body>
    <button class="print-btn" onclick="window.print()">🖨&nbsp; Print</button>
    <div class="letterhead">
      <img class="letterhead-seal" src="${process.env.LOGO_URL || ''}" alt="Official Seal" onerror="this.style.display='none'"/>
      <div class="letterhead-text">
        <div class="republic">Republic of the Philippines</div>
        <div class="province">Province of Bohol</div>
        <div class="municipality">Municipality of Balilihan</div>
        <div class="office">Office of the Sangguniang Bayan</div>
      </div>
    </div>
    <div class="letterhead-rule"></div>
    <div class="doc-title-block">
      <div class="doc-label">Session Minutes &amp; Agenda</div>
      ${s.session_number ? `<div class="session-num">${s.session_number}</div>` : ''}
      <span class="type-badge ${s.session_type === 'special' ? 'type-special' : 'type-regular'}">
        ${s.session_type === 'special' ? 'Special Session' : 'Regular Session'}
      </span>
    </div>
    <div class="meta-grid">
      <div class="label">Date of Session:</div>
      <div class="value">${new Date(s.session_date).toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
      ${s.venue ? `<div class="label">Venue:</div><div class="value">${s.venue}</div>` : ''}
      <div class="label">Date Recorded:</div>
      <div class="value">${new Date(s.created_at).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</div>
    </div>
    <div class="section">
      <div class="section-title">Agenda</div>
      <ol class="agenda-list">
        ${agendaItems.length ? agendaItems.map(a => `<li>${a.trim()}</li>`).join('') : '<li><em>No agenda items listed.</em></li>'}
      </ol>
    </div>
    <div class="section">
      <div class="section-title">Minutes of the Session</div>
      <div class="minutes-body">${s.minutes_text || '<em>No minutes content available.</em>'}</div>
    </div>
    <div class="footer">Sangguniang Bayan of Balilihan &nbsp;•&nbsp; Province of Bohol &nbsp;•&nbsp; Official Public Record</div>
  </body></html>`)
})

app.post('/api/session-minutes', verifyToken, adminOnly, async (req, res) => {
  const { session_number, session_date, session_type, venue, agenda, minutes_text } = req.body
  if (!session_date) return res.status(400).json({ error: 'Session date is required.' })
  const { data, error } = await supabase
    .from('session_minutes')
    .insert({
      session_number: session_number || null, session_date,
      session_type: session_type || 'regular', venue: venue || null,
      agenda: agenda || null, minutes_text: minutes_text || null
    })
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'CREATE', 'Sessions', `Added session: ${session_number || session_date}`)
  res.json({ success: true, id: data.id })
})

app.post('/api/session-minutes/upload-image', verifyToken, adminOnly, upload.single('file'), async (req, res) => {
  const { session_number, session_date, session_type, venue, agenda, ocr_target } = req.body
  if (!session_date) return res.status(400).json({ error: 'Session date is required.' })
  if (!req.file)     return res.status(400).json({ error: 'No file uploaded.' })
  try {
    const tempPath = path.join('/tmp', `${Date.now()}-${req.file.originalname}`)
    fs.writeFileSync(tempPath, req.file.buffer)
    const { data: { text } } = await Tesseract.recognize(tempPath, 'eng')
    fs.unlinkSync(tempPath)
    const extractedText = text.trim()
    const minutesText = ocr_target !== 'agenda' ? extractedText : (req.body.minutes_text || null)
    const agendaText  = ocr_target === 'agenda'  ? extractedText : (agenda || null)
    const { data, error } = await supabase
      .from('session_minutes')
      .insert({
        session_number: session_number || null, session_date,
        session_type: session_type || 'regular', venue: venue || null,
        agenda: agendaText, minutes_text: minutesText,
        filename: req.file.originalname, filetype: req.file.mimetype
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPLOAD', 'Sessions', `Uploaded session (OCR): ${session_number || session_date}`)
    res.json({ success: true, id: data.id, extracted_text: extractedText, ocr_target })
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

<<<<<<< HEAD
// ADMIN: Update session minutes
app.put('/api/session-minutes/:id', verifyToken, adminOnly, (req, res) => {
  const { id } = req.params
  const { session_number, session_date, session_type, venue, agenda, minutes_text } = req.body
  if (!session_date) return res.status(400).json({ error: 'Session date is required.' })
  db.query(
    'UPDATE session_minutes SET session_number=?, session_date=?, session_type=?, venue=?, agenda=?, minutes_text=? WHERE id=?',
    [session_number || null, session_date, session_type || 'regular', venue || null, agenda || null, minutes_text || null, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ success: true })
    }
  )
})

// ADMIN: Delete session minutes
app.delete('/api/session-minutes/:id', verifyToken, adminOnly, (req, res) => {
  const { id } = req.params
  db.query('SELECT filename FROM session_minutes WHERE id = ?', [id], (err, results) => {
    if (results && results.length > 0 && results[0].filename) {
      const fp = `./uploads/${results[0].filename}`
      if (fs.existsSync(fp)) fs.unlinkSync(fp)
    }
    db.query('DELETE FROM session_minutes WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err })
      res.json({ success: true })
    })
  })
})

// PUBLIC: Get all announcements
app.get('/api/announcements', (req, res) => {
  db.query('SELECT * FROM announcements ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// PUBLIC: Get single announcement
app.get('/api/announcements/:id', (req, res) => {
  db.query('SELECT * FROM announcements WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ error: 'Not found' });
    res.json(results[0]);
  });
});

// ADMIN: Create announcement
app.post('/api/announcements', verifyToken, adminOnly, (req, res) => {
  const { title, body, priority, expires_at } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required.' });
  db.query(
    'INSERT INTO announcements (title, body, priority, expires_at) VALUES (?, ?, ?, ?)',
    [title, body, priority || 'normal', expires_at || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// ADMIN: Update announcement
app.put('/api/announcements/:id', verifyToken, adminOnly, (req, res) => {
  const { title, body, priority, expires_at } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required.' });
  db.query(
    'UPDATE announcements SET title=?, body=?, priority=?, expires_at=? WHERE id=?',
    [title, body, priority || 'normal', expires_at || null, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ADMIN: Delete announcement
app.delete('/api/announcements/:id', verifyToken, adminOnly, (req, res) => {
  db.query('DELETE FROM announcements WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// GET all calendar events
app.get('/api/calendar-events', (req, res) => {
  db.query('SELECT * FROM calendar_events ORDER BY start_date ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST new calendar event
app.post('/api/calendar-events', verifyToken, adminOnly, (req, res) => {
  const { title, description, location, start_date, start_time, end_date, end_time, all_day, color } = req.body;
  if (!title || !start_date) return res.status(400).json({ error: 'Title and start date required' });
  db.query(
    'INSERT INTO calendar_events (title, description, location, start_date, start_time, end_date, end_time, all_day, color) VALUES (?,?,?,?,?,?,?,?,?)',
    [title, description, location, start_date, start_time || null, end_date || start_date, end_time || null, all_day ? 1 : 0, color || '#009439'],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// DELETE calendar event
app.delete('/api/calendar-events/:id', verifyToken, adminOnly, (req, res) => {
  db.query('DELETE FROM calendar_events WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(5000, () => console.log("Server running on port 5000"))
=======
app.put('/api/session-minutes/:id', verifyToken, adminOnly, async (req, res) => {
  const { id } = req.params
  const { session_number, session_date, session_type, venue, agenda, minutes_text } = req.body
  if (!session_date) return res.status(400).json({ error: 'Session date is required.' })
  const { error } = await supabase
    .from('session_minutes')
    .update({
      session_number: session_number || null, session_date,
      session_type: session_type || 'regular', venue: venue || null,
      agenda: agenda || null, minutes_text: minutes_text || null
    })
    .eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'UPDATE', 'Sessions', `Updated session ID: ${id}`)
  res.json({ success: true })
})

app.delete('/api/session-minutes/:id', verifyToken, adminOnly, async (req, res) => {
  const { error } = await supabase.from('session_minutes').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'DELETE', 'Sessions', `Deleted session ID: ${req.params.id}`)
  res.json({ success: true })
})

// ==================================================
// ---- ANNOUNCEMENTS ROUTES ----
// ==================================================

app.get('/api/announcements', async (req, res) => {
  const { data, error } = await supabase
    .from('announcements').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.get('/api/announcements/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('announcements').select('*').eq('id', req.params.id).single()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Not found' })
  res.json(data)
})

app.post('/api/announcements', verifyToken, adminOnly, async (req, res) => {
  const { title, body, priority, expires_at } = req.body
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required.' })
  const { data, error } = await supabase
    .from('announcements')
    .insert({ title, body, priority: priority || 'normal', expires_at: expires_at || null })
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'CREATE', 'Announcements', `Posted announcement: ${title}`)
  res.json({ success: true, id: data.id })
})

app.put('/api/announcements/:id', verifyToken, adminOnly, async (req, res) => {
  const { title, body, priority, expires_at } = req.body
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required.' })
  const { error } = await supabase
    .from('announcements')
    .update({ title, body, priority: priority || 'normal', expires_at: expires_at || null })
    .eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'UPDATE', 'Announcements', `Updated announcement: ${title}`)
  res.json({ success: true })
})

app.delete('/api/announcements/:id', verifyToken, adminOnly, async (req, res) => {
  const { data: old } = await supabase.from('announcements').select('title').eq('id', req.params.id).single()
  const { error } = await supabase.from('announcements').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'DELETE', 'Announcements', `Deleted announcement: ${old?.title || req.params.id}`)
  res.json({ success: true })
})

// ==================================================
// ---- CALENDAR EVENTS ROUTES ----
// ==================================================

app.get('/api/calendar-events', async (req, res) => {
  const { data, error } = await supabase
    .from('calendar_events').select('*').order('start_date', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/calendar-events', verifyToken, adminOnly, async (req, res) => {
  const { title, description, location, start_date, start_time, end_date, end_time, all_day, color } = req.body
  if (!title || !start_date) return res.status(400).json({ error: 'Title and start date required' })
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      title, description, location, start_date,
      start_time: start_time || null,
      end_date: end_date || start_date,
      end_time: end_time || null,
      all_day: all_day || false,
      color: color || '#009439'
    })
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'CREATE', 'Calendar', `Added event: ${title}`)
  res.json({ success: true, id: data.id })
})

app.put('/api/calendar-events/:id', verifyToken, adminOnly, async (req, res) => {
  const { title, description, location, start_date, start_time, end_date, end_time, all_day, color } = req.body
  if (!title || !start_date) return res.status(400).json({ error: 'Title and start date required' })
  const { error } = await supabase
    .from('calendar_events')
    .update({
      title, description, location, start_date,
      start_time: start_time || null,
      end_date: end_date || start_date,
      end_time: end_time || null,
      all_day: all_day || false,
      color: color || '#009439'
    })
    .eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'UPDATE', 'Calendar', `Updated event: ${title}`)
  res.json({ success: true })
})

app.delete('/api/calendar-events/:id', verifyToken, adminOnly, async (req, res) => {
  const { error } = await supabase.from('calendar_events').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  await logActivity(req, 'DELETE', 'Calendar', `Deleted event ID: ${req.params.id}`)
  res.json({ success: true })
})


// ==================================================
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
