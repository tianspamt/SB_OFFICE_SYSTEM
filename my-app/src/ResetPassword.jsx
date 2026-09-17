import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, Check, X, AlertCircle, CheckCircle2 } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Public page reached via the link emailed by an admin-initiated reset
// (POST /api/users/:id/reset-password) — no login required, the token in
// the URL is itself the credential (see routes/auth.js's
// GET/POST /api/reset-password/:token). Deliberately its own centered card
// rather than the split-panel LogIn.jsx layout — this is a one-off action
// from an email link, not a branded entry point into the app.
export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  // 'checking' | 'valid' | 'invalid' | 'done'
  const [status, setStatus] = useState('checking')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }
    fetch(`${API}/api/reset-password/${token}`)
      .then((res) => res.json())
      .then((data) => setStatus(data.success ? 'valid' : 'invalid'))
      .catch(() => setStatus('invalid'))
  }, [token])

  // Mirrors the backend's own rule exactly (routes/auth.js's
  // POST /reset-password/:token validator) so the checklist never claims
  // "good" for something the server will still reject.
  const rules = useMemo(
    () => [
      { key: 'upper', label: 'At least 1 uppercase', met: /[A-Z]/.test(newPassword) },
      { key: 'number', label: 'At least 1 number', met: /\d/.test(newPassword) },
      { key: 'length', label: 'At least 8 characters', met: newPassword.length >= 8 },
    ],
    [newPassword]
  )
  const metCount = rules.filter((r) => r.met).length
  const strength =
    newPassword.length === 0
      ? null
      : metCount <= 1
      ? { label: 'Weak', color: '#ef4444' }
      : metCount === 2
      ? { label: 'Medium', color: '#f59e0b' }
      : { label: 'Strong', color: '#22c55e' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!currentPassword || !newPassword || !confirmPassword) { setError('All fields are required.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    if (metCount < rules.length) { setError('Password does not meet all requirements.'); return }

    try {
      setSubmitting(true)
      const res = await fetch(`${API}/api/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatus('done')
      } else {
        setError(data.error || data.errors?.[0]?.msg || 'Failed to reset password.')
      }
    } catch {
      setError('Could not connect to server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        .rp-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          padding: 24px 16px;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .rp-card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          width: 100%;
          max-width: 400px;
          padding: 28px;
        }
        .rp-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }
        .rp-icon-wrap {
          width: 42px; height: 42px;
          border-radius: 10px;
          background: #eef2ff;
          color: #090446;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .rp-title { margin: 0; font-size: 16px; font-weight: 700; color: #1a1a2e; }
        .rp-subtitle { margin: 2px 0 0; font-size: 12.5px; color: #6b7280; }
        .rp-field { margin-bottom: 16px; }
        .rp-label-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 6px;
        }
        .rp-label { font-size: 13px; font-weight: 600; color: #374151; }
        .rp-required { color: #ef4444; }
        .rp-clear {
          font-size: 12px; color: #6366f1; background: none; border: none;
          cursor: pointer; font-family: inherit; padding: 0;
        }
        .rp-input-box {
          position: relative;
          display: flex; align-items: center;
        }
        .rp-input-box input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 40px 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 9px;
          font-size: 14px;
          font-family: inherit;
        }
        .rp-input-box input:focus { outline: none; border-color: #6366f1; }
        .rp-eye-btn {
          position: absolute; right: 10px;
          background: none; border: none; cursor: pointer;
          color: #9ca3af; display: flex; padding: 0;
        }
        .rp-strength-track {
          height: 5px; border-radius: 3px; background: #e5e7eb;
          margin-top: 10px; overflow: hidden;
        }
        .rp-strength-fill {
          height: 100%; border-radius: 3px;
          transition: width 0.2s ease, background 0.2s ease;
        }
        .rp-strength-label { font-size: 12px; margin-top: 6px; font-weight: 600; }
        .rp-rules { margin: 4px 0 20px; display: flex; flex-direction: column; gap: 6px; }
        .rp-rule { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: #9ca3af; }
        .rp-rule-met { color: #22c55e; }
        .rp-rule-dot {
          width: 15px; height: 15px; border-radius: 50%;
          border: 1.5px solid #d1d5db; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .rp-rule-met .rp-rule-dot { border-color: #22c55e; background: #22c55e; color: #fff; }
        .rp-error {
          font-size: 12.5px; color: #ef4444; margin: -6px 0 16px;
          display: flex; align-items: center; gap: 6px;
        }
        .rp-actions { display: flex; gap: 10px; margin-top: 4px; }
        .rp-btn {
          flex: 1; padding: 11px; border-radius: 9px; font-size: 14px;
          font-weight: 600; cursor: pointer; font-family: inherit; border: none;
          transition: opacity 0.15s;
        }
        .rp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .rp-btn-secondary { background: #f3f4f6; color: #374151; }
        .rp-btn-secondary:hover:not(:disabled) { background: #e5e7eb; }
        .rp-btn-primary { background: #090446; color: #fff; }
        .rp-btn-primary:hover:not(:disabled) { background: #000058; }
        .rp-status-icon { display: flex; justify-content: center; margin-bottom: 16px; }
        .rp-status-text { text-align: center; font-size: 13.5px; color: #6b7280; margin: 0 0 20px; line-height: 1.6; }
        .rp-status-title { text-align: center; font-size: 17px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; }
      `}</style>

      <div className="rp-page">
        {status === 'checking' && (
          <div className="rp-card" style={{ textAlign: 'center' }}>
            <p className="rp-status-text" style={{ margin: 0 }}>Checking your link…</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="rp-card">
            <div className="rp-status-icon">
              <AlertCircle size={40} color="#ef4444" />
            </div>
            <p className="rp-status-title">Link Expired or Invalid</p>
            <p className="rp-status-text">
              This password reset link is no longer valid. Ask an administrator to send you a new one.
            </p>
            <button type="button" className="rp-btn rp-btn-primary" style={{ width: '100%' }} onClick={() => navigate('/')}>
              Back to Login
            </button>
          </div>
        )}

        {status === 'done' && (
          <div className="rp-card">
            <div className="rp-status-icon">
              <CheckCircle2 size={40} color="#22c55e" />
            </div>
            <p className="rp-status-title">Password Reset</p>
            <p className="rp-status-text">
              Your password has been updated. You can now log in with your new password.
            </p>
            <button type="button" className="rp-btn rp-btn-primary" style={{ width: '100%' }} onClick={() => navigate('/')}>
              Go to Login
            </button>
          </div>
        )}

        {status === 'valid' && (
          <form className="rp-card" onSubmit={handleSubmit}>
            <div className="rp-header">
              <div className="rp-icon-wrap">
                <Lock size={20} />
              </div>
              <div>
                <p className="rp-title">Reset Password</p>
                <p className="rp-subtitle">Choose a new password for your account.</p>
              </div>
            </div>

            <div className="rp-field">
              <div className="rp-label-row">
                <span className="rp-label">Current Password <span className="rp-required">*</span></span>
              </div>
              <div className="rp-input-box">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoFocus
                />
                <button type="button" className="rp-eye-btn" onClick={() => setShowCurrent((v) => !v)} tabIndex={-1}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="rp-field">
              <div className="rp-label-row">
                <span className="rp-label">New Password <span className="rp-required">*</span></span>
              </div>
              <div className="rp-input-box">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="button" className="rp-eye-btn" onClick={() => setShowNew((v) => !v)} tabIndex={-1}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="rp-field">
              <div className="rp-label-row">
                <span className="rp-label">Confirm New Password <span className="rp-required">*</span></span>
                {confirmPassword && (
                  <button type="button" className="rp-clear" onClick={() => setConfirmPassword('')}>
                    Clear
                  </button>
                )}
              </div>
              <div className="rp-input-box">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="button" className="rp-eye-btn" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {strength && (
                <>
                  <div className="rp-strength-track">
                    <div
                      className="rp-strength-fill"
                      style={{ width: `${(metCount / rules.length) * 100}%`, background: strength.color }}
                    />
                  </div>
                  <p className="rp-strength-label" style={{ color: strength.color }}>
                    {strength.label} password. Must contain:
                  </p>
                </>
              )}
            </div>

            <div className="rp-rules">
              {rules.map((r) => (
                <div key={r.key} className={`rp-rule ${r.met ? 'rp-rule-met' : ''}`}>
                  <span className="rp-rule-dot">{r.met && <Check size={10} strokeWidth={3} />}</span>
                  {r.label}
                </div>
              ))}
            </div>

            {error && (
              <p className="rp-error">
                <X size={14} /> {error}
              </p>
            )}

            <div className="rp-actions">
              <button type="button" className="rp-btn rp-btn-secondary" onClick={() => navigate('/')} disabled={submitting}>
                Discard
              </button>
              <button type="submit" className="rp-btn rp-btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Apply Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
