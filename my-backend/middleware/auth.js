const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')

const JWT_SECRET = process.env.JWT_SECRET

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided.' })
  try {
    req.user = jwt.verify(token, JWT_SECRET, {
      issuer: 'sangguniang-bayan-system',
      audience: 'sb-client'
    })
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Admins only.' })
  next()
}

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() })
  next()
}

module.exports = { verifyToken, adminOnly, validate }