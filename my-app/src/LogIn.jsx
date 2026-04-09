import { useState } from 'react'
import './LogIn.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [identifierError, setIdentifierError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)

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
        if (data.user.role === 'admin') {
          window.location.href = '/admin/dashboard'
        } else {
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
          <i className='bx bxs-user'></i>
        </div>

        <div className={`input-box ${passwordError ? 'input-error' : ''}`}>
          <input
            type="password"
            placeholder={passwordError ? 'Password is required' : 'Password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (e.target.value) setPasswordError(false)
            }}
          />
          <i className='bx bxs-lock-alt'></i>
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
          <p>Don't have an account? <a href="/register">Register</a></p>
        </div>
      </form>
    </div>
  )
}