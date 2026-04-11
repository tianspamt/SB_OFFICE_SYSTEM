import { createContext, useContext, useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const PRIORITY = {
  urgent: { label: 'Urgent', color: '#c53030', bg: '#fff5f5', border: '#feb2b2' },
  high:   { label: 'High',   color: '#975a16', bg: '#fffbeb', border: '#f6e05e' },
  normal: { label: 'Normal', color: '#276749', bg: '#f0fff4', border: '#9ae6b4' },
  low:    { label: 'Low',    color: '#4a5568', bg: '#f7fafc', border: '#cbd5e0' },
}

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const DashboardContext = createContext(null)

export function DashboardProvider({ children }) {
  const [user, setUser]                   = useState(null)
  const [ordinances, setOrdinances]       = useState([])
  const [resolutions, setResolutions]     = useState([])
  const [officials, setOfficials]         = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [sessionMinutes, setSessionMinutes] = useState([])
  const [loading, setLoading]             = useState(true)
  const [selectedOfficial, setSelectedOfficial] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token  = localStorage.getItem('token')
    const isAtRoot = window.location.pathname === '/'

    if (!stored || !token) {
      if (!isAtRoot) window.location.replace('/')
      return
    }
    try {
      const u = JSON.parse(stored)
      if (u.role !== 'user') {
        if (!isAtRoot) window.location.replace('/')
        return
      }
      setUser(u)
    } catch {
      if (!isAtRoot) window.location.replace('/')
    }
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ord, res, off, ann, ses] = await Promise.all([
        fetch(`${API}/api/ordinances`).then(r => r.json()),
        fetch(`${API}/api/resolutions`).then(r => r.json()),
        fetch(`${API}/api/sb-officials`).then(r => r.json()),
        fetch(`${API}/api/announcements`).then(r => r.json()),
        fetch(`${API}/api/session-minutes`).then(r => r.json()),
      ])
      setOrdinances(Array.isArray(ord) ? ord : [])
      setResolutions(Array.isArray(res) ? res : [])
      setOfficials(Array.isArray(off) ? off : [])
      setAnnouncements(Array.isArray(ann) ? ann : [])
      setSessionMinutes(Array.isArray(ses) ? ses : [])
    } catch {}
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.replace('/')
  }

  const activeAnn = announcements.filter(
    a => !a.expires_at || new Date(a.expires_at) >= new Date()
  )

  return (
    <DashboardContext.Provider value={{
      API,
      user,
      ordinances,
      resolutions,
      officials,
      announcements,
      sessionMinutes,
      loading,
      activeAnn,
      selectedOfficial,
      setSelectedOfficial,
      handleLogout,
    }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  return useContext(DashboardContext)
}
