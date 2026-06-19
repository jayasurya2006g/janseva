import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]   = useState({ username: '', email: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const res = await fetch('https://cspmu.onrender.com/api/users/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, email: form.email, phone: form.phone, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(JSON.stringify(data))
      // Auto-login after registration
      await login(form.email, form.password)
      navigate('/home')
    } catch (err) {
      setError('Registration failed. Email or username may already be taken.')
    } finally { setLoading(false) }
  }

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.leftContent}>
          <Link to="/" style={s.brand}>⚖ Jan<strong>Seva</strong></Link>
          <h1 style={s.title}>Your voice matters.</h1>
          <p style={s.sub}>Create a free citizen account to file complaints, track progress, and hold your local municipality accountable.</p>
          <div style={s.steps}>
            {['Register for free', 'File your complaint', 'Track it to resolution'].map((step, i) => (
              <div key={i} style={s.step}>
                <div style={s.stepNum}>{i + 1}</div>
                <span style={{ color: '#94A3B8', fontSize: 14 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.right}>
        <div style={s.formBox}>
          <div style={s.formHeader}>
            <div style={s.formLabel}>NEW CITIZEN ACCOUNT</div>
            <h2 style={s.formTitle}>Register</h2>
          </div>

          <form onSubmit={submit} style={s.form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="fg">
                <label>Full name / Username</label>
                <input name="username" value={form.username} onChange={handle} placeholder="Ravi Kumar" required />
              </div>
              <div className="fg">
                <label>Phone number</label>
                <input name="phone" value={form.phone} onChange={handle} placeholder="9876543210" />
              </div>
            </div>
            <div className="fg">
              <label>Email address</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="ravi@example.com" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="fg">
                <label>Password</label>
                <input name="password" type="password" value={form.password} onChange={handle} placeholder="Min 8 chars" required />
              </div>
              <div className="fg">
                <label>Confirm password</label>
                <input name="confirm" type="password" value={form.confirm} onChange={handle} placeholder="Repeat password" required />
              </div>
            </div>

            {error && <div style={s.errBox}>{error}</div>}

            <button type="submit" disabled={loading} style={s.submitBtn}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <div style={s.foot}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#B8860B', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  left: { flex: 1, background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative' },
  leftContent: { maxWidth: 420 },
  brand: { display: 'block', fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#F5F0E8', textDecoration: 'none', marginBottom: 64 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, color: '#F5F0E8', lineHeight: 1.1, marginBottom: 16 },
  sub: { fontSize: 15, color: '#64748B', lineHeight: 1.8, marginBottom: 48 },
  steps: { display: 'flex', flexDirection: 'column', gap: 16 },
  step: { display: 'flex', alignItems: 'center', gap: 14 },
  stepNum: { width: 28, height: 28, borderRadius: '50%', background: '#B8860B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  right: { width: '50%', minWidth: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0E8', padding: '40px 24px' },
  formBox: { width: '100%', maxWidth: 460 },
  formHeader: { marginBottom: 28 },
  formLabel: { fontSize: 10, letterSpacing: '0.16em', color: '#B8860B', fontWeight: 700, marginBottom: 8 },
  formTitle: { fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: '#0D1B2A' },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  errBox: { background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: 4, fontSize: 13 },
  submitBtn: { background: '#0D1B2A', color: '#F5F0E8', border: 'none', borderRadius: 4, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif', marginTop: 4" },
  foot: { marginTop: 24, fontSize: 14, color: '#64748B', textAlign: 'center' },
}
