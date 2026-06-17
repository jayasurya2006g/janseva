import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const categories = [
  { value: 'roads',       label: 'Roads & Potholes' },
  { value: 'water',       label: 'Water Supply' },
  { value: 'sanitation',  label: 'Sanitation' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'other',       label: 'Other' },
]

export default function SubmitPage() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ title: '', description: '', category: '', location: '', ward: '' })
  const [image, setImage]   = useState(null)
  const [doc, setDoc]       = useState(null)
  const [preview, setPrev]  = useState(null)
  const [loading, setLoad]  = useState(false)
  const [error, setError]   = useState('')
  const [success, setSucc]  = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleImg = e => {
    const f = e.target.files[0]
    if (f) { setImage(f); setPrev(URL.createObjectURL(f)) }
  }

  const submit = async e => {
    e.preventDefault(); setLoad(true); setError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (image) fd.append('image', image)
    if (doc)   fd.append('document', doc)
    try {
      await api.post('/complaints/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSucc(true)
      setTimeout(() => navigate('/my-complaints'), 2000)
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'string' ? d : JSON.stringify(d) || 'Submission failed.')
    } finally { setLoad(false) }
  }

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <Navbar />
      <div style={{ maxWidth: 520, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#0D1B2A', marginBottom: 12 }}>Complaint filed.</h2>
        <p style={{ color: '#64748B', fontSize: 15 }}>Your complaint has been submitted and is pending review by the administrator. Redirecting…</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <Navbar />

      {/* Page header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div className="sec-label">Citizen complaint</div>
          <h1 style={s.pageTitle}>File a complaint</h1>
          <p style={s.pageSub}>Describe the issue clearly. Attach a photo or document as evidence.</p>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.formCard}>
          <form onSubmit={submit} style={s.form}>

            {/* Row 1 */}
            <div className="fg" style={{ gridColumn: '1 / -1' }}>
              <label>Complaint title</label>
              <input name="title" value={form.title} onChange={handle} placeholder="e.g. Large pothole on MG Road near bus stop" required />
            </div>

            <div className="fg">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handle} required>
                <option value="">Select a category</option>
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className="fg">
              <label>Ward number</label>
              <input name="ward" value={form.ward} onChange={handle} placeholder="e.g. Ward 12" />
            </div>

            <div className="fg" style={{ gridColumn: '1 / -1' }}>
              <label>Location / Address</label>
              <input name="location" value={form.location} onChange={handle} placeholder="Street name, landmark, area" required />
            </div>

            <div className="fg" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handle}
                rows={5} placeholder="Describe the issue in detail — how long it has existed, who is affected, severity, etc." required
                style={{ resize: 'vertical' }} />
            </div>

            {/* File uploads */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={s.uploadRow}>
                {/* Image */}
                <div style={s.uploadBox}>
                  <label style={s.uploadLabel} htmlFor="img-upload">
                    <span style={{ fontSize: 28 }}>🖼</span>
                    <div style={s.uploadTitle}>Attach photo</div>
                    <div style={s.uploadHint}>JPEG · PNG · WebP · Max 5 MB</div>
                  </label>
                  <input id="img-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImg} style={{ display: 'none' }} />
                  {preview && <img src={preview} alt="preview" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 4, marginTop: 10 }} />}
                  {image && <div style={s.fileName}>📎 {image.name}</div>}
                </div>

                {/* Document */}
                <div style={s.uploadBox}>
                  <label style={s.uploadLabel} htmlFor="doc-upload">
                    <span style={{ fontSize: 28 }}>📄</span>
                    <div style={s.uploadTitle}>Attach document</div>
                    <div style={s.uploadHint}>PDF only · Max 10 MB</div>
                  </label>
                  <input id="doc-upload" type="file" accept="application/pdf" onChange={e => setDoc(e.target.files[0])} style={{ display: 'none' }} />
                  {doc && <div style={s.fileName}>📎 {doc.name}</div>}
                </div>
              </div>
            </div>

            {error && <div style={{ ...s.errBox, gridColumn: '1 / -1' }}>{error}</div>}

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => navigate('/home')} style={s.cancelBtn}>Cancel</button>
              <button type="submit" disabled={loading} style={s.submitBtn}>
                {loading ? 'Submitting…' : 'Submit complaint →'}
              </button>
            </div>
          </form>
        </div>

        {/* Side info */}
        <div style={s.sideInfo}>
          <div style={s.sideCard}>
            <div style={s.sideTitleRow}>📌 What happens next?</div>
            {['Your complaint is received and marked Pending.', 'Admin reviews and assigns it to a ward officer.', 'Officer investigates and updates status.', 'You track progress in real time.'].map((t, i) => (
              <div key={i} style={s.sideStep}>
                <div style={s.sideNum}>{i + 1}</div>
                <span style={{ fontSize: 13, color: '#4A5568' }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ ...s.sideCard, marginTop: 16, background: '#FEF3C7', border: '1px solid #FDE68A' }}>
            <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.7 }}>
              <strong>Tip:</strong> A clear photo as evidence speeds up resolution significantly. Always mention the exact location and how long the issue has existed.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  header: { background: '#0D1B2A', padding: '40px 0 36px' },
  headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 700, color: '#F5F0E8', marginBottom: 8 },
  pageSub: { color: '#64748B', fontSize: 14 },
  body: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' },
  formCard: { background: '#fff', borderRadius: 6, padding: '32px', boxShadow: '0 2px 12px rgba(13,27,42,0.08)' },
  form: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  uploadRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  uploadBox: { border: '1.5px dashed #D0C8BC', borderRadius: 6, padding: '20px', background: '#FAFAF8' },
  uploadLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', textAlign: 'center' },
  uploadTitle: { fontSize: 13, fontWeight: 600, color: '#0D1B2A' },
  uploadHint: { fontSize: 11, color: '#9CA3AF' },
  fileName: { fontSize: 12, color: '#1A7F4B', marginTop: 8, wordBreak: 'break-all' },
  errBox: { background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: 4, fontSize: 13 },
  cancelBtn: { background: 'transparent', border: '1.5px solid #D0C8BC', color: '#64748B', padding: '12px 24px', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn: { background: '#0D1B2A', color: '#F5F0E8', border: 'none', padding: '12px 28px', borderRadius: 4, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  sideInfo: { position: 'sticky', top: 80 },
  sideCard: { background: '#fff', borderRadius: 6, padding: '20px', boxShadow: '0 2px 8px rgba(13,27,42,0.06)' },
  sideTitleRow: { fontSize: 13, fontWeight: 700, color: '#0D1B2A', marginBottom: 16 },
  sideStep: { display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 },
  sideNum: { width: 22, height: 22, borderRadius: '50%', background: '#0D1B2A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 },
}
