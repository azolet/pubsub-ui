import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { ackPubSubMessage } from '@/lib/pubsub'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = store.ack(id)

  if (!found) {
    return NextResponse.json({ error: 'Messaggio non trovato' }, { status: 404 })
  }

  ackPubSubMessage(id)
  return NextResponse.json({ ok: true, id })
}
