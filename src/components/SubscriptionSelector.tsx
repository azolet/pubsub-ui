'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Radio, WifiOff, RefreshCw } from 'lucide-react'

export function SubscriptionSelector() {
  const [subscriptions, setSubscriptions] = useState<string[]>([])
  const [selected, setSelected] = useState<string>('')
  const [active, setActive] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSubs, setLoadingSubs] = useState(false)

  async function loadSubscriptions() {
    setLoadingSubs(true)
    try {
      const res = await fetch('/api/subscriptions')
      const data = await res.json()
      if (Array.isArray(data)) {
        setSubscriptions(data)
        if (data.length > 0 && !selected) setSelected(data[0])
      }
    } catch (err) {
      console.error('Errore caricamento subscriptions:', err)
    } finally {
      setLoadingSubs(false)
    }
  }

  useEffect(() => {
    loadSubscriptions()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function connect() {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('/api/listen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: selected }),
      })
      if (res.ok) setActive(selected)
    } catch (err) {
      console.error('Errore connessione:', err)
    } finally {
      setLoading(false)
    }
  }

  async function disconnect() {
    await fetch('/api/listen', { method: 'DELETE' })
    setActive(null)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select value={selected} onValueChange={setSelected} disabled={!!active}>
        <SelectTrigger className="w-80">
          <SelectValue placeholder="Seleziona subscription..." />
        </SelectTrigger>
        <SelectContent>
          {subscriptions.map(sub => (
            <SelectItem key={sub} value={sub}>
              {sub}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={loadSubscriptions}
        disabled={loadingSubs || !!active}
        title="Ricarica lista"
      >
        <RefreshCw className={`h-4 w-4 ${loadingSubs ? 'animate-spin' : ''}`} />
      </Button>

      {active ? (
        <>
          <Badge variant="success" className="gap-1 px-3 py-1">
            <Radio className="h-3 w-3 animate-pulse" /> Live
          </Badge>
          <Button variant="outline" size="sm" onClick={disconnect}>
            <WifiOff className="h-4 w-4 mr-1" />
            Disconnetti
          </Button>
        </>
      ) : (
        <Button onClick={connect} disabled={!selected || loading}>
          {loading ? 'Connessione...' : 'Connetti'}
        </Button>
      )}
    </div>
  )
}
