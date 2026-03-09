import { useState, useEffect } from 'react'
import { AdminTable } from '../components/admin/AdminTable.tsx'
import { storage } from '../lib/storage.ts'
import type { Ticket } from '../lib/types.ts'

interface StatCardProps {
  label: string
  value: number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border-100 bg-bg-200 px-4 py-3">
      <p className="text-xs text-fg-300">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-fg-100">{value}</p>
    </div>
  )
}

export function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])

  useEffect(() => {
    storage.getTickets().then(setTickets)
  }, [])

  const stats = {
    total:      tickets.length,
    open:       tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved:   tickets.filter(t => t.status === 'resolved').length,
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-fg-100">Admin</h1>
        <p className="mt-0.5 text-sm text-fg-300">All tickets across the system</p>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-3">
        <StatCard label="Total"       value={stats.total} />
        <StatCard label="Open"        value={stats.open} />
        <StatCard label="In Progress" value={stats.inProgress} />
        <StatCard label="Resolved"    value={stats.resolved} />
      </div>

      <AdminTable tickets={tickets} />
    </>
  )
}
