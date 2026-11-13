'use client'

import { useRouter } from 'next/navigation'
import { SubscriptionSelector } from '@/components/SubscriptionSelector'
import { MessageTable } from '@/components/MessageTable'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PubSubIcon } from '@/components/PubSubIcon'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LogOut } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PubSubIcon className="h-7 w-7" />
            <span className="font-semibold text-lg">PubSub Viewer</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Toolbar subscription */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <SubscriptionSelector />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Separator className="mb-6" />
        <MessageTable />
      </main>
    </div>
  )
}
