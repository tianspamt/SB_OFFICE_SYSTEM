const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const supabase = require('../config/supabase')

const JWT_SECRET = process.env.JWT_SECRET

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided.' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'sangguniang-bayan-system',
      audience: 'sb-client'
    })
    const { data: user } = await supabase
      .from('users').select('is_archived').eq('id', decoded.id).single()
    if (user?.is_archived)
      return res.status(401).json({ error: 'This account has been archived.' })
    req.user = decoded
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

const secretaryOnly = (req, res, next) => {
  if (req.user?.position !== 'secretary')
    return res.status(403).json({ error: 'Secretary only.' })
  next()
}

const secretaryOrClerk = (req, res, next) => {
  if (!['secretary', 'clerk'].includes(req.user?.position))
    return res.status(403).json({ error: 'Secretary or Clerk only.' })
  next()
}

const clerkOnly = (req, res, next) => {
  if (req.user?.position !== 'clerk')
    return res.status(403).json({ error: 'Clerk only.' })
  next()
}

const viceMayorOnly = (req, res, next) => {
  if (req.user?.position !== 'vice_mayor')
    return res.status(403).json({ error: 'Vice-Mayor only.' })
  next()
}

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() })
  next()
}

module.exports = { verifyToken, adminOnly, secretaryOnly, secretaryOrClerk, clerkOnly, viceMayorOnly, validate }