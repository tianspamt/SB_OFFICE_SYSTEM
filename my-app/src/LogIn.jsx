import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import './LogIn.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Login() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [identifierError, setIdentifierError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Set when authFetch (AdminContext.jsx) bounced here after a 401 — an
  // expired (8h) or otherwise invalid token. Without this, landing back on
  // a bare login form after being kicked out mid-session looks like the app
  // just broke, not like the deliberate security behavior it actually is.
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState('')
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('sessionExpired') === '1') {
      setSessionExpiredMsg('Your session has expired. Please log in again.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    let hasError = false
    if (!identifier) { setIdentifierError(true); hasError = true } else setIdentifierError(false)
    if (!password)   { setPasswordError(true);   hasError = true } else setPasswordError(false)
    if (hasError) return

    try {
      setLoading(true)
      setLoginError('')

      const response = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        navigate('/dashboard')
      } else {
        setLoginError(data.message || 'Invalid credentials.')
      }
    } catch (err) {
      console.error('Error:', err)
      setLoginError('Could not connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const BrandPanel = () => (
    <div className="login-left">
      <img src="src/assets/image/logo.png" alt="logo" className="brand-logo" />
      <h1 className="system-name">eLEGIS</h1>
      <p className="brand-sub">OFFICE OF SANGGUNIANG BAYAN</p>
      <p className="brand-tagline">Legislative Management System of Balilihan, Bohol</p>
    </div>
  )

  return (
    <div className="login-page">
      <BrandPanel />
      <div className="login-right">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="welcome-title">Welcome Back</h2>
          <p className="welcome-sub">Sign in to access your dashboard and manage legislative records.</p>

          {sessionExpiredMsg && (
            <p className="form-notice">{sessionExpiredMsg}</p>
          )}

          <label className="field-label">Username or Email</label>
          <div className={`input-box ${identifierError ? 'input-error' : ''}`}>
            <User className="input-icon-left" size={18} />
            <input
              type="text"
              placeholder={identifierError ? 'Username or email is required' : 'Username or Email'}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value)
                if (e.target.value) setIdentifierError(false)
              }}
            />
          </div>

          <label className="field-label">Password</label>
          <div className={`input-box ${passwordError ? 'input-error' : ''}`}>
            <Lock className="input-icon-left" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={passwordError ? 'Password is required' : 'Password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (e.target.value) setPasswordError(false)
              }}
            />
            {showPassword ? (
              <EyeOff
                className="input-icon-right toggle-password"
                size={18}
                onClick={() => setShowPassword(false)}
                role="button"
                tabIndex={0}
                aria-label="Hide password"
              />
            ) : (
              <Eye
                className="input-icon-right toggle-password"
                size={18}
                onClick={() => setShowPassword(true)}
                role="button"
                tabIndex={0}
                aria-label="Show password"
              />
            )}
          </div>

          {loginError && <p className="form-error">{loginError}</p>}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
