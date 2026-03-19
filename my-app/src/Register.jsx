import { useState } from 'react'
import './LogIn.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim())
      e.name = 'Full name is required.'
    if (!form.username.trim())
      e.username = 'Username is required.'
    if (!form.email.trim())
      e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address.'
    if (!form.password)
      e.password = 'Password is required.'
    else if (form.password.length < 6)
      e.password = 'Password must be at least 6 characters.'
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
      const response = await fetch(`${API}/api/register`, {
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
          <div style={{
            width: 70, height: 70, borderRadius: '50%',
            background: '#d1fae5', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <i className='bx bx-check' style={{ fontSize: 36, color: '#10b981' }}></i>
          </div>
          <h2 style={{ color: '#1a365d', marginBottom: 10 }}>Registration Successful!</h2>
          <p style={{ color: '#718096', fontSize: 14 }}>Your account has been created.</p>
          <a href="/" style={{
            display: 'inline-block', marginTop: 24,
            padding: '10px 28px', background: '#1a365d',
            color: '#fff', borderRadius: 8, textDecoration: 'none',
            fontWeight: 600, fontSize: 14
          }}>
            ← Back to Login
          </a>
        </div>
      </div>
    )
  }

  const fields = [
    { name: 'name',            type: 'text',     placeholder: 'Full Name',       icon: 'bxs-user-detail' },
    { name: 'username',        type: 'text',     placeholder: 'Username',         icon: 'bxs-user'        },
    { name: 'email',           type: 'email',    placeholder: 'Email Address',    icon: 'bxs-envelope'    },
    { name: 'password',        type: 'password', placeholder: 'Password',         icon: 'bxs-lock-alt'    },
    { name: 'confirmPassword', type: 'password', placeholder: 'Confirm Password', icon: 'bxs-lock'        },
  ]

  return (
    <div className="wrapper">
      <form onSubmit={handleSubmit}>
        <h1>OFFICE OF SANGGUNIANG BAYAN</h1>
        <img src="src/assets/image/logo.png" alt="logo" />
        <h2>Create your account</h2>

        {fields.map(({ name, type, placeholder, icon }) => (
          <div key={name} className={`input-box ${errors[name] ? 'input-error' : ''}`}>
            <input
              type={type}
              name={name}
              placeholder={errors[name] || placeholder}
              value={form[name]}
              onChange={handleChange}
            />
            <i className={`bx ${icon}`}></i>
          </div>
        ))}

        {serverError && (
          <p style={{ color: 'red', fontSize: '13px', marginTop: '6px' }}>
            {serverError}
          </p>
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