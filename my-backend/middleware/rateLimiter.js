const rateLimit = require('express-rate-limit')

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
