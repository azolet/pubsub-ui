import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sessionOptions } from '@/lib/session'
import type { SessionData } from '@/types'

interface AuthUser {
  username: string
  password: string
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username e password obbligatori' }, { status: 400 })
    }

    const rawUsers = process.env.AUTH_USERS
    if (!rawUsers) {
      return NextResponse.json({ error: 'AUTH_USERS non configurato' }, { status: 500 })
    }

    const users: AuthUser[] = JSON.parse(rawUsers)
    const user = users.find(u => u.username === username && u.password === password)

    if (!user) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 })
    }

    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    session.username = username
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json({ ok: true, username })
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
