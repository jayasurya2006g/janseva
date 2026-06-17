import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navLinks = user?.is_admin
    ? [{ to: '/home', label: 'Dashboard' }, { to: '/admin', label: 'Admin Panel' }]
    : user?.role === 'officer'
    ? [{ to: '/home', label: 'Dashboard' }, { to: '/officer', label: 'My Work' }]
    : [
        { to: '/home',          label: 'Home' },
        { to: '/submit',        label: 'File Complaint' },
        { to: '/my-complaints', label: 'My Complaints' },
      ]

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/home" style={styles.brand}>
          <span style={styles.brandIcon}>⚖</span>
          <span>Jan<strong>Seva</strong></span>
        </Link>

        {/* Desktop links */}
        <div style={styles.links}>
          {navLinks.map(l => (
            <Link
              key={l.to} to={l.to}
              style={{ ...styles.link, ...(location.pathname === l.to ? styles.linkActive : {}) }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* User info + logout */}
        <div style={styles.right}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
            <div className="hide-mobile">
              <div style={styles.uname}>{user?.username}</div>
              <div style={styles.urole}>{user?.is_admin ? 'Administrator' : user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Sign out</button>
        </div>

        {/* Hamburger */}
        <button onClick={() => setOpen(o => !o)} style={styles.ham}>☰</button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={styles.mobileMenu}>
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} style={styles.mobileLink} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <button onClick={handleLogout} style={{ ...styles.mobileLink, background: 'none', border: 'none', textAlign: 'left', color: '#C0392B', cursor: 'pointer', width: '100%' }}>
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}

const styles = {
  nav: { background: '#0D1B2A', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 16px rgba(0,0,0,0.25)' },
  inner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 32 },
  brand: { display: 'flex', alignItems: 'center', gap: 10, color: '#F5F0E8', fontSize: 20, fontFamily: "'Playfair Display', serif", letterSpacing: '-0.01em', textDecoration: 'none', flexShrink: 0 },
  brandIcon: { fontSize: 22 },
  links: { display: 'flex', gap: 4, flex: 1 },
  link: { color: '#94A3B8', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 4, transition: 'all 0.15s', textDecoration: 'none' },
  linkActive: { color: '#F5F0E8', background: 'rgba(255,255,255,0.08)' },
  right: { display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: '50%', background: '#B8860B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  uname: { color: '#F5F0E8', fontSize: 13, fontWeight: 600, lineHeight: 1.2 },
  urole: { color: '#64748B', fontSize: 11, textTransform: 'capitalize' },
  logoutBtn: { background: 'transparent', border: '1px solid #334155', color: '#94A3B8', fontSize: 12, padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' },
  ham: { display: 'none', background: 'none', border: 'none', color: '#F5F0E8', fontSize: 22, cursor: 'pointer', marginLeft: 'auto' },
  mobileMenu: { background: '#152438', padding: '12px 24px 20px', display: 'flex', flexDirection: 'column', gap: 4 },
  mobileLink: { color: '#CBD5E1', fontSize: 15, padding: '10px 4px', borderBottom: '1px solid #1E3A5F', textDecoration: 'none', display: 'block' },
}
