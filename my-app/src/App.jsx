import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './LogIn'
import ResetPassword from './ResetPassword'
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
      {/* Deliberately ungated — reached via an emailed link's own token, not
          the app's login session, so it must render the same whether or not
          the browser happens to already have someone logged in. */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}