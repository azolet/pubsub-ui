import { PubSub } from '@google-cloud/pubsub'
import type { Message } from '@google-cloud/pubsub'
import { store } from './store'
import type { PubSubMessage } from '@/types'

type Subscription = ReturnType<PubSub['subscription']>

declare global {
  // eslint-disable-next-line no-var
  var __pubsubClient: PubSub | undefined
  // eslint-disable-next-line no-var
  var __activeSubscription: Subscription | null
  // eslint-disable-next-line no-var
  var __activeSubName: string | null
  // eslint-disable-next-line no-var
  var __pendingMessages: Map<string, Message> | undefined
}

function getClient(): PubSub {
  if (!global.__pubsubClient) {
    global.__pubsubClient = new PubSub({
      projectId: process.env.PUBSUB_PROJECT_ID,
    })
  }
  return global.__pubsubClient
}

export async function getSubscriptions(): Promise<string[]> {
  const pubsub = getClient()
  const [subs] = await pubsub.getSubscriptions()
  return subs.map(s => s.name.split('/').pop()!)
}

export function startListening(subName: string): void {
  stopListening()
  store.clear()

  if (!global.__pendingMessages) {
    global.__pendingMessages = new Map()
  } else {
    global.__pendingMessages.clear()
  }

  const pubsub = getClient()
  const subscription = pubsub.subscription(subName)

  global.__activeSubscription = subscription
  global.__activeSubName = subName

  subscription.on('message', message => {
    global.__pendingMessages!.set(message.id, message)

    const msg: PubSubMessage = {
      id: message.id,
      subscriptionName: subName,
      data: message.data.toString(),
      attributes: (message.attributes ?? {}) as Record<string, string>,
      publishTime:
        typeof (message.publishTime as unknown as { toISOString?: () => string })?.toISOString ===
        'function'
          ? (message.publishTime as unknown as { toISOString: () => string }).toISOString()
          : String(message.publishTime),
      receivedAt: new Date().toISOString(),
      acked: false,
    }
    store.add(msg)
  })

  subscription.on('error', err => {
    console.error('[PubSub] Error on', subName, err.message)
  })
}

export function ackPubSubMessage(id: string): void {
  const message = global.__pendingMessages?.get(id)
  if (message) {
    try {
      message.ack()
    } catch {
      // già acked o deadline scaduta — ignoriamo
    }
    global.__pendingMessages!.delete(id)
  }
}

export function stopListening(): void {
  if (global.__activeSubscription) {
    global.__activeSubscription.removeAllListeners()
    global.__activeSubscription = null
    global.__activeSubName = null
  }
  global.__pendingMessages?.clear()
}

export function getActiveSubscription(): string | null {
  return global.__activeSubName ?? null
}
