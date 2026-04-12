import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './LogIn'
import Register from './Register'

// ✅ FIXED IMPORT (based on your new folder structure)
import AdminDashboard from './AdminDashboard/AdminDashboard'

// User Dashboard
import UserDashboard from './UserDashboard/UserDashboard'
import HomePage from './UserDashboard/HomePage'
import CouncilPage from './UserDashboard/CouncilPage'
import AnnouncementsPage from './UserDashboard/AnnouncementsPage'
import AboutPage from './UserDashboard/AboutPage'
import SearchPage from './UserDashboard/SearchPage'

import {
  OrdinancesPage,
  ResolutionsPage,
  SessionsPage,
  LocalCodePage,
  RulesPage,
} from './UserDashboard/LegislativePage'

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
const getUser = () => {
  try {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  } catch {
    return null
  }
}

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, requiredRole }) => {
  const user = getUser()

  if (!user) return <Navigate to="/" replace />

  if (requiredRole && user.role !== requiredRole) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
        replace
      />
    )
  }

  return children
}

// ─── Guest Route ──────────────────────────────────────────────────────────────
const GuestRoute = ({ children }) => {
  const user = getUser()

  if (user) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
        replace
      />
    )
  }

  return children
}

// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  return (
    <Routes>

      {/* ─── GUEST ROUTES ───────────────────────────────────────────────────── */}
      <Route
        path="/"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />

      {/* ─── USER DASHBOARD ─────────────────────────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="user">
            <UserDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="home" replace />} />

        <Route path="home" element={<HomePage />} />
        <Route path="ordinances" element={<OrdinancesPage />} />
        <Route path="resolutions" element={<ResolutionsPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="localcode" element={<LocalCodePage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="council" element={<CouncilPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="search" element={<SearchPage />} />

        <Route path="*" element={<Navigate to="home" replace />} />
      </Route>

      {/* ─── ADMIN DASHBOARD ────────────────────────────────────────────────── */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* ─── FALLBACK ────────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  )
}