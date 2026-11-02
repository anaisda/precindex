import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  res.setHeader('Set-Cookie', 'pid_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
  res.status(200).json({ ok: true })
}
