import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './LogIn'
import Register from './Register'
import Dashboard from './Dashboard'
import AdminDashboard from './AdminDashboard'
import UserDashboard from './UserDashboard/UserDashboard'

// ─── Auth Guards ───────────────────────────────────────────────────────────────
const getUser = () => {
  try {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  } catch {
    return null
  }
}

const ProtectedRoute = ({ children, requiredRole }) => {
  const user = getUser()
  if (!user) return <Navigate to="/" replace />
  if (requiredRole && user.role !== requiredRole) {
    // UPDATED REDIRECT: Ensure user is sent to the base dashboard path if they have the wrong role
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
  }
  return children
}

const GuestRoute = ({ children }) => {
  const user = getUser()
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
  }
  return children
}

// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  return (
    <Routes>
      {/* Guest only routes — redirect to dashboard if already logged in */}
      <Route path="/" element={
        <GuestRoute><Login /></GuestRoute>
      } />
      <Route path="/register" element={
        <GuestRoute><Register /></GuestRoute>
      } />

      {/* MODIFIED ROUTE: Added "/*" to "/dashboard"
          This tells React Router that UserDashboard will handle its own internal 
          sub-routes (like /dashboard/home, /dashboard/ordinances, etc.) 
      */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute requiredRole="user">
          <UserDashboard /> 
        </ProtectedRoute>
      } />

      {/* Admin dashboard — must be logged in as admin */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Catch-all — redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}