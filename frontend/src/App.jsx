import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LandingPage   from './pages/LandingPage'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import HomePage      from './pages/HomePage'
import SubmitPage    from './pages/SubmitPage'
import MyComplaints  from './pages/MyComplaints'
import TrackPage     from './pages/TrackPage'
import OfficerPage   from './pages/OfficerPage'
import AdminPage     from './pages/AdminPage'

function PrivateRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role) && !user.is_admin) return <Navigate to="/home" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/home"     element={<PrivateRoute><HomePage /></PrivateRoute>} />
      <Route path="/submit"   element={<PrivateRoute roles={['citizen']}><SubmitPage /></PrivateRoute>} />
      <Route path="/my-complaints" element={<PrivateRoute roles={['citizen']}><MyComplaints /></PrivateRoute>} />
      <Route path="/track/:id"    element={<PrivateRoute><TrackPage /></PrivateRoute>} />
      <Route path="/officer"  element={<PrivateRoute roles={['officer']}><OfficerPage /></PrivateRoute>} />
      <Route path="/admin"    element={<PrivateRoute><AdminPage /></PrivateRoute>} />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  )
}
