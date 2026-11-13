'use client'

import { Button } from '@/components/ui/button'
import { Trash2, Download, Pause, Play } from 'lucide-react'

interface StatsBarProps {
  stats: { total: number; acked: number; recent60s: number }
  paused: boolean
  onClear: () => void
  onExport: () => void
  onTogglePause: () => void
}

export function StatsBar({ stats, paused, onClear, onExport, onTogglePause }: StatsBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-6">
        <StatCard label="Totale" value={stats.total} />
        <StatCard label="Acked" value={stats.acked} color="text-green-600" />
        <StatCard label="Ultimi 60s" value={stats.recent60s} color="text-blue-600" />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onTogglePause} title={paused ? 'Riprendi polling' : 'Pausa polling'}>
          {paused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
          {paused ? 'Riprendi' : 'Pausa'}
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} title="Esporta JSON">
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={onClear} title="Svuota messaggi">
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  color = 'text-foreground',
}: {
  label: string
  value: number
  color?: string
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  )
}
