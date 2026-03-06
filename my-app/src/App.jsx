import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './LogIn'
import Register from './Register'
import Dashboard from './Dashboard'
import AdminDashboard from './AdminDashboard'

export default function App() {
  const user = JSON.parse(localStorage.getItem('user'))

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} /> : <Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  )
}