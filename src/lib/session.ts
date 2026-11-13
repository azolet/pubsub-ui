import type { SessionOptions } from 'iron-session'
import type { SessionData } from '@/types'

export type { SessionData }

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? 'fallback-dev-secret-change-in-production!!',
  cookieName: 'pubsub-ui-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}
