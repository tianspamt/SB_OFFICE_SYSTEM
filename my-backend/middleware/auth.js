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
      .from('users').select('is_archived, role, position').eq('id', decoded.id).single()
    if (!user)
      return res.status(401).json({ error: 'Account not found.' })
    if (user.is_archived)
      return res.status(401).json({ error: 'This account has been archived.' })
    // role/position are re-read live rather than trusted from the JWT
    // payload, so a permission change (de-admin'ing someone, reassigning
    // their position) takes effect on their very next request instead of
    // waiting out the token's up-to-8h lifetime.
    req.user = { ...decoded, role: user.role, position: user.position }
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

// Legislative-records RBAC: who may create a brand-new draft. All four
// positions can originate one — Clerk/Councilor are the primary drafters,
// but Secretary and Vice-Mayor both sometimes draft the ordinance/
// resolution/session minutes directly rather than only reviewing/approving
// what someone else submitted.
const canCreateDraft = (req, res, next) => {
  if (!['secretary', 'clerk', 'councilor', 'vice_mayor'].includes(req.user?.position))
    return res.status(403).json({ error: 'Secretary, Clerk, Councilor, or Vice-Mayor only.' })
  next()
}

// Legislative-records RBAC: who may replace/revise a not-yet-published
// record's file. Clerk and Councilor are the primary drafters; Secretary
// also fixes records directly often enough that they're included rather
// than treated as a review-only fallback. Vice-Mayor is not — their role
// stays limited to approving, not editing draft content.
const pendingEditors = (req, res, next) => {
  if (!['secretary', 'clerk', 'councilor'].includes(req.user?.position))
    return res.status(403).json({ error: 'Secretary, Clerk, or Councilor only.' })
  next()
}

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() })
  next()
}

module.exports = {
  verifyToken, adminOnly, secretaryOnly, secretaryOrClerk, clerkOnly, viceMayorOnly,
  canCreateDraft, pendingEditors, validate,
}