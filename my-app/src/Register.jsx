import { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const theme = {
  green: '#2e7d32',
  greenHover: '#1b5e20',
  yellow: '#f9a825',
  inputBg: '#eaf4fb',
  border: '#b0bec5',
  white: '#ffffff',
  textDark: '#1a1a1a',
  textMuted: '#555',
}

// ── Success Modal ─────────────────────────────────────────────
function SuccessModal({ onBack }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: theme.white, borderRadius: 16,
        padding: '2.5rem 2rem', width: 320,
        textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          width: 70, height: 70, borderRadius: '50%',
          background: '#e8f5e9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke={theme.green} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ color: theme.green, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Registration Successful!
        </h2>
        <p style={{ color: theme.textMuted, fontSize: 14, marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Your account has been created.<br />You can now log in.
        </p>
        <button
          onClick={onBack}
          style={{
            width: '100%', padding: '12px 0',
            background: theme.green, color: theme.white,
            border: 'none', borderRadius: 30,
            fontWeight: 700, fontSize: 15, cursor: 'pointer'
          }}
          onMouseOver={e => e.target.style.background = theme.greenHover}
          onMouseOut={e => e.target.style.background = theme.green}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  )
}

// ── OTP Modal ─────────────────────────────────────────────────
function OtpModal({ email, onVerified, onClose }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    setError('')
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus()
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      document.getElementById('otp-5')?.focus()
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        onVerified()
      } else {
        setError(data.error || 'Invalid code. Please try again.')
        setOtp(['', '', '', '', '', ''])
        document.getElementById('otp-0')?.focus()
      }
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      setResending(true)
      setResent(false)
      setError('')
      setOtp(['', '', '', '', '', ''])
      const res = await fetch(`${API}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setResent(true)
      } else {
        setError(data.error || 'Failed to resend. Please try again.')
      }
    } catch {
      setError('Could not connect to server.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: theme.white, borderRadius: 16,
        padding: '2.5rem 2rem', width: 340,
        textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#e8f5e9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
            stroke={theme.green} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <h2 style={{ color: theme.green, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          Verify your Email
        </h2>
        <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: '1.5rem', lineHeight: 1.6 }}>
          We sent a 6-digit code to<br />
          <strong style={{ color: theme.textDark }}>{email}</strong>
        </p>

        {/* OTP Boxes */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={{
                width: 42, height: 50,
                textAlign: 'center',
                fontSize: 22, fontWeight: 700,
                borderRadius: 10,
                border: error
                  ? '2px solid #e53935'
                  : `1.5px solid ${theme.border}`,
                background: theme.inputBg,
                color: theme.textDark,
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={e => e.target.style.border = `2px solid ${theme.green}`}
              onBlur={e => e.target.style.border = error
                ? '2px solid #e53935'
                : `1.5px solid ${theme.border}`}
            />
          ))}
        </div>

        {error && (
          <p style={{ color: '#e53935', fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}
        {resent && (
          <p style={{ color: theme.green, fontSize: 13, marginBottom: 12 }}>
            A new code has been sent!
          </p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          style={{
            width: '100%', padding: '12px 0',
            background: loading ? '#a5d6a7' : theme.green,
            color: theme.white, border: 'none',
            borderRadius: 30, fontWeight: 700,
            fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 12
          }}
          onMouseOver={e => { if (!loading) e.target.style.background = theme.greenHover }}
          onMouseOut={e => { if (!loading) e.target.style.background = theme.green }}
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>

        <p style={{ fontSize: 13, color: theme.textMuted, margin: 0 }}>
          Didn't receive a code?{' '}
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: 'none', border: 'none',
              color: theme.green, fontWeight: 700,
              cursor: resending ? 'not-allowed' : 'pointer',
              fontSize: 13, padding: 0
            }}
          >
            {resending ? 'Sending...' : 'Resend'}
          </button>
        </p>

        <button
          onClick={onClose}
          style={{
            marginTop: 10, background: 'none', border: 'none',
            color: theme.textMuted, fontSize: 12,
            cursor: 'pointer', textDecoration: 'underline'
          }}
        >
          Cancel — change email
        </button>
      </div>
    </div>
  )
}

// ── Main Register Component ───────────────────────────────────
export default function Register() {
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form') // 'form' | 'otp' | 'success'

  const validate = () => {
    const e = {}
    if (!form.name.trim())
      e.name = 'Full name is required.'
    if (!form.username.trim())
      e.username = 'Username is required.'
    if (!form.email.trim())
      e.email = 'Email is required.'
    else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(form.email.trim()))
      e.email = 'Only Gmail addresses (@gmail.com) are allowed.'
    if (!form.password)
      e.password = 'Password is required.'
    else if (form.password.length < 8)
      e.password = 'Password must be at least 8 characters.'
    else if (!/[A-Z]/.test(form.password))
      e.password = 'Password must contain at least 1 uppercase letter.'
    else if (!/\d/.test(form.password))
      e.password = 'Password must contain at least 1 number.'
    if (!form.confirmPassword)
      e.confirmPassword = 'Please confirm your password.'
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match.'
    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  // Step 1 — validate then send OTP
  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    try {
      setSendingOtp(true)
      const res = await fetch(`${API}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim() })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStep('otp')
      } else {
        setServerError(data.error || 'Failed to send verification code.')
      }
    } catch {
      setServerError('Could not connect to server. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  // Step 2 — OTP verified, now register
  const handleOtpVerified = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email.trim(),
          password: form.password
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStep('success')
      } else {
        setServerError(data.error || 'Registration failed. Please try again.')
        setStep('form')
      }
    } catch {
      setServerError('Could not connect to server. Please try again.')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'name',            type: 'text',     placeholder: 'Full Name'        },
    { name: 'username',        type: 'text',     placeholder: 'Username'          },
    { name: 'email',           type: 'email',    placeholder: 'Email Address (@gmail.com)' },
    { name: 'password',        type: 'password', placeholder: 'Password (min 8 chars, 1 uppercase, 1 number)' },
    { name: 'confirmPassword', type: 'password', placeholder: 'Confirm Password'  },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#f5f5f5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Segoe UI, Arial, sans-serif'
    }}>
      {/* Modals */}
      {step === 'otp' && (
        <OtpModal
          email={form.email.trim()}
          onVerified={handleOtpVerified}
          onClose={() => setStep('form')}
        />
      )}
      {step === 'success' && (
        <SuccessModal onBack={() => window.location.href = '/'} />
      )}

      {/* Form Card */}
      <div style={{
        background: theme.white, borderRadius: 16,
        padding: '2.5rem 2rem', width: '100%', maxWidth: 420,
        boxShadow: '0 4px 32px rgba(0,0,0,0.10)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            color: theme.green, fontSize: 17, fontWeight: 800,
            letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 12px'
          }}>
            Office of Sangguniang Bayan
          </h1>
          <img
            src="src/assets/image/logo.png"
            alt="logo"
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
          />
          <p style={{ color: theme.textMuted, fontSize: 14, marginTop: 12, marginBottom: 0 }}>
            Create your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {fields.map(({ name, type, placeholder }) => (
            <div key={name} style={{ marginBottom: 14 }}>
              <input
                type={type}
                name={name}
                placeholder={errors[name] || placeholder}
                value={form[name]}
                onChange={handleChange}
                style={{
                  width: '100%', padding: '13px 18px',
                  borderRadius: 30,
                  border: errors[name]
                    ? '1.5px solid #e53935'
                    : `1.5px solid ${theme.border}`,
                  background: theme.inputBg,
                  fontSize: 14,
                  color: errors[name] ? '#e53935' : theme.textDark,
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.border = `1.5px solid ${theme.green}`}
                onBlur={e => {
                  e.target.style.border = errors[name]
                    ? '1.5px solid #e53935'
                    : `1.5px solid ${theme.border}`
                }}
              />
            </div>
          ))}

          {serverError && (
            <p style={{ color: '#e53935', fontSize: 13, marginBottom: 10, marginTop: 0 }}>
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={sendingOtp}
            style={{
              width: '100%', padding: '13px 0',
              background: sendingOtp ? '#a5d6a7' : theme.green,
              color: theme.white, border: 'none',
              borderRadius: 30, fontWeight: 700,
              fontSize: 15, cursor: sendingOtp ? 'not-allowed' : 'pointer',
              letterSpacing: 0.5, marginTop: 4,
              transition: 'background 0.2s'
            }}
            onMouseOver={e => { if (!sendingOtp) e.target.style.background = theme.greenHover }}
            onMouseOut={e => { if (!sendingOtp) e.target.style.background = theme.green }}
          >
            {sendingOtp ? 'Sending Code...' : 'Register'}
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 14, marginBottom: 0 }}>
          <span style={{ color: theme.yellow }}>Already have an account? </span>
          <a href="/" style={{ color: theme.green, fontWeight: 700, textDecoration: 'none' }}>
            Login
          </a>
        </p>
      </div>
    </div>
  )
}