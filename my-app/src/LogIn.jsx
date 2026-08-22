import { useState } from 'react'
import { User, Eye, EyeOff } from 'lucide-react'
import './LogIn.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [identifierError, setIdentifierError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Set when the account has must_change_password flagged (e.g. after an
  // admin-forced password reset) — holds the just-issued token/user in
  // memory only, nothing goes to localStorage until a real password is set,
  // so a forced-change is never skippable by just closing this screen.
  const [forcedChange, setForcedChange] = useState(null) // { token, user }
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changeError, setChangeError] = useState('')
  const [changing, setChanging] = useState(false)

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
        if (data.user.mustChangePassword) {
          setForcedChange({ token: data.token, user: data.user })
        } else {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          window.location.href = '/dashboard'
        }
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

  const handleForcedChange = async (e) => {
    e.preventDefault()
    setChangeError('')
    if (!newPassword || !confirmPassword) { setChangeError('Both fields are required.'); return }
    if (newPassword !== confirmPassword) { setChangeError('Passwords do not match.'); return }

    try {
      setChanging(true)
      // currentPassword is the temp password they just logged in with —
      // required because changing your OWN password always needs it
      // (see users.js PUT /:id/password).
      const response = await fetch(`${API}/api/users/${forcedChange.user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${forcedChange.token}` },
        body: JSON.stringify({ currentPassword: password, newPassword })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        localStorage.setItem('token', forcedChange.token)
        localStorage.setItem('user', JSON.stringify({ ...forcedChange.user, mustChangePassword: false }))
        window.location.href = '/dashboard'
      } else {
        setChangeError(data.error || data.errors?.[0]?.msg || 'Failed to change password.')
      }
    } catch (err) {
      console.error('Error:', err)
      setChangeError('Could not connect to server. Please try again.')
    } finally {
      setChanging(false)
    }
  }

  if (forcedChange) {
    return (
      <div className="wrapper">
        <form onSubmit={handleForcedChange}>
          <h1>OFFICE OF SANGGUNIANG BAYAN</h1>
          <img src="src/assets/image/logo.png" alt="logo" />
          <h2>Set a new password to continue</h2>
          <p style={{ fontSize: '13px', color: '#555', marginTop: '-8px', marginBottom: '12px' }}>
            Your password was reset by an administrator. Choose a new password before continuing.
          </p>

          <div className="input-box">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="input-box">
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {changeError && (
            <p style={{ color: 'red', fontSize: '13px', marginTop: '6px' }}>
              {changeError}
            </p>
          )}

          <button type="submit" className="btn" disabled={changing}>
            {changing ? 'Saving...' : 'Set New Password'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="wrapper">
      <form onSubmit={handleSubmit}>
        <h1>OFFICE OF SANGGUNIANG BAYAN</h1>
        <img src="src/assets/image/logo.png" alt="logo" />
        <h2>Log in with your username or email</h2>

        <div className={`input-box ${identifierError ? 'input-error' : ''}`}>
          <input
            type="text"
            placeholder={identifierError ? 'Username or email is required' : 'Username or Email'}
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value)
              if (e.target.value) setIdentifierError(false)
            }}
          />
          <User className="input-icon" size={20} />
        </div>

        <div className={`input-box ${passwordError ? 'input-error' : ''}`}>
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
              className="input-icon toggle-password"
              size={20}
              onClick={() => setShowPassword(false)}
              role="button"
              tabIndex={0}
              aria-label="Hide password"
            />
          ) : (
            <Eye
              className="input-icon toggle-password"
              size={20}
              onClick={() => setShowPassword(true)}
              role="button"
              tabIndex={0}
              aria-label="Show password"
            />
          )}
        </div>

        {loginError && (
          <p style={{ color: 'red', fontSize: '13px', marginTop: '6px' }}>
            {loginError}
          </p>
        )}

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="register-link">
          <p>Official Legislative Management System of the Sangguniang Bayan ng Balilihan, Bohol</p>
        </div>
      </form>
    </div>
  )
}