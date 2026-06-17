import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const STATUS_COLOR = { pending: '#B8860B', active: '#1D4ED8', resolved: '#1A7F4B', rejected: '#C0392B', closed: '#6B7280' }

export default function OfficerPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('')
  const [selected, setSelected]     = useState(null)
  const [remark, setRemark]         = useState('')
  const [newStatus, setNewStatus]   = useState('')
  const [updating, setUpdating]     = useState(false)
  const [stats, setStats]           = useState({ total: 0, active: 0, pending: 0, resolved: 0 })

  useEffect(() => {
    load()
  }, [filter])

  const load = () => {
    const params = filter ? `?status=${filter}` : ''
    api.get(`/complaints/${params}`).then(r => {
      const data = r.data.results || r.data
      setComplaints(data)
      setStats({
        total:    data.length,
        active:   data.filter(c => c.status === 'active').length,
        pending:  data.filter(c => c.status === 'pending').length,
        resolved: data.filter(c => c.status === 'resolved').length,
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const updateStatus = async () => {
    if (!newStatus || !selected) return
    setUpdating(true)
    try {
      await api.patch(`/complaints/${selected.id}/update-status/`, { status: newStatus, remark })
      setComplaints(c => c.map(x => x.id === selected.id ? { ...x, status: newStatus, officer_remark: remark } : x))
      setSelected(null); setRemark(''); setNewStatus('')
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed.')
    } finally { setUpdating(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <Navbar />

      <div style={s.header}>
        <div style={s.headerInner}>
          <div className="sec-label">Officer dashboard</div>
          <h1 style={s.title}>My assigned complaints</h1>
          <p style={s.sub}>View and update status on complaints assigned to you by the administrator.</p>
        </div>
      </div>

      <div style={s.body}>
        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { n: stats.total,    label: 'Total assigned',  color: '#0D1B2A' },
            { n: stats.active,   label: 'In progress',     color: '#1D4ED8' },
            { n: stats.pending,  label: 'Pending pickup',  color: '#B8860B' },
            { n: stats.resolved, label: 'Resolved',        color: '#1A7F4B' },
          ].map((st, i) => (
            <div key={i} style={{ ...s.statCard, borderLeftColor: st.color }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: st.color }}>{st.n}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={s.toolbar}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={s.sel}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading && <div style={s.empty}>Loading…</div>}
        {!loading && complaints.length === 0 && (
          <div style={s.empty}>No complaints assigned to you yet.</div>
        )}

        <div style={s.grid}>
          {complaints.map(c => (
            <div key={c.id} style={s.card}>
              <div style={{ height: 4, background: STATUS_COLOR[c.status] || '#ccc', margin: '-20px -20px 16px' }} />
              <div style={s.cardTop}>
                <span style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  #{c.id} · {c.category}
                </span>
                <span className={`pill ${c.status}`}>{c.status}</span>
              </div>
              <h3 style={s.cardTitle}>{c.title}</h3>
              <p style={s.cardDesc}>{c.description.length > 90 ? c.description.slice(0, 90) + '…' : c.description}</p>
              {c.image && <img src={c.image} alt="" style={s.cardImg} />}
              <div style={s.cardMeta}>
                <span>👤 {c.citizen}</span>
                <span>📍 {c.location}</span>
              </div>
              {c.officer_remark && (
                <div style={s.remarkBox}>
                  <strong>Your remark:</strong> {c.officer_remark}
                </div>
              )}
              {c.document && (
                <a href={c.document} target="_blank" rel="noreferrer" style={s.docLink}>📄 View document</a>
              )}
              <div style={s.cardDate}>Filed {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              {c.status !== 'resolved' && c.status !== 'rejected' && (
                <button onClick={() => { setSelected(c); setNewStatus(''); setRemark('') }} style={s.updateBtn}>
                  Update status →
                </button>
              )}
              {(c.status === 'resolved' || c.status === 'rejected') && (
                <div style={{ ...s.updateBtn, background: '#F0FDF4', color: '#065F46', textAlign: 'center', cursor: 'default' }}>
                  ✓ {c.status}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Update status modal */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <div style={{ fontSize: 10, color: '#B8860B', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  #{selected.id} · {selected.category}
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#0D1B2A' }}>
                  {selected.title}
                </h2>
              </div>
              <button onClick={() => setSelected(null)} style={s.closeBtn}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="fg">
                <label>New status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="">Select new status</option>
                  <option value="active">Active / In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="fg">
                <label>Officer remark</label>
                <textarea
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  rows={4}
                  placeholder="Describe what action was taken, findings, or reason for rejection…"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setSelected(null)} style={s.cancelBtn}>Cancel</button>
                <button onClick={updateStatus} disabled={!newStatus || updating} style={s.submitBtn}>
                  {updating ? 'Updating…' : 'Update status →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  header: { background: '#0D1B2A', padding: '40px 0 36px' },
  headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: '#F5F0E8', marginBottom: 8 },
  sub: { color: '#64748B', fontSize: 14 },
  body: { maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 5, padding: '16px 18px', borderLeft: '4px solid', boxShadow: '0 1px 6px rgba(13,27,42,0.07)' },
  toolbar: { display: 'flex', gap: 12, marginBottom: 20 },
  sel: { padding: '9px 14px', borderRadius: 4, border: '1.5px solid #D0C8BC', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#0D1B2A' },
  empty: { textAlign: 'center', color: '#64748B', padding: '60px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 },
  card: { background: '#fff', borderRadius: 5, padding: '20px', boxShadow: '0 2px 10px rgba(13,27,42,0.07)', display: 'flex', flexDirection: 'column', gap: 8 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#0D1B2A' },
  cardDesc: { fontSize: 13, color: '#64748B', lineHeight: 1.6 },
  cardImg: { width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, color: '#9CA3AF' },
  remarkBox: { background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 10px', borderRadius: 3, fontSize: 12, color: '#065F46' },
  docLink: { color: '#1D4ED8', fontSize: 12, fontWeight: 600 },
  cardDate: { fontSize: 11, color: '#D0C8BC' },
  updateBtn: { background: '#0D1B2A', color: '#F5F0E8', border: 'none', padding: '10px 16px', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { background: '#fff', borderRadius: 8, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, color: '#9CA3AF', cursor: 'pointer', fontFamily: 'inherit' },
  cancelBtn: { background: 'transparent', border: '1.5px solid #D0C8BC', color: '#64748B', padding: '10px 20px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn: { background: '#0D1B2A', color: '#F5F0E8', border: 'none', padding: '10px 24px', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
