import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { verifyToken } from '../../../lib/auth'

const DATA_PATH = path.join(process.cwd(), 'data', 'messages.json')

function readMessages() {
  if (!fs.existsSync(DATA_PATH)) return []
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
}

function writeMessages(messages: unknown[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(messages, null, 2))
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies?.pid_admin
  if (!token || !verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    try {
      let messages = readMessages()
      const { type, search, unread } = req.query

      if (type && type !== 'all') {
        messages = messages.filter((m: { type: string }) => m.type === type)
      }
      if (unread === 'true') {
        messages = messages.filter((m: { read: boolean }) => !m.read)
      }
      if (search) {
        const q = (search as string).toLowerCase()
        messages = messages.filter((m: { name: string; email: string; message: string }) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
        )
      }

      messages.sort((a: { createdAt: string }, b: { createdAt: string }) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      res.status(200).json(messages)
    } catch {
      res.status(500).json({ error: 'Failed to read' })
    }

  } else if (req.method === 'PATCH') {
    // Mark all as read
    try {
      const messages = readMessages().map((m: { read: boolean }) => ({ ...m, read: true }))
      writeMessages(messages)
      res.status(200).json({ ok: true })
    } catch {
      res.status(500).json({ error: 'Failed to update' })
    }

  } else {
    res.status(405).end()
  }
}
