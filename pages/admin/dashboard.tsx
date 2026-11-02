import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'
import { verifyToken } from '../../lib/auth'

interface Message {
  id: string
  name: string
  email: string
  type: string
  message: string
  createdAt: string
  read: boolean
}

const TYPE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  'Academic Institutions': { bg: 'rgba(71,107,87,0.1)',  color: '#3A5E49', border: 'rgba(71,107,87,0.22)' },
  'Clinic Partnership':    { bg: 'rgba(196,149,90,0.1)', color: '#9B7038', border: 'rgba(196,149,90,0.22)' },
  'Patient Enquiry':       { bg: 'rgba(184,114,94,0.1)', color: '#9E5D4C', border: 'rgba(184,114,94,0.22)' },
}

function typeBadge(type: string) {
  const s = TYPE_STYLE[type] || { bg: 'rgba(28,40,32,0.07)', color: '#1C2820', border: 'rgba(28,40,32,0.15)' }
  return (
    <span style={{ display: 'inline-block', padding: '.22rem .75rem', borderRadius: 100, fontSize: '.65rem', fontWeight: 500, letterSpacing: '.04em', background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {type}
    </span>
  )
}

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function exportCSV(messages: Message[]) {
  const rows = [
    ['ID', 'Name', 'Email', 'Type', 'Message', 'Date', 'Read'],
    ...messages.map(m => [m.id, m.name, m.email, m.type, m.message.replace(/\n/g, ' '), fmt(m.createdAt), m.read ? 'Yes' : 'No']),
  ]
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `pid-messages-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

const TABS = ['All', 'Unread', 'Academic Institutions', 'Clinic Partnership', 'Patient Enquiry']

export default function Dashboard() {
  const [all, setAll] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/messages')
      if (r.status === 401) { window.location.href = '/admin'; return }
      setAll(await r.json())
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = all.filter(m => {
    if (tab === 'Unread' && m.read) return false
    if (!['All', 'Unread'].includes(tab) && m.type !== tab) return false
    if (search) {
      const q = search.toLowerCase()
      if (!m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q) && !m.message.toLowerCase().includes(q)) return false
    }
    return true
  })

  const stats = {
    total:    all.length,
    unread:   all.filter(m => !m.read).length,
    academic: all.filter(m => m.type === 'Academic Institutions').length,
    clinic:   all.filter(m => m.type === 'Clinic Partnership').length,
    patient:  all.filter(m => m.type === 'Patient Enquiry').length,
  }

  const toggleRead = async (m: Message) => {
    setBusy(m.id)
    await fetch(`/api/admin/messages/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: !m.read }),
    })
    setAll(prev => prev.map(x => x.id === m.id ? { ...x, read: !m.read } : x))
    setBusy(null)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this message?')) return
    setBusy(id)
    await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' })
    setAll(prev => prev.filter(x => x.id !== id))
    if (expanded === id) setExpanded(null)
    setBusy(null)
  }

  const markAllRead = async () => {
    await fetch('/api/admin/messages', { method: 'PATCH' })
    setAll(prev => prev.map(m => ({ ...m, read: true })))
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin'
  }

  return (
    <>
      <Head>
        <title>Dashboard · Admin · PID</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#F3EDE4', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* ── Top nav ── */}
        <nav style={{ background: '#2B4D3F', padding: '0 2.4rem', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '.95rem', fontWeight: 300, color: '#FAF8F4', letterSpacing: '.01em' }}>
              Precision Index <span style={{ fontStyle: 'italic', color: '#B8725E', fontFamily: "'Playfair Display', Georgia, serif" }}>Discovery</span>
            </span>
            <span style={{ fontSize: '.55rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(250,248,244,0.35)', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>/ Admin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href="/" target="_blank" style={{ fontSize: '.75rem', color: 'rgba(250,248,244,0.45)', textDecoration: 'none', letterSpacing: '.03em' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(250,248,244,0.8)') }
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,248,244,0.45)') }
            >View site ↗</a>
            <button onClick={logout} style={{ background: 'rgba(250,248,244,0.08)', border: '1px solid rgba(250,248,244,0.14)', borderRadius: 8, color: 'rgba(250,248,244,0.6)', fontSize: '.75rem', padding: '.4rem .9rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(184,114,94,0.2)'; (e.currentTarget as HTMLButtonElement).style.color = '#FAF8F4' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(250,248,244,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(250,248,244,0.6)' }}
            >Logout</button>
          </div>
        </nav>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.4rem 1.6rem' }}>

          {/* ── Stats row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total',    val: stats.total,    accent: '#2B4D3F' },
              { label: 'Unread',   val: stats.unread,   accent: '#B8725E' },
              { label: 'Academic', val: stats.academic, accent: '#476B57' },
              { label: 'Clinic',   val: stats.clinic,   accent: '#C4955A' },
              { label: 'Patient',  val: stats.patient,  accent: '#B8725E' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '1.2rem 1.4rem', border: '1px solid rgba(43,77,63,0.07)', boxShadow: '0 2px 8px rgba(43,77,63,0.05)' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: 300, color: s.accent, lineHeight: 1, marginBottom: '.3rem' }}>{s.val}</div>
                <div style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(28,40,32,0.38)', fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Controls row ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.4rem', flexWrap: 'wrap' }}>
            {/* Filter tabs */}
            <div style={{ display: 'flex', background: '#fff', borderRadius: 10, border: '1px solid rgba(43,77,63,0.08)', padding: '.25rem', gap: '.2rem', flexWrap: 'wrap' }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: '.38rem .85rem', borderRadius: 7, border: 'none', background: tab === t ? '#2B4D3F' : 'transparent', color: tab === t ? '#FAF8F4' : 'rgba(28,40,32,0.48)', fontSize: '.75rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === t ? 500 : 300, transition: 'all .18s', whiteSpace: 'nowrap' }}>
                  {t}{t === 'Unread' && stats.unread > 0 ? ` (${stats.unread})` : ''}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="search" placeholder="Search name, email, message…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '.55rem 1rem', background: '#fff', border: '1px solid rgba(43,77,63,0.1)', borderRadius: 10, fontSize: '.83rem', fontFamily: 'inherit', color: '#1C2820', outline: 'none' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(43,77,63,0.35)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(43,77,63,0.1)')}
            />

            {/* Actions */}
            {stats.unread > 0 && (
              <button onClick={markAllRead}
                style={{ padding: '.5rem 1rem', borderRadius: 9, border: '1px solid rgba(43,77,63,0.15)', background: 'transparent', color: '#476B57', fontSize: '.75rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(43,77,63,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >Mark all read</button>
            )}
            {all.length > 0 && (
              <button onClick={() => exportCSV(all)}
                style={{ padding: '.5rem 1rem', borderRadius: 9, border: '1px solid rgba(196,149,90,0.25)', background: 'rgba(196,149,90,0.06)', color: '#9B7038', fontSize: '.75rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(196,149,90,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(196,149,90,0.06)' }}
              >Export CSV ↓</button>
            )}
          </div>

          {/* ── Message list ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(28,40,32,0.3)', fontSize: '.85rem' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(28,40,32,0.3)', fontSize: '.85rem' }}>
              {all.length === 0 ? 'No messages yet. They will appear here when someone submits the contact form.' : 'No messages match this filter.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {filtered.map(m => {
                const isExpanded = expanded === m.id
                return (
                  <div key={m.id}
                    style={{ background: '#fff', borderRadius: 14, border: `1px solid ${m.read ? 'rgba(43,77,63,0.07)' : 'rgba(43,77,63,0.18)'}`, boxShadow: m.read ? 'none' : '0 2px 12px rgba(43,77,63,0.07)', transition: 'all .2s', opacity: busy === m.id ? .5 : 1 }}>

                    {/* Header row */}
                    <div
                      onClick={() => setExpanded(isExpanded ? null : m.id)}
                      style={{ padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', flexWrap: 'wrap' }}>
                      {/* Unread dot */}
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.read ? 'transparent' : '#B8725E', border: m.read ? '1.5px solid rgba(28,40,32,0.15)' : 'none', flexShrink: 0 }} />

                      {typeBadge(m.type)}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '.9rem', fontWeight: m.read ? 300 : 500, color: '#1C2820', marginRight: '.6rem' }}>{m.name}</span>
                        <a href={`mailto:${m.email}`} onClick={e => e.stopPropagation()}
                          style={{ fontSize: '.8rem', color: '#476B57', textDecoration: 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                        >{m.email}</a>
                      </div>

                      <span style={{ fontSize: '.72rem', color: 'rgba(28,40,32,0.35)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>{fmt(m.createdAt)}</span>

                      <span style={{ fontSize: '.8rem', color: 'rgba(28,40,32,0.25)', marginLeft: '.4rem' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {/* Preview (when collapsed) */}
                    {!isExpanded && (
                      <div style={{ padding: '0 1.4rem .85rem 3.2rem', fontSize: '.83rem', color: 'rgba(28,40,32,0.42)', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                        {m.message}
                      </div>
                    )}

                    {/* Expanded content */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid rgba(43,77,63,0.07)', padding: '1.2rem 1.4rem 1.4rem' }}>
                        <p style={{ fontSize: '.88rem', color: 'rgba(28,40,32,0.68)', lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: '1.2rem' }}>{m.message}</p>
                        <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>
                          <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.type)} — Precision Index Discovery`}
                            style={{ padding: '.48rem 1.1rem', borderRadius: 8, background: '#2B4D3F', color: '#FAF8F4', fontSize: '.78rem', textDecoration: 'none', fontFamily: 'inherit', transition: 'background .2s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#3D6655')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#2B4D3F')}
                          >Reply ↗</a>
                          <button onClick={() => toggleRead(m)}
                            style={{ padding: '.48rem 1.1rem', borderRadius: 8, border: '1px solid rgba(43,77,63,0.16)', background: 'transparent', color: '#476B57', fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(43,77,63,0.06)'}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                          >{m.read ? 'Mark unread' : 'Mark read'}</button>
                          <button onClick={() => del(m.id)}
                            style={{ padding: '.48rem 1.1rem', borderRadius: 8, border: '1px solid rgba(184,114,94,0.2)', background: 'transparent', color: '#B8725E', fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', marginLeft: 'auto' }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(184,114,94,0.07)'}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                          >Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '.68rem', color: 'rgba(28,40,32,0.22)', letterSpacing: '.04em' }}>
            Precision Index Discovery · CCK, Karolinska University Hospital · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const token = req.cookies?.pid_admin
  if (!token || !verifyToken(token)) {
    return { redirect: { destination: '/admin', permanent: false } }
  }
  return { props: {} }
}
