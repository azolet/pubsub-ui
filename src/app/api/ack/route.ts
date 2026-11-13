import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { ackPubSubMessage } from '@/lib/pubsub'

export async function POST(request: Request) {
  const body = await request.json()
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : []

  let ackedCount = 0
  for (const id of ids) {
    if (store.ack(id)) {
      ackPubSubMessage(id)
      ackedCount++
    }
  }

  return NextResponse.json({ ok: true, ackedCount })
}
