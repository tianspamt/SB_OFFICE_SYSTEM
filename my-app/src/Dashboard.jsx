import { useEffect, useState } from 'react'

// The logged-in 'user'-role account from localStorage, or null if there is
// none (or it's another role). Corrupt stored data is cleared.
function readStoredUser() {
  try {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!stored || !token) return null
    const parsed = JSON.parse(stored)
    return parsed.role === 'user' ? parsed : null
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return null
  }
}

export default function Dashboard() {
  // Read once on first render instead of in an effect, so there's no extra
  // render with user = null before the real value arrives.
  const [user] = useState(readStoredUser)

  useEffect(() => {
    if (!user) window.location.replace('/')
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.replace('/')
  }

  return (
    <div>
      <h1>User Dashboard</h1>
      <p>Welcome, {user?.name || 'User'}!</p>
      <button onClick={handleLogout}>Log out</button>
    </div>
  )
}