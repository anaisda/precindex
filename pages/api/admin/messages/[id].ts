import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { verifyToken } from '../../../../lib/auth'

const DATA_PATH = path.join(process.cwd(), 'data', 'messages.json')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies?.pid_admin
  if (!token || !verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing id' })

  let messages: Array<Record<string, unknown>> = []
  try {
    messages = fs.existsSync(DATA_PATH)
      ? JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
      : []
  } catch {
    return res.status(500).json({ error: 'Read error' })
  }

  if (req.method === 'PATCH') {
    const { read } = req.body
    const updated = messages.map(m => m.id === id ? { ...m, read: Boolean(read) } : m)
    fs.writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2))
    return res.status(200).json({ ok: true })

  } else if (req.method === 'DELETE') {
    const filtered = messages.filter(m => m.id !== id)
    fs.writeFileSync(DATA_PATH, JSON.stringify(filtered, null, 2))
    return res.status(200).json({ ok: true })

  } else {
    return res.status(405).end()
  }
}
