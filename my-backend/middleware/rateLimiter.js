const rateLimit = require('express-rate-limit')

// 100/15min was sized for occasional API hits, not an SPA dashboard that
// polls several endpoints (pending queues across three modules, comments,
// council members, etc.) on every tab switch — real interactive use was
// tripping it well before anything resembling abuse. Raised to something
// that comfortably covers a busy multi-tab admin session; still keyed by IP,
// so an office sharing one public IP gets one shared budget, not per-user —
// if that becomes a problem, key by req.user.id for authenticated requests
// instead of raising this further.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
})

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests. Please wait 10 minutes.' }
})

// Covers both /register (public, so the more exposed of the two) and
// /admin/add (already authenticated + admin-gated, but account-creation
// endpoints deserve tighter throttling than the generic global limiter
// regardless — 10/hour still comfortably covers onboarding several staff
// accounts in one sitting).
const accountCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many account-creation requests. Please try again later.' }
})

module.exports = { globalLimiter, loginLimiter, otpLimiter, accountCreationLimiter }
