import { useState } from 'react'
import Head from 'next/head'

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (r.ok) {
        window.location.href = '/admin/dashboard'
      } else {
        const d = await r.json()
        setError(d.error || 'Invalid credentials')
      }
    } catch {
      setError('Connection error')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%',
    padding: '.9rem 1.1rem',
    background: 'rgba(43,77,63,0.04)',
    border: '1px solid rgba(43,77,63,0.14)',
    borderRadius: 10,
    fontSize: '.9rem',
    color: '#1C2820',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color .2s',
  }

  return (
    <>
      <Head>
        <title>Admin · Precision Index Discovery</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2.8rem' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 300, color: '#1C2820', letterSpacing: '.01em', marginBottom: '.4rem' }}>
              Precision Index <span style={{ fontStyle: 'italic', color: '#B8725E', fontFamily: "'Playfair Display', Georgia, serif" }}>Discovery</span>
            </div>
            <div style={{ fontSize: '.58rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'rgba(28,40,32,0.32)', fontFamily: "'JetBrains Mono', monospace" }}>Admin Portal</div>
          </div>

          {/* Card */}
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(43,77,63,0.08)', padding: '2.4rem', boxShadow: '0 4px 40px rgba(43,77,63,0.07)' }}>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(28,40,32,0.35)', marginBottom: '.5rem' }}>Email</label>
                <input
                  type="email" required autoFocus
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={inp}
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(43,77,63,0.4)' }}
                  onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(43,77,63,0.14)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(28,40,32,0.35)', marginBottom: '.5rem' }}>Password</label>
                <input
                  type="password" required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={inp}
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(43,77,63,0.4)' }}
                  onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(43,77,63,0.14)' }}
                />
              </div>

              {error && (
                <div style={{ padding: '.75rem 1rem', background: 'rgba(184,114,94,0.08)', border: '1px solid rgba(184,114,94,0.2)', borderRadius: 8, fontSize: '.82rem', color: '#B8725E' }}>
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                style={{ marginTop: '.4rem', background: '#2B4D3F', color: '#FAF8F4', border: 'none', borderRadius: 10, padding: '1rem', fontSize: '.88rem', fontWeight: 400, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .65 : 1, fontFamily: 'inherit', transition: 'all .25s', letterSpacing: '.02em' }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#3D6655' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2B4D3F' }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.72rem', color: 'rgba(28,40,32,0.28)' }}>
            CCK · Karolinska University Hospital · Stockholm
          </p>
        </div>
      </div>
    </>
  )
}
