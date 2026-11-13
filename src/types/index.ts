export interface PubSubMessage {
  id: string
  subscriptionName: string
  data: string
  attributes: Record<string, string>
  publishTime: string
  receivedAt: string
  acked: boolean
}

export interface SessionData {
  username: string
  isLoggedIn: boolean
}

export interface MessagesResponse {
  messages: PubSubMessage[]
  stats: {
    total: number
    acked: number
    recent60s: number
  }
  activeSubscription: string | null
}
