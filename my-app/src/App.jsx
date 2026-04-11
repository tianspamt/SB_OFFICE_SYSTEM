import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './LogIn'
import Register from './Register'
import AdminDashboard from './AdminDashboard'

import UserDashboard from './UserDashboard/UserDashboard'
import HomePage from './UserDashboard/HomePage'
import CouncilPage from './UserDashboard/CouncilPage'
import AnnouncementsPage from './UserDashboard/AnnouncementsPage'
import SearchPage from './UserDashboard/SearchPage'
import {
  OrdinancesPage,
  ResolutionsPage,
  SessionsPage,
  LocalCodePage,
  RulesPage,
} from './UserDashboard/LegislativePage'

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
      {/* Guest only routes */}
      <Route path="/" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* User dashboard — UserDashboard is the layout shell with <Outlet /> */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="user">
            <UserDashboard />
          </ProtectedRoute>
        }
      >
        {/* Default: redirect /dashboard → /dashboard/home */}
        <Route index element={<Navigate to="home" replace />} />

        <Route path="home"          element={<HomePage />} />
        <Route path="ordinances"    element={<OrdinancesPage />} />
        <Route path="resolutions"   element={<ResolutionsPage />} />
        <Route path="sessions"      element={<SessionsPage />} />
        <Route path="localcode"     element={<LocalCodePage />} />
        <Route path="rules"         element={<RulesPage />} />
        <Route path="council"       element={<CouncilPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="search"        element={<SearchPage />} />

        {/* Catch any unknown sub-path → home */}
        <Route path="*" element={<Navigate to="home" replace />} />
      </Route>

      {/* Admin dashboard */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
