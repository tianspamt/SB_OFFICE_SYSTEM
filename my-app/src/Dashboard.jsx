import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { window.location.replace('/'); return; }
    const parsed = JSON.parse(stored)
    if (parsed.role !== 'user') { window.location.replace('/'); return; }
    setUser(parsed)
  }, [])

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