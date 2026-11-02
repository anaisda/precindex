import crypto from 'crypto'

const SECRET = process.env.ADMIN_SECRET || 'pid-karolinska-cck-secret-2026'

export function createToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + 24 * 60 * 60 * 1000 })
  ).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyToken(token: string): { email: string } | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot < 0) return null
    const payload = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
    if (sig !== expected) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data.exp || data.exp < Date.now()) return null
    return { email: data.email }
  } catch {
    return null
  }
}
