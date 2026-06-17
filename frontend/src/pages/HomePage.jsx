import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const carouselSlides = [
  { bg: '#0D1B2A', accent: '#B8860B', category: 'Roads & Potholes',  icon: '🚧', headline: 'Broken roads cost lives.', sub: 'Document road damage in your ward and trigger officer action immediately.' },
  { bg: '#0F2318', accent: '#1A7F4B', category: 'Water Supply',       icon: '💧', headline: 'Water is a right, not a favour.', sub: 'Report supply cuts, contamination, or leaking pipes to your local body.' },
  { bg: '#1A0D2A', accent: '#7C3AED', category: 'Electricity',        icon: '⚡', headline: 'Power outages slow your ward.', sub: 'Alert your municipality to outages, broken streetlights, and transformer issues.' },
  { bg: '#1A0E08', accent: '#C0392B', category: 'Sanitation',         icon: '🗑', headline: 'A clean ward is a healthy ward.', sub: 'Flag overflowing drains, garbage piles, and open waste for immediate action.' },
]

function StatusBadge({ status }) {
  return <span className={`pill ${status}`}>{status}</span>
}

export default function HomePage() {
  const { user } = useAuth()
  const [current, setCurrent] = useState(0)
  const [recentComplaints, setRecentComplaints] = useState([])
  const timerRef = useRef()

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % carouselSlides.length), 4500)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    api.get('/complaints/?ordering=-created_at').then(r => {
      setRecentComplaints((r.data.results || r.data).slice(0, 3))
    }).catch(() => {})
  }, [])

  const slide = carouselSlides[current]
  const isOfficer = user?.role === 'officer'
  const isAdmin   = user?.is_admin

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <Navbar />

      {/* ── Carousel ── */}
      <div style={{ ...s.carousel, background: slide.bg }}>
        <div style={s.carouselInner}>
          <div style={s.carouselLeft}>
            <div style={{ ...s.carTag, color: slide.accent, borderColor: slide.accent }}>
              {slide.icon} {slide.category}
            </div>
            <h2 style={s.carHeadline}>{slide.headline}</h2>
            <p style={s.carSub}>{slide.sub}</p>
            {!isOfficer && !isAdmin && (
              <Link to="/submit" style={{ ...s.carBtn, background: slide.accent }}>
                File this complaint →
              </Link>
            )}
          </div>
          <div style={s.carouselRight}>
            <div style={{ fontSize: 'clamp(80px, 12vw, 140px)', opacity: 0.12, userSelect: 'none' }}>
              {slide.icon}
            </div>
          </div>
        </div>
        {/* Dots */}
        <div style={s.dots}>
          {carouselSlides.map((_, i) => (
            <button key={i} onClick={() => { setCurrent(i); clearInterval(timerRef.current) }}
              style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer',
                background: i === current ? slide.accent : 'rgba(255,255,255,0.25)', transition: 'all 0.3s' }} />
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={s.content}>

        {/* Quick actions */}
        <div style={s.section}>
          <div className="sec-label">Quick actions</div>
          <div style={s.quickGrid}>
            {!isOfficer && !isAdmin && <>
              <Link to="/submit"        style={s.quickCard}>
                <div style={s.qIcon}>📝</div>
                <div style={s.qTitle}>File a complaint</div>
                <div style={s.qSub}>Submit with photo or document</div>
              </Link>
              <Link to="/my-complaints" style={s.quickCard}>
                <div style={s.qIcon}>📁</div>
                <div style={s.qTitle}>My complaints</div>
                <div style={s.qSub}>View all your filed cases</div>
              </Link>
            </>}
            {isOfficer && (
              <Link to="/officer" style={s.quickCard}>
                <div style={s.qIcon}>👮</div>
                <div style={s.qTitle}>My assigned work</div>
                <div style={s.qSub}>Update status on your cases</div>
              </Link>
            )}
            {isAdmin && <>
              <Link to="/admin" style={s.quickCard}>
                <div style={s.qIcon}>⚙️</div>
                <div style={s.qTitle}>Admin panel</div>
                <div style={s.qSub}>Manage officers and assign complaints</div>
              </Link>
            </>}
          </div>
        </div>

        {/* Recent complaints */}
        {recentComplaints.length > 0 && (
          <div style={s.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <div>
                <div className="sec-label">Latest activity</div>
                <div className="sec-title">Recent complaints</div>
              </div>
              {!isOfficer && !isAdmin && (
                <Link to="/my-complaints" style={{ fontSize: 13, color: '#B8860B', fontWeight: 600 }}>View all →</Link>
              )}
            </div>
            <div style={s.recentGrid}>
              {recentComplaints.map(c => (
                <Link to={`/track/${c.id}`} key={c.id} style={{ textDecoration: 'none' }}>
                  <div style={s.recentCard}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.status === 'resolved' ? '#1A7F4B' : c.status === 'active' ? '#3B82F6' : c.status === 'rejected' ? '#C0392B' : '#B8860B' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        #{c.id} · {c.category}
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#0D1B2A', marginBottom: 6 }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>{c.location}</div>
                    {c.image && <img src={c.image} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, marginTop: 12 }} />}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Info footer band */}
        <div style={s.infoBand}>
          <div style={s.infoItem}><span style={s.infoIcon}>⚖</span> JanSeva Municipality Portal</div>
          <div style={s.infoItem}><span style={s.infoIcon}>📍</span> Serving all wards</div>
          <div style={s.infoItem}><span style={s.infoIcon}>📞</span> Helpline: 1800-XXX-XXXX</div>
        </div>
      </div>
    </div>
  )
}

const s = {
  carousel: { position: 'relative', transition: 'background 0.6s', overflow: 'hidden', minHeight: 280 },
  carouselInner: { maxWidth: 1200, margin: '0 auto', padding: '48px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 },
  carouselLeft: { maxWidth: 560 },
  carTag: { display: 'inline-block', border: '1px solid', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 2, marginBottom: 16 },
  carHeadline: { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 900, color: '#F5F0E8', lineHeight: 1.15, marginBottom: 12 },
  carSub: { fontSize: 15, color: '#94A3B8', lineHeight: 1.7, marginBottom: 24 },
  carBtn: { display: 'inline-block', color: '#fff', padding: '12px 24px', borderRadius: 4, fontSize: 14, fontWeight: 700, textDecoration: 'none' },
  carouselRight: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dots: { display: 'flex', gap: 8, padding: '0 24px 24px', maxWidth: 1200, margin: '0 auto' },
  content: { maxWidth: 1200, margin: '0 auto', padding: '40px 24px 60px' },
  section: { marginBottom: 48 },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 },
  quickCard: { background: '#fff', border: '1.5px solid #E5E0D8', borderRadius: 6, padding: '24px 20px', display: 'block', textDecoration: 'none', transition: 'all 0.18s', cursor: 'pointer' },
  qIcon: { fontSize: 28, marginBottom: 10 },
  qTitle: { fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#0D1B2A', marginBottom: 4 },
  qSub: { fontSize: 13, color: '#64748B' },
  recentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 },
  recentCard: { background: '#fff', borderRadius: 6, padding: '20px', border: '1px solid #E5E0D8', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.18s' },
  infoBand: { background: '#0D1B2A', borderRadius: 6, padding: '20px 28px', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center', marginTop: 24 },
  infoItem: { color: '#64748B', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 },
  infoIcon: { fontSize: 16 },
}
