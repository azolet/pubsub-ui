'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle, Copy, Check } from 'lucide-react'
import type { PubSubMessage } from '@/types'

interface MessageDrawerProps {
  message: PubSubMessage | null
  open: boolean
  onClose: () => void
  onAck: (id: string) => void
}

export function MessageDrawer({ message, open, onClose, onAck }: MessageDrawerProps) {
  const [acking, setAcking] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedData, setCopiedData] = useState(false)

  async function handleAck() {
    if (!message || message.acked) return
    setAcking(true)
    try {
      const res = await fetch(`/api/ack/${encodeURIComponent(message.id)}`, { method: 'POST' })
      if (res.ok) onAck(message.id)
    } finally {
      setAcking(false)
    }
  }

  function copyToClipboard(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setter(true)
      setTimeout(() => setter(false), 1500)
    })
  }

  function prettyJson(raw: string): string {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
      return raw
    }
  }

  if (!message) return null

  const isJson = (() => {
    try {
      JSON.parse(message.data)
      return true
    } catch {
      return false
    }
  })()

  return (
    <Sheet open={open} onOpenChange={open => !open && onClose()}>
      <SheetContent className="flex flex-col w-full sm:max-w-xl overflow-hidden">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            Dettaglio messaggio
            {message.acked && (
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" /> Acked
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Subscription: <span className="font-medium text-foreground">{message.subscriptionName}</span>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 pb-6">
            {/* ID */}
            <Section label="ID">
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 break-all">
                  {message.id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => copyToClipboard(message.id, setCopiedId)}
                >
                  {copiedId ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </Section>

            <Separator />

            {/* Timestamps */}
            <Section label="Publish Time">
              <span className="text-sm font-mono">{formatDate(message.publishTime)}</span>
            </Section>
            <Section label="Received At">
              <span className="text-sm font-mono">{formatDate(message.receivedAt)}</span>
            </Section>

            {/* Attributes */}
            {Object.keys(message.attributes).length > 0 && (
              <>
                <Separator />
                <Section label="Attributi">
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(message.attributes).map(([k, v]) => (
                      <Badge key={k} variant="secondary" className="font-mono text-xs">
                        {k}={v}
                      </Badge>
                    ))}
                  </div>
                </Section>
              </>
            )}

            <Separator />

            {/* Data */}
            <Section
              label={`Data ${isJson ? '(JSON)' : '(plain text)'}`}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => copyToClipboard(message.data, setCopiedData)}
                >
                  {copiedData ? (
                    <><Check className="h-3 w-3 mr-1 text-green-600" /> Copiato</>
                  ) : (
                    <><Copy className="h-3 w-3 mr-1" /> Copia</>
                  )}
                </Button>
              }
            >
              <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-96">
                {prettyJson(message.data)}
              </pre>
            </Section>
          </div>
        </ScrollArea>

        {/* Footer azione */}
        <div className="flex-shrink-0 pt-4 border-t">
          <Button
            className="w-full"
            onClick={handleAck}
            disabled={message.acked || acking}
            variant={message.acked ? 'secondary' : 'default'}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {message.acked ? 'Già acked' : acking ? 'Acking...' : 'Ack messaggio'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Section({
  label,
  children,
  action,
}: {
  label: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {action}
      </div>
      {children}
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
  } catch {
    return iso
  }
}
