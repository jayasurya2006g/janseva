import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const slides = [
  {
    tag:     'Roads & Infrastructure',
    title:   'Potholes don\'t fix themselves.',
    body:    'File a geo-tagged road complaint and watch officers take accountability in real time.',
    accent:  '#C0392B',
  },
  {
    tag:     'Water Supply',
    title:   'Clean water is not a privilege.',
    body:    'Report supply disruptions, contamination, or broken pipes — directly to your ward officer.',
    accent:  '#1A7F4B',
  },
  {
    tag:     'Sanitation',
    title:   'Your ward deserves better.',
    body:    'Upload photos, describe the issue, and track every step from submission to resolution.',
    accent:  '#B8860B',
  },
]

const features = [
  { icon: '📋', title: 'Structured complaints', body: 'Fill a short form, attach a photo or document. Your complaint is on the right desk in seconds.' },
  { icon: '🔍', title: 'End-to-end tracking', body: 'Every status change — pending, active, resolved — is timestamped and logged for full transparency.' },
  { icon: '👮', title: 'Direct officer accountability', body: 'Admin assigns work to specific officers. Officers can only see their own assigned cases.' },
  { icon: '📊', title: 'Admin oversight', body: 'The administrator sees live stats across all complaints, wards, and officers in a single panel.' },
]

export default function LandingPage() {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef()

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % slides.length), 4000)
    return () => clearInterval(timerRef.current)
  }, [])

  const slide = slides[current]

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', color: '#F5F0E8', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top bar ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.brand}>⚖ Jan<strong>Seva</strong></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/login"    style={s.navBtn}>Sign in</Link>
            <Link to="/register" style={{ ...s.navBtn, background: '#B8860B', color: '#fff', border: 'none' }}>Register</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={s.hero}>
        {/* Background grid lines — government form feel */}
        <div style={s.gridOverlay} />

        <div style={s.heroInner}>
          {/* Left: text */}
          <div style={s.heroLeft}>
            <div style={{ ...s.tag, borderColor: slide.accent, color: slide.accent }}>
              {slide.tag}
            </div>
            <h1 style={s.heroTitle}>{slide.title}</h1>
            <p style={s.heroBody}>{slide.body}</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 32 }}>
              <Link to="/register" style={s.heroCta}>File a complaint →</Link>
              <Link to="/login"    style={s.heroSecondary}>Officer / Admin login</Link>
            </div>

            {/* Slide dots */}
            <div style={{ display: 'flex', gap: 8, marginTop: 40 }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{
                    width: i === current ? 28 : 8, height: 8,
                    borderRadius: 4, border: 'none', cursor: 'pointer',
                    background: i === current ? slide.accent : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.3s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right: mock complaint card */}
          <div style={s.heroRight}>
            <div style={s.mockCard}>
              {/* Stamp diagonal corner */}
              <div style={s.mockStamp}>FILED</div>
              <div style={{ fontSize: 11, color: '#64748B', letterSpacing: '0.1em', marginBottom: 12 }}>
                COMPLAINT #JAN-2024-0471
              </div>
              <div style={{ fontSize: 18, fontFamily: "'Playfair Display', serif", fontWeight: 700, marginBottom: 8, color: '#0D1B2A' }}>
                Overflowing drain on MG Road
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
                Ward 12 · Sanitation · Filed 2 days ago
              </div>
              <div style={s.timeline}>
                {[
                  { st: 'Submitted',   time: 'Nov 12, 09:14', done: true  },
                  { st: 'Assigned',    time: 'Nov 12, 11:00', done: true  },
                  { st: 'In Progress', time: 'Nov 13, 10:30', done: true  },
                  { st: 'Resolved',    time: 'Pending…',      done: false },
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.done ? '#1A7F4B' : '#E5E7EB', border: `2px solid ${t.done ? '#1A7F4B' : '#D1D5DB'}`, flexShrink: 0 }} />
                      {i < 3 && <div style={{ width: 2, height: 24, background: '#E5E7EB' }} />}
                    </div>
                    <div style={{ paddingBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: t.done ? '#0D1B2A' : '#9CA3AF' }}>{t.st}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{t.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={s.divider}>
        <div style={s.dividerLine} />
        <span style={s.dividerText}>How it works</span>
        <div style={s.dividerLine} />
      </div>

      {/* ── Features ── */}
      <section style={s.features}>
        <div style={s.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <div style={s.featureTitle}>{f.title}</div>
              <div style={s.featureBody}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats band ── */}
      <section style={s.statsBand}>
        {[
          { n: '3 Roles',      l: 'Citizen · Officer · Admin' },
          { n: '5 Statuses',   l: 'Full complaint lifecycle' },
          { n: 'Image upload', l: 'Photo + PDF evidence' },
          { n: 'JWT secured',  l: 'Token-based authentication' },
        ].map((s2, i) => (
          <div key={i} style={s.statItem}>
            <div style={s.statNum}>{s2.n}</div>
            <div style={s.statLabel}>{s2.l}</div>
          </div>
        ))}
      </section>

      {/* ── CTA ── */}
      <section style={s.cta}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#B8860B', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase' }}>Ready to begin?</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, marginBottom: 20, lineHeight: 1.2 }}>
            Your complaint deserves to be heard.
          </h2>
          <Link to="/register" style={{ ...s.heroCta, display: 'inline-block' }}>
            Create a free account →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <span>⚖ JanSeva Municipality Portal</span>
        <span style={{ color: '#334155' }}>Built with Django · DRF · React</span>
      </footer>
    </div>
  )
}

