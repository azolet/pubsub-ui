import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getActiveSubscription } from '@/lib/pubsub'

export async function GET() {
  return NextResponse.json({
    messages: store.getAll(),
    stats: store.getStats(),
    activeSubscription: getActiveSubscription(),
  })
}

export async function DELETE() {
  store.clear()
  return NextResponse.json({ ok: true })
}
