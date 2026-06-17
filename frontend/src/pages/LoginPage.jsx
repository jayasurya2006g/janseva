import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const data = await login(form.email, form.password)
      if (data.is_admin || data.role === 'admin') navigate('/admin')
      else if (data.role === 'officer') navigate('/officer')
      else navigate('/home')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials.')
    } finally { setLoading(false) }
  }

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.left}>
        <div style={s.leftContent}>
          <Link to="/" style={s.brand}>⚖ Jan<strong>Seva</strong></Link>
          <h1 style={s.title}>Welcome back.</h1>
          <p style={s.sub}>Sign in to file, track, or manage municipal complaints.</p>
          <div style={s.quote}>
            "Good governance is the foundation of every thriving community."
          </div>
        </div>
        {/* Decorative lines */}
        <div style={s.decorLines}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ ...s.decorLine, opacity: 0.03 + i * 0.01, top: `${10 + i * 11}%` }} />
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={s.right}>
        <div style={s.formBox}>
          <div style={s.formHeader}>
            <div style={s.formLabel}>CITIZEN / OFFICER / ADMIN</div>
            <h2 style={s.formTitle}>Sign in</h2>
          </div>

          <form onSubmit={submit} style={s.form}>
            <div className="fg">
              <label>Email address</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
            </div>
            <div className="fg">
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required />
            </div>

            {error && <div style={s.errBox}>{error}</div>}

            <button type="submit" disabled={loading} style={s.submitBtn}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <div style={s.foot}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#B8860B', fontWeight: 600 }}>Register as citizen</Link>
          </div>

          <div style={s.hint}>
            Officers and admins are created by the administrator.
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  left: { flex: 1, background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '40px' },
  leftContent: { position: 'relative', zIndex: 1, maxWidth: 440 },
  brand: { display: 'block', fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#F5F0E8', textDecoration: 'none', marginBottom: 64 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 900, color: '#F5F0E8', lineHeight: 1.1, marginBottom: 16 },
  sub: { fontSize: 16, color: '#64748B', lineHeight: 1.7, marginBottom: 48 },
  quote: { borderLeft: '3px solid #B8860B', paddingLeft: 20, fontSize: 14, color: '#4A5568', fontStyle: 'italic', lineHeight: 1.7 },
  decorLines: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  decorLine: { position: 'absolute', left: 0, right: 0, height: 1, background: '#F5F0E8' },
  right: { width: '44%', minWidth: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0E8', padding: '40px 24px' },
  formBox: { width: '100%', maxWidth: 400 },
  formHeader: { marginBottom: 32 },
  formLabel: { fontSize: 10, letterSpacing: '0.16em', color: '#B8860B', fontWeight: 700, marginBottom: 8 },
  formTitle: { fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: '#0D1B2A' },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  errBox: { background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: 4, fontSize: 13 },
  submitBtn: { background: '#0D1B2A', color: '#F5F0E8', border: 'none', borderRadius: 4, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em', marginTop: 4 },
  foot: { marginTop: 28, fontSize: 14, color: '#64748B', textAlign: 'center' },
  hint: { marginTop: 16, fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '12px', background: '#EDE7DA', borderRadius: 4 },
}
