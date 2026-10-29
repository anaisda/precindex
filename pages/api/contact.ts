import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { name, email, type, message } = req.body
  console.log('PID contact:', { name, email, type, message })
  res.status(200).json({ ok: true })
}
