import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'data', 'messages.json')

function ensureDataFile() {
  const dir = path.dirname(DATA_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, '[]')
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, email, type, message } = req.body
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' })

  try {
    ensureDataFile()
    const messages = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
    messages.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: String(name).slice(0, 200),
      email: String(email).slice(0, 200),
      type: String(type || 'Academic Institutions').slice(0, 100),
      message: String(message).slice(0, 4000),
      createdAt: new Date().toISOString(),
      read: false,
    })
    fs.writeFileSync(DATA_PATH, JSON.stringify(messages, null, 2))
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('contact save error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}
