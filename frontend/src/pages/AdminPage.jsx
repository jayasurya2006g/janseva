import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const STATUS_COLOR = { pending: '#B8860B', active: '#1D4ED8', resolved: '#1A7F4B', rejected: '#C0392B', closed: '#6B7280' }

export default function AdminPage() {
  const [tab, setTab]               = useState('complaints')
  const [complaints, setComplaints] = useState([])
  const [officers, setOfficers]     = useState([])
  const [stats, setStats]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('')
  const [assignMap, setAssignMap]   = useState({})

  // Officer creation form
  const [showCreate, setShowCreate] = useState(false)
  const [newOfficer, setNewOfficer] = useState({ username: '', email: '', phone: '', password: '' })
  const [createMsg, setCreateMsg]   = useState('')
  const [creating, setCreating]     = useState(false)

  useEffect(() => { loadAll() }, [])
  useEffect(() => { loadComplaints() }, [filter])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [co, of, st] = await Promise.all([
        api.get('/complaints/'),
        api.get('/admin/officers/'),
        api.get('/complaints/stats/'),
      ])
      setComplaints(co.data.results || co.data)
      setOfficers(of.data)
      setStats(st.data)
    } catch {}
    setLoading(false)
  }

  const loadComplaints = async () => {
    const params = filter ? `?status=${filter}` : ''
    try {
      const r = await api.get(`/complaints/${params}`)
      setComplaints(r.data.results || r.data)
    } catch {}
  }

  const assign = async (complaintId) => {
    const officerId = assignMap[complaintId]
    if (!officerId) return alert('Select an officer first.')
    try {
      await api.patch(`/complaints/${complaintId}/assign/`, { officer_id: officerId })
      loadAll()
      setAssignMap(m => ({ ...m, [complaintId]: '' }))
    } catch (err) {
      alert(err.response?.data?.error || 'Assignment failed.')
    }
  }

  const deactivateOfficer = async (id) => {
    if (!confirm('Deactivate this officer?')) return
    try {
      await api.patch(`/admin/${id}/deactivate/`)
      setOfficers(os => os.map(o => o.id === id ? { ...o, is_active: false } : o))
    } catch {}
  }

  const activateOfficer = async (id) => {
    try {
      await api.patch(`/admin/${id}/activate/`)
      setOfficers(os => os.map(o => o.id === id ? { ...o, is_active: true } : o))
    } catch {}
  }

  const createOfficer = async (e) => {
    e.preventDefault(); setCreating(true); setCreateMsg('')
    try {
      await api.post('/admin/create-officer/', newOfficer)
      setCreateMsg('Officer created successfully!')
      setNewOfficer({ username: '', email: '', phone: '', password: '' })
      loadAll()
      setTimeout(() => { setShowCreate(false); setCreateMsg('') }, 1500)
    } catch (err) {
      const d = err.response?.data
      setCreateMsg(typeof d === 'object' ? JSON.stringify(d) : 'Creation failed.')
    } finally { setCreating(false) }
  }

  const unassigned = complaints.filter(c => !c.assigned_to && c.status === 'pending')

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <Navbar />

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div className="sec-label">Administrator panel</div>
          <h1 style={s.title}>Admin dashboard</h1>
          <p style={s.sub}>Manage officers, assign complaints, and monitor portal-wide activity.</p>
        </div>
      </div>

      <div style={s.body}>
        {/* Stats */}
        {stats && (
          <div style={s.statsRow}>
            {[
              { n: stats.total,          label: 'Total complaints',  color: '#0D1B2A' },
              { n: stats.pending,        label: 'Pending',           color: '#B8860B' },
              { n: stats.active,         label: 'Active',            color: '#1D4ED8' },
              { n: stats.resolved,       label: 'Resolved',          color: '#1A7F4B' },
              { n: stats.unassigned,     label: 'Unassigned',        color: '#C0392B' },
              { n: stats.total_officers, label: 'Active officers',   color: '#7C3AED' },
            ].map((st, i) => (
              <div key={i} style={{ ...s.statCard, borderLeftColor: st.color }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: st.color }}>{st.n}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{st.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabs}>
          {['complaints', 'officers'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ ...s.tabBtn, ...(tab === t ? s.tabActive : {}) }}>
              {t === 'complaints' ? '📋 All Complaints' : '👮 Officers'}
            </button>
          ))}
        </div>

        {/* ── COMPLAINTS TAB ── */}
        {tab === 'complaints' && (
          <div>
            <div style={s.toolbar}>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={s.sel}>
                <option value="">All statuses</option>
                {['pending','active','resolved','closed','rejected'].map(st => (
                  <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
                ))}
              </select>
              {unassigned.length > 0 && (
                <div style={s.badge}>{unassigned.length} unassigned</div>
              )}
            </div>
            {loading
              ? <div style={s.empty}>Loading…</div>
              : <div style={s.grid}>
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
                      <p style={s.cardDesc}>{c.description.length > 80 ? c.description.slice(0, 80) + '…' : c.description}</p>
                      {c.image && <img src={c.image} alt="" style={s.cardImg} />}
                      <div style={s.cardMeta}>
                        <span>👤 {c.citizen}</span>
                        <span>📍 {c.location}{c.ward ? ` · Ward ${c.ward}` : ''}</span>
                        <span>🗓 {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {c.assigned_to
                        ? <div style={s.assignedBadge}>✓ Assigned to <strong>{c.assigned_to}</strong></div>
                        : (
                          <div style={s.assignRow}>
                            <select
                              value={assignMap[c.id] || ''}
                              onChange={e => setAssignMap(m => ({ ...m, [c.id]: e.target.value }))}
                              style={{ ...s.sel, flex: 1, fontSize: 12, padding: '8px 10px' }}
                            >
                              <option value="">Select officer…</option>
                              {officers.filter(o => o.is_active).map(o => (
                                <option key={o.id} value={o.id}>{o.username}</option>
                              ))}
                            </select>
                            <button onClick={() => assign(c.id)} style={s.assignBtn}>Assign →</button>
                          </div>
                        )
                      }
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── OFFICERS TAB ── */}
        {tab === 'officers' && (
          <div>
            <div style={s.toolbar}>
              <button onClick={() => setShowCreate(true)} style={s.createBtn}>+ Create officer account</button>
            </div>

            {loading
              ? <div style={s.empty}>Loading…</div>
              : (
                <div style={s.officerGrid}>
                  {officers.map(o => (
                    <div key={o.id} style={s.officerCard}>
                      <div style={s.officerTop}>
                        <div style={s.avatar}>{o.username[0].toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                          <div style={s.officerName}>{o.username}</div>
                          <div style={s.officerEmail}>{o.email}</div>
                          {o.phone && <div style={s.officerEmail}>📞 {o.phone}</div>}
                        </div>
                        <div style={{ ...s.activePill, background: o.is_active ? '#D1FAE5' : '#F3F4F6', color: o.is_active ? '#065F46' : '#6B7280' }}>
                          {o.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <div style={s.officerStats}>
                        <span>🗓 Joined {new Date(o.date_joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div style={s.officerActions}>
                        {o.is_active
                          ? <button onClick={() => deactivateOfficer(o.id)} style={s.deactivateBtn}>Deactivate</button>
                          : <button onClick={() => activateOfficer(o.id)} style={s.activateBtn}>Reactivate</button>
                        }
                      </div>
                    </div>
                  ))}
                  {officers.length === 0 && (
                    <div style={{ ...s.empty, gridColumn: '1/-1' }}>
                      No officers created yet. Click "Create officer account" to add one.
                    </div>
                  )}
                </div>
              )
            }
          </div>
        )}
      </div>

      {/* Create officer modal */}
      {showCreate && (
        <div style={s.overlay} onClick={() => setShowCreate(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <div style={{ fontSize: 10, color: '#B8860B', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Admin action
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#0D1B2A' }}>
                  Create officer account
                </h2>
              </div>
              <button onClick={() => setShowCreate(false)} style={s.closeBtn}>✕</button>
            </div>
            <form onSubmit={createOfficer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="fg">
                  <label>Username</label>
                  <input value={newOfficer.username} onChange={e => setNewOfficer(o => ({ ...o, username: e.target.value }))} placeholder="officer_suresh" required />
                </div>
                <div className="fg">
                  <label>Phone</label>
                  <input value={newOfficer.phone} onChange={e => setNewOfficer(o => ({ ...o, phone: e.target.value }))} placeholder="9876543210" />
                </div>
              </div>
              <div className="fg">
                <label>Email address</label>
                <input type="email" value={newOfficer.email} onChange={e => setNewOfficer(o => ({ ...o, email: e.target.value }))} placeholder="officer@municipality.gov.in" required />
              </div>
              <div className="fg">
                <label>Password (min 8 characters)</label>
                <input type="password" value={newOfficer.password} onChange={e => setNewOfficer(o => ({ ...o, password: e.target.value }))} placeholder="Set a strong password" required minLength={8} />
              </div>
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: 4, fontSize: 12, color: '#92400E' }}>
                The officer will receive this password. Ask them to change it after first login.
              </div>
              {createMsg && (
                <div style={{ background: createMsg.includes('success') ? '#D1FAE5' : '#FEE2E2', border: `1px solid ${createMsg.includes('success') ? '#BBF7D0' : '#FECACA'}`, color: createMsg.includes('success') ? '#065F46' : '#991B1B', padding: '10px 14px', borderRadius: 4, fontSize: 13 }}>
                  {createMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={s.cancelBtn}>Cancel</button>
                <button type="submit" disabled={creating} style={s.submitBtn}>
                  {creating ? 'Creating…' : 'Create officer account →'}
                </button>
              </div>
            </form>
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
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 5, padding: '14px 16px', borderLeft: '4px solid', boxShadow: '0 1px 6px rgba(13,27,42,0.07)' },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #E5E0D8', paddingBottom: 0 },
  tabBtn: { background: 'none', border: 'none', padding: '10px 20px', fontSize: 14, fontWeight: 500, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit', borderBottom: '2px solid transparent', marginBottom: -2 },
  tabActive: { color: '#0D1B2A', borderBottomColor: '#B8860B', fontWeight: 600 },
  toolbar: { display: 'flex', gap: 12, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' },
  sel: { padding: '9px 14px', borderRadius: 4, border: '1.5px solid #D0C8BC', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#0D1B2A' },
  badge: { background: '#FEE2E2', color: '#991B1B', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20 },
  createBtn: { background: '#0D1B2A', color: '#F5F0E8', border: 'none', padding: '10px 20px', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  empty: { textAlign: 'center', color: '#64748B', padding: '60px 0', fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 },
  card: { background: '#fff', borderRadius: 5, padding: '20px', boxShadow: '0 2px 10px rgba(13,27,42,0.07)', display: 'flex', flexDirection: 'column', gap: 8 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#0D1B2A' },
  cardDesc: { fontSize: 12, color: '#64748B', lineHeight: 1.6 },
  cardImg: { width: '100%', height: 100, objectFit: 'cover', borderRadius: 4 },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: '#9CA3AF' },
  assignedBadge: { background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 12px', borderRadius: 4, fontSize: 12, color: '#065F46' },
  assignRow: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 },
  assignBtn: { background: '#B8860B', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  officerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 },
  officerCard: { background: '#fff', borderRadius: 5, padding: '20px', boxShadow: '0 2px 10px rgba(13,27,42,0.07)' },
  officerTop: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: '#1D4ED8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  officerName: { fontSize: 15, fontWeight: 700, color: '#0D1B2A' },
  officerEmail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  activePill: { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },
  officerStats: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  officerActions: { display: 'flex', gap: 8 },
  deactivateBtn: { background: 'transparent', border: '1.5px solid #C0392B', color: '#C0392B', padding: '7px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  activateBtn: { background: '#1A7F4B', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { background: '#fff', borderRadius: 8, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, color: '#9CA3AF', cursor: 'pointer', fontFamily: 'inherit' },
  cancelBtn: { background: 'transparent', border: '1.5px solid #D0C8BC', color: '#64748B', padding: '10px 20px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn: { background: '#0D1B2A', color: '#F5F0E8', border: 'none', padding: '10px 24px', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
