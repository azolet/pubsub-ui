import { NextResponse } from 'next/server'
import { getSubscriptions } from '@/lib/pubsub'

export async function GET() {
  try {
    const subs = await getSubscriptions()
    return NextResponse.json(subs)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
