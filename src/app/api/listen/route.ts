import { NextResponse } from 'next/server'
import { startListening } from '@/lib/pubsub'

export async function POST(request: Request) {
  try {
    const { subscription } = await request.json()

    if (!subscription || typeof subscription !== 'string') {
      return NextResponse.json({ error: 'subscription obbligatoria' }, { status: 400 })
    }

    startListening(subscription)
    return NextResponse.json({ ok: true, subscription })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE() {
  const { stopListening } = await import('@/lib/pubsub')
  stopListening()
  return NextResponse.json({ ok: true })
}
