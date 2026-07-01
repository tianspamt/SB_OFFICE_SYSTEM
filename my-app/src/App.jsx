import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './LogIn'
import Dashboard from './AdminDashboard/AdminDashboard'

const getUser = () => {
  try {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  } catch {
    return null
  }
}

const ProtectedRoute = ({ children }) => {
  const user = getUser()
  return user ? children : <Navigate to="/" replace />
}

const GuestRoute = ({ children }) => {
  const user = getUser()
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}