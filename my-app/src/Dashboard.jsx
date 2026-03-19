import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      if (!stored || !token) { window.location.replace('/'); return; }
      const parsed = JSON.parse(stored)
      if (parsed.role !== 'user') { window.location.replace('/'); return; }
      setUser(parsed)
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.replace('/')
    }
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