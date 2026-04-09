const SALT_ROUNDS = 10;

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') })
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const mysql = require("mysql2")
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Tesseract = require('tesseract.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


const app = express()
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
}))
app.use(bodyParser.json())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only images and PDFs are allowed'))
  }
})

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
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' })
  }
}

// ---- MIDDLEWARE: Admin only ----
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' })
  next()
}

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
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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
  const { id } = req.params
  const { email } = req.body
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden.' })
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
})

app.post('/api/ordinances/upload-image-text', verifyToken, adminOnly, upload.single('file'), async (req, res) => {
  const { ordinance_number, title, year, officials } = req.body
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
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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