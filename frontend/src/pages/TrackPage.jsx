import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const STATUS_STEP = { pending: 0, active: 1, resolved: 2, rejected: 2, closed: 2 }
const STATUS_COLOR = { pending: '#B8860B', active: '#1D4ED8', resolved: '#1A7F4B', rejected: '#C0392B', closed: '#6B7280' }

export default function TrackPage() {
  const { id } = useParams()
  const [data, setData]   = useState(null)
  const [loading, setLoad] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/complaints/${id}/track/`)
      .then(r => { setData(r.data); setLoad(false) })
      .catch(() => { setError('Could not load complaint.'); setLoad(false) })
  }, [id])

  if (loading) return <div style={{ minHeight: '100vh', background: '#F5F0E8' }}><Navbar /><div style={{ textAlign: 'center', padding: '80px', color: '#64748B' }}>Loading…</div></div>
  if (error)   return <div style={{ minHeight: '100vh', background: '#F5F0E8' }}><Navbar /><div style={{ textAlign: 'center', padding: '80px', color: '#C0392B' }}>{error}</div></div>

  const { complaint: c, history } = data
  const step    = STATUS_STEP[c.status] ?? 0
  const accent  = STATUS_COLOR[c.status] || '#B8860B'

  const steps = [
    { label: 'Filed',      desc: 'Complaint submitted by citizen' },
    { label: 'In Progress', desc: 'Assigned to officer for action' },
    { label: c.status === 'rejected' ? 'Rejected' : c.status === 'closed' ? 'Closed' : 'Resolved', desc: c.status === 'rejected' ? 'Marked as invalid or out of scope' : 'Issue resolved by officer' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <Navbar />

      {/* Top accent */}
      <div style={{ height: 5, background: accent }} />

      {/* Header */}
      <div style={{ background: '#0D1B2A', padding: '36px 0 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.12em', marginBottom: 10 }}>
            COMPLAINT #{c.id} · {c.category?.toUpperCase()}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px, 3vw, 34px)', color: '#F5F0E8', fontWeight: 700, marginBottom: 8 }}>{c.title}</h1>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`pill ${c.status}`}>{c.status}</span>
            <span style={{ color: '#475569', fontSize: 13 }}>📍 {c.location}</span>
            {c.ward && <span style={{ color: '#475569', fontSize: 13 }}>Ward {c.ward}</span>}
            <span style={{ color: '#475569', fontSize: 13 }}>
              Filed {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div style={s.body}>
        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Progress bar */}
          <div style={s.card}>
            <div style={s.cardLabel}>Status progress</div>
            <div style={s.progressSteps}>
              {steps.map((st, i) => {
                const done = i <= step
                const active = i === step
                return (
                  <div key={i} style={s.stepItem}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ ...s.stepCircle, background: done ? accent : '#E5E7EB', border: `2px solid ${done ? accent : '#E5E7EB'}` }}>
                        {done ? '✓' : ''}
                      </div>
                      {i < steps.length - 1 && <div style={{ ...s.stepLine, background: i < step ? accent : '#E5E7EB' }} />}
                    </div>
                    <div style={{ paddingTop: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: done ? '#0D1B2A' : '#9CA3AF' }}>{st.label}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{st.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Details */}
          <div style={s.card}>
            <div style={s.cardLabel}>Complaint details</div>
            <p style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.8 }}>{c.description}</p>
            {c.officer_remark && (
              <div style={s.remarkBox}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', marginBottom: 4, letterSpacing: '0.06em' }}>OFFICER REMARK</div>
                <div style={{ fontSize: 14, color: '#065F46' }}>{c.officer_remark}</div>
              </div>
            )}
            {c.assigned_to && (
              <div style={s.assignedBox}>
                <span style={{ fontSize: 12, color: '#64748B' }}>Assigned officer:</span>
                <strong style={{ fontSize: 13, color: '#0D1B2A', marginLeft: 6 }}>{c.assigned_to}</strong>
              </div>
            )}
          </div>

          {/* Attachments */}
          {(c.image || c.document) && (
            <div style={s.card}>
              <div style={s.cardLabel}>Attachments</div>
              {c.image && <img src={c.image} alt="complaint" style={{ width: '100%', borderRadius: 4, maxHeight: 300, objectFit: 'cover' }} />}
              {c.document && (
                <a href={c.document} target="_blank" rel="noreferrer" style={s.docLink}>
                  📄 View attached document (PDF)
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right col — timeline */}
        <div style={s.card}>
          <div style={s.cardLabel}>Status history</div>
          {history.length === 0 && <div style={{ fontSize: 13, color: '#9CA3AF' }}>No changes recorded yet.</div>}
          <div style={s.timeline}>
            {history.map((log, i) => (
              <div key={log.id} style={s.logItem}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ ...s.logDot, background: STATUS_COLOR[log.new_status] || '#6B7280' }} />
                  {i < history.length - 1 && <div style={s.logLine} />}
                </div>
                <div style={{ paddingBottom: i < history.length - 1 ? 20 : 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`pill ${log.new_status}`}>{log.new_status}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {new Date(log.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                    Changed by <strong>{log.changed_by || 'System'}</strong>
                    {log.old_status && <> · was <em>{log.old_status}</em></>}
                  </div>
                  {log.remark && <div style={s.logRemark}>{log.remark}</div>}
                </div>
              </div>
            ))}
          </div>
          <Link to="/my-complaints" style={s.backLink}>← Back to complaints</Link>
        </div>
      </div>
    </div>
  )
}

const s = {
  body: { maxWidth: 900, margin: '0 auto', padding: '28px 24px 60px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' },
  card: { background: '#fff', borderRadius: 6, padding: '24px', boxShadow: '0 2px 12px rgba(13,27,42,0.07)', display: 'flex', flexDirection: 'column', gap: 14 },
  cardLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#B8860B', textTransform: 'uppercase' },
  progressSteps: { display: 'flex', flexDirection: 'column', gap: 0 },
  stepItem: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  stepCircle: { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700, flexShrink: 0 },
  stepLine: { width: 2, height: 28, marginTop: 0 },
  remarkBox: { background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '12px 14px', borderRadius: 4 },
  assignedBox: { background: '#F8FAFC', padding: '10px 14px', borderRadius: 4, fontSize: 13 },
  docLink: { display: 'inline-block', color: '#1D4ED8', fontSize: 13, fontWeight: 600 },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  logItem: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  logDot: { width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 4 },
  logLine: { width: 2, flex: 1, background: '#E5E7EB', minHeight: 20 },
  logRemark: { fontSize: 12, color: '#4A5568', marginTop: 4, background: '#F8FAFC', padding: '6px 10px', borderRadius: 3 },
  backLink: { color: '#64748B', fontSize: 13, textDecoration: 'none', marginTop: 8 },
}
