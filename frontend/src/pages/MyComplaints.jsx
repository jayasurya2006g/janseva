import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const STATUS_COLORS = { pending: '#B8860B', active: '#1D4ED8', resolved: '#1A7F4B', closed: '#6B7280', rejected: '#C0392B' }

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('')
  const [search, setSearch]         = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (filter) params.set('status', filter)
    if (search) params.set('search', search)
    api.get(`/complaints/?${params}`).then(r => {
      setComplaints(r.data.results || r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [filter, search])

  const withdraw = async (id) => {
    if (!confirm('Withdraw this complaint?')) return
    await api.post(`/complaints/${id}/withdraw/`)
    setComplaints(c => c.map(x => x.id === id ? { ...x, status: 'closed' } : x))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <Navbar />

      <div style={s.header}>
        <div style={s.headerInner}>
          <div className="sec-label">Citizen portal</div>
          <h1 style={s.title}>My complaints</h1>
          <p style={s.sub}>Track every complaint you have filed and their current status.</p>
        </div>
      </div>

      <div style={s.body}>
        {/* Toolbar */}
        <div style={s.toolbar}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, location…" style={{ ...s.searchInput }} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={s.filterSel}>
            <option value="">All statuses</option>
            {['pending','active','resolved','closed','rejected'].map(st => (
              <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
            ))}
          </select>
          <Link to="/submit" style={s.newBtn}>+ New complaint</Link>
        </div>

        {loading && <div style={s.empty}>Loading…</div>}

        {!loading && complaints.length === 0 && (
          <div style={s.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#0D1B2A', marginBottom: 8 }}>No complaints found</div>
            <div style={{ color: '#64748B', marginBottom: 24 }}>You haven't filed any complaints yet — or none match your filter.</div>
            <Link to="/submit" style={s.newBtn}>File your first complaint</Link>
          </div>
        )}

        <div style={s.grid}>
          {complaints.map(c => (
            <div key={c.id} style={s.card}>
              {/* Top accent bar */}
              <div style={{ height: 4, background: STATUS_COLORS[c.status] || '#ccc', margin: '-24px -24px 20px' }} />

              <div style={s.cardTop}>
                <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  #{c.id} · {c.category}
                </div>
                <span className={`pill ${c.status}`}>{c.status}</span>
              </div>

              <h3 style={s.cardTitle}>{c.title}</h3>
              <p style={s.cardDesc}>{c.description.length > 100 ? c.description.slice(0, 100) + '…' : c.description}</p>

              {c.image && (
                <img src={c.image} alt="complaint" style={s.cardImg} />
              )}

              <div style={s.cardMeta}>
                <span>📍 {c.location}</span>
                {c.ward && <span>· Ward {c.ward}</span>}
              </div>

              {c.officer_remark && (
                <div style={s.remark}>
                  <strong>Officer note:</strong> {c.officer_remark}
                </div>
              )}

              <div style={s.cardActions}>
                <Link to={`/track/${c.id}`} style={s.trackBtn}>Track status →</Link>
                {c.status === 'pending' && (
                  <button onClick={() => withdraw(c.id)} style={s.withdrawBtn}>Withdraw</button>
                )}
              </div>

              <div style={s.cardDate}>Filed {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  header: { background: '#0D1B2A', padding: '40px 0 36px' },
  headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 700, color: '#F5F0E8', marginBottom: 8 },
  sub: { color: '#64748B', fontSize: 14 },
  body: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' },
  toolbar: { display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 4, border: '1.5px solid #D0C8BC', fontSize: 14, fontFamily: 'inherit', background: '#fff' },
  filterSel: { padding: '10px 14px', borderRadius: 4, border: '1.5px solid #D0C8BC', fontSize: 14, fontFamily: 'inherit', background: '#fff', color: '#0D1B2A', minWidth: 150 },
  newBtn: { background: '#0D1B2A', color: '#F5F0E8', padding: '10px 20px', borderRadius: 4, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' },
  empty: { textAlign: 'center', color: '#64748B', padding: '60px 0' },
  emptyState: { textAlign: 'center', padding: '80px 24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 6, padding: '24px', boxShadow: '0 2px 12px rgba(13,27,42,0.07)', display: 'flex', flexDirection: 'column', gap: 0 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#0D1B2A', marginBottom: 8 },
  cardDesc: { fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 12 },
  cardImg: { width: '100%', height: 140, objectFit: 'cover', borderRadius: 4, marginBottom: 12 },
  cardMeta: { fontSize: 12, color: '#9CA3AF', marginBottom: 10, display: 'flex', gap: 4 },
  remark: { background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 12px', borderRadius: 4, fontSize: 12, color: '#065F46', marginBottom: 12 },
  cardActions: { display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 12 },
  trackBtn: { flex: 1, background: '#0D1B2A', color: '#F5F0E8', padding: '9px 16px', borderRadius: 4, fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center' },
  withdrawBtn: { background: 'transparent', border: '1.5px solid #C0392B', color: '#C0392B', padding: '9px 16px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  cardDate: { fontSize: 11, color: '#D0C8BC', marginTop: 8 },
}
