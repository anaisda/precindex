import type { NextApiRequest, NextApiResponse } from 'next'
import { createToken } from '../../../lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password } = req.body || {}

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = createToken(email)
  res.setHeader(
    'Set-Cookie',
    `pid_admin=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 3600}`
  )
  res.status(200).json({ ok: true })
}
