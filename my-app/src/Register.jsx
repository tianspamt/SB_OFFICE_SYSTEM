import { useState } from 'react'
import './LogIn.css' // reuse your existing styles or create Register.css

export default function Register() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Full name is required.'
    if (!form.username.trim()) newErrors.username = 'Username is required.'
    if (!form.email.trim()) {
      newErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address.'
    }
    if (!form.password) {
      newErrors.password = 'Password is required.'
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.'
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.'
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.'
    }
    return newErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
      } else {
        setServerError(data.error || 'Registration failed. Please try again.')
      }
    } catch (err) {
      setServerError('Could not connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="wrapper">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: '#1a365d' }}>✅ Registration Successful!</h2>
          <p style={{ marginTop: '12px' }}>Your account has been created.</p>
          <a href="/" style={{ display: 'inline-block', marginTop: '20px', color: '#1a365d', fontWeight: 'bold' }}>
            ← Back to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="wrapper">
      <form onSubmit={handleSubmit}>
        <h1>OFFICE OF SANGGUNIANG BAYAN</h1>
        <img src="src/assets/image/logo.png" alt="logo" />
        <h2>Create your account</h2>

        {/* Full Name */}
        <div className={`input-box ${errors.name ? 'input-error' : ''}`}>
          <input
            type="text"
            name="name"
            placeholder={errors.name || 'Full Name'}
            value={form.name}
            onChange={handleChange}
          />
          <i className='bx bxs-user-detail'></i>
        </div>

        {/* Username */}
        <div className={`input-box ${errors.username ? 'input-error' : ''}`}>
          <input
            type="text"
            name="username"
            placeholder={errors.username || 'Username'}
            value={form.username}
            onChange={handleChange}
          />
          <i className='bx bxs-user'></i>
        </div>

        {/* Email */}
        <div className={`input-box ${errors.email ? 'input-error' : ''}`}>
          <input
            type="email"
            name="email"
            placeholder={errors.email || 'Email Address'}
            value={form.email}
            onChange={handleChange}
          />
          <i className='bx bxs-envelope'></i>
        </div>

        {/* Password */}
        <div className={`input-box ${errors.password ? 'input-error' : ''}`}>
          <input
            type="password"
            name="password"
            placeholder={errors.password || 'Password'}
            value={form.password}
            onChange={handleChange}
          />
          <i className='bx bxs-lock-alt'></i>
        </div>

        {/* Confirm Password */}
        <div className={`input-box ${errors.confirmPassword ? 'input-error' : ''}`}>
          <input
            type="password"
            name="confirmPassword"
            placeholder={errors.confirmPassword || 'Confirm Password'}
            value={form.confirmPassword}
            onChange={handleChange}
          />
          <i className='bx bxs-lock'></i>
        </div>

        {serverError && (
          <p style={{ color: 'red', fontSize: '13px', marginTop: '6px' }}>{serverError}</p>
        )}

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>

        <div className="register-link">
          <p>Already have an account? <a href="/">Login</a></p>
        </div>
      </form>
    </div>
  )
}