const s = {
  header: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(13,27,42,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1E3A5F' },
  headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#F5F0E8' },
  navBtn: { padding: '7px 18px', borderRadius: 4, fontSize: 13, fontWeight: 600, border: '1px solid #334155', color: '#CBD5E1', textDecoration: 'none', transition: 'all 0.15s' },
  hero: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 60, overflow: 'hidden' },
  gridOverlay: {
    position: 'absolute', inset: 0, opacity: 0.04,
    backgroundImage: 'linear-gradient(#F5F0E8 1px, transparent 1px), linear-gradient(90deg, #F5F0E8 1px, transparent 1px)',
    backgroundSize: '48px 48px',
    pointerEvents: 'none',
  },
  heroInner: { maxWidth: 1200, margin: '0 auto', padding: '60px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', width: '100%' },
  heroLeft: { display: 'flex', flexDirection: 'column' },
  tag: { display: 'inline-block', border: '1px solid', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 2, marginBottom: 20, width: 'fit-content', transition: 'all 0.3s' },
  heroTitle: { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', transition: 'all 0.3s' },
  heroBody: { fontSize: 17, color: '#94A3B8', lineHeight: 1.7, marginTop: 20, maxWidth: 440, transition: 'all 0.3s' },
  heroCta: { background: '#B8860B', color: '#fff', padding: '14px 28px', borderRadius: 4, fontSize: 14, fontWeight: 700, textDecoration: 'none', letterSpacing: '0.02em' },
  heroSecondary: { background: 'transparent', color: '#94A3B8', padding: '14px 28px', borderRadius: 4, fontSize: 14, border: '1px solid #334155', textDecoration: 'none' },
  heroRight: { display: 'flex', justifyContent: 'center' },
  mockCard: { background: '#fff', borderRadius: 8, padding: 28, width: '100%', maxWidth: 380, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden' },
  mockStamp: { position: 'absolute', top: 18, right: -8, background: '#1A7F4B', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', padding: '3px 16px', clipPath: 'polygon(0 0,100% 0,88% 50%,100% 100%,0 100%)' },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  divider: { display: 'flex', alignItems: 'center', gap: 20, padding: '0 24px', maxWidth: 1200, margin: '60px auto 0' },
  dividerLine: { flex: 1, height: 1, background: '#1E3A5F' },
  dividerText: { color: '#64748B', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  features: { maxWidth: 1200, margin: '0 auto', padding: '60px 24px' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 24 },
  featureCard: { background: '#152438', border: '1px solid #1E3A5F', borderRadius: 6, padding: '28px 24px' },
  featureIcon: { fontSize: 28, marginBottom: 14 },
  featureTitle: { fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, marginBottom: 10 },
  featureBody: { fontSize: 14, color: '#64748B', lineHeight: 1.7 },
  statsBand: { background: '#152438', borderTop: '1px solid #1E3A5F', borderBottom: '1px solid #1E3A5F', padding: '36px 24px', display: 'flex', justifyContent: 'center', gap: 60, flexWrap: 'wrap' },
  statItem: { textAlign: 'center' },
  statNum: { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#B8860B' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  cta: { padding: '80px 24px', borderTop: '1px solid #1E3A5F' },
  footer: { background: '#0A1520', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748B' },
}
