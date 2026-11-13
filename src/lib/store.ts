import type { PubSubMessage } from '@/types'

class MessageStore {
  private messages: Map<string, PubSubMessage> = new Map()
  private orderedIds: string[] = []
  private readonly MAX = Number(process.env.MAX_MESSAGES ?? 500)

  add(msg: PubSubMessage): void {
    if (this.messages.has(msg.id)) return
    this.messages.set(msg.id, msg)
    this.orderedIds.unshift(msg.id)
    if (this.orderedIds.length > this.MAX) {
      const removed = this.orderedIds.pop()!
      this.messages.delete(removed)
    }
  }

  ack(id: string): boolean {
    const msg = this.messages.get(id)
    if (!msg) return false
    msg.acked = true
    return true
  }

  getAll(): PubSubMessage[] {
    return this.orderedIds.map(id => this.messages.get(id)!)
  }

  clear(): void {
    this.messages.clear()
    this.orderedIds = []
  }

  getStats(): { total: number; acked: number; recent60s: number } {
    const cutoff = Date.now() - 60_000
    let acked = 0
    let recent60s = 0
    for (const msg of this.messages.values()) {
      if (msg.acked) acked++
      if (new Date(msg.receivedAt).getTime() > cutoff) recent60s++
    }
    return { total: this.messages.size, acked, recent60s }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __messageStore: MessageStore | undefined
}

export const store: MessageStore =
  global.__messageStore ?? (global.__messageStore = new MessageStore())
