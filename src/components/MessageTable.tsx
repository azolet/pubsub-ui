'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { StatsBar } from '@/components/StatsBar'
import { MessageDrawer } from '@/components/MessageDrawer'
import { Search, CheckCheck, X } from 'lucide-react'
import type { PubSubMessage, MessagesResponse } from '@/types'

const POLL_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 1000)

export function MessageTable() {
  const [messages, setMessages] = useState<PubSubMessage[]>([])
  const [stats, setStats] = useState({ total: 0, acked: 0, recent60s: 0 })
  const [search, setSearch] = useState('')
  const [paused, setPaused] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<PubSubMessage | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  const fetchMessages = useCallback(async () => {
    if (pausedRef.current) return
    try {
      const res = await fetch('/api/messages')
      if (!res.ok) return
      const data: MessagesResponse = await res.json()
      setMessages(data.messages)
      setStats(data.stats)
    } catch {
      // rete non disponibile, ignoriamo silenziosamente
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    const id = setInterval(fetchMessages, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchMessages])

  function handleAck(id: string) {
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, acked: true } : m))
    )
    setStats(prev => ({ ...prev, acked: prev.acked + 1 }))
    if (selectedMessage?.id === id) {
      setSelectedMessage(prev => prev ? { ...prev, acked: true } : null)
    }
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  async function handleBulkAck() {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    try {
      const res = await fetch('/api/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) return
      const { ackedCount } = await res.json()
      setMessages(prev =>
        prev.map(m => (ids.includes(m.id) ? { ...m, acked: true } : m))
      )
      setStats(prev => ({ ...prev, acked: prev.acked + ackedCount }))
      setSelectedIds(new Set())
    } catch {
      // ignoriamo silenziosamente
    }
  }

  async function handleClear() {
    await fetch('/api/messages', { method: 'DELETE' })
    setMessages([])
    setStats({ total: 0, acked: 0, recent60s: 0 })
    setSelectedIds(new Set())
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(filteredMessages, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pubsub-messages-${new Date().toISOString().slice(0, 19)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function openDrawer(msg: PubSubMessage) {
    setSelectedMessage(msg)
    setDrawerOpen(true)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredMessages = search.trim()
    ? messages.filter(m =>
        m.data.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase()) ||
        Object.values(m.attributes).some(v =>
          v.toLowerCase().includes(search.toLowerCase())
        )
      )
    : messages

  const unackedIds = filteredMessages.filter(m => !m.acked).map(m => m.id)
  const selectedVisible = unackedIds.filter(id => selectedIds.has(id))
  const allSelected = unackedIds.length > 0 && selectedVisible.length === unackedIds.length
  const someSelected = selectedVisible.length > 0 && !allSelected

  function handleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(unackedIds))
    }
  }

  return (
    <div className="space-y-4">
      <StatsBar
        stats={stats}
        paused={paused}
        onClear={handleClear}
        onExport={handleExport}
        onTogglePause={() => setPaused(p => !p)}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per data, ID o attributi..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/60 rounded-md border">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} {selectedIds.size === 1 ? 'messaggio selezionato' : 'messaggi selezionati'}
          </span>
          <Button size="sm" onClick={handleBulkAck}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Ack selezionati
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            <X className="h-4 w-4 mr-1" />
            Deseleziona
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={handleSelectAll}
                    disabled={unackedIds.length === 0}
                    aria-label="Seleziona tutti"
                  />
                </div>
              </TableHead>
              <TableHead className="w-32">ID</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead className="w-44">Publish Time</TableHead>
              <TableHead>Data preview</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMessages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  {messages.length === 0
                    ? 'Nessun messaggio ricevuto. Connettiti a una subscription.'
                    : 'Nessun risultato per la ricerca corrente.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMessages.map(msg => (
                <TableRow
                  key={msg.id}
                  className="cursor-pointer"
                  onClick={() => openDrawer(msg)}
                  data-selected={selectedIds.has(msg.id) ? 'true' : undefined}
                >
                  <TableCell>
                    <div
                      className="flex items-center justify-center"
                      onClick={e => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.has(msg.id)}
                        onCheckedChange={() => toggleSelect(msg.id)}
                        disabled={msg.acked}
                        aria-label={`Seleziona messaggio ${msg.id}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {msg.id.slice(0, 10)}…
                  </TableCell>
                  <TableCell className="text-sm">{msg.subscriptionName}</TableCell>
                  <TableCell className="text-xs font-mono whitespace-nowrap">
                    {formatTime(msg.publishTime)}
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-xs">
                    <span className="truncate block">{msg.data.slice(0, 80)}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    {msg.acked ? (
                      <Badge variant="success" className="text-xs">Acked</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredMessages.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {filteredMessages.length} messaggi
          {search && ` (filtrati da ${messages.length})`}
        </p>
      )}

      <MessageDrawer
        message={selectedMessage}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAck={handleAck}
      />
    </div>
  )
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}
