import { useState, useEffect } from 'react'
import { AdminTable } from '../components/admin/AdminTable.tsx'
import { TicketDetail } from '../components/tickets/TicketDetail.tsx'
import { Modal } from '../components/ui/Modal.tsx'
import { storage } from '../lib/storage.ts'
import type { PaginatedResponse, TicketFilters } from '../lib/storage.ts'
import { useModal } from '../hooks/useModal.ts'
import type { Ticket, User } from '../lib/types.ts'

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border-100 bg-bg-200 px-4 py-3">
      <p className="text-xs text-fg-300">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-fg-100">{value}</p>
    </div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: Ticket['status'] | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const TYPE_OPTIONS: { value: Ticket['type'] | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'bug', label: 'Bug' },
  { value: 'billing', label: 'Billing' },
  { value: 'account', label: 'Account' },
  { value: 'feature-request', label: 'Feature request' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' },
]

const selectClass = `
  rounded-md border border-border-100 bg-bg-200 px-3 py-1.5 text-xs text-fg-100
  outline-none transition-colors cursor-pointer appearance-none pr-7
  hover:border-border-200 focus:border-border-200 focus:ring-1 focus:ring-ring-100
`

interface FilterBarProps {
  filters: TicketFilters
  isAuthenticated: boolean
  onChange: (f: TicketFilters) => void
}

function FilterBar({ filters, isAuthenticated, onChange }: FilterBarProps) {
  const hasActive = !!(filters.status || filters.type || filters.mine)

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {/* Status */}
      <div className="relative">
        <select
          className={selectClass}
          value={filters.status ?? ''}
          onChange={e => onChange({ ...filters, status: (e.target.value as Ticket['status']) || undefined })}
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronIcon />
      </div>

      {/* Type */}
      <div className="relative">
        <select
          className={selectClass}
          value={filters.type ?? ''}
          onChange={e => onChange({ ...filters, type: (e.target.value as Ticket['type']) || undefined })}
        >
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronIcon />
      </div>

      {/* Mine toggle — only visible when authenticated */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={() => onChange({ ...filters, mine: !filters.mine })}
          className={`
            inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium
            transition-colors cursor-pointer
            ${filters.mine
              ? 'border-fg-100/30 bg-fg-100/10 text-fg-100'
              : 'border-border-100 bg-bg-200 text-fg-300 hover:border-border-200 hover:text-fg-200'
            }
          `}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1.5 10.5c0-2.21 2.015-4 4.5-4s4.5 1.79 4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          My tickets
        </button>
      )}

      {/* Clear */}
      {hasActive && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="text-xs text-fg-300 hover:text-fg-200 transition-colors cursor-pointer"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg
      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-fg-300"
      width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface AdminPageProps {
  isAuthenticated: boolean
  user: User | null
}

const EMPTY_PAGE: PaginatedResponse<Ticket> = {
  data: [], total: 0, page: 1, pageSize: 20, totalPages: 1,
}

export function AdminPage({ isAuthenticated, user }: AdminPageProps) {
  const [result, setResult] = useState<PaginatedResponse<Ticket>>(EMPTY_PAGE)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<TicketFilters>({})
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const detailModal = useModal()

  useEffect(() => {
    storage.getAllTickets(isAuthenticated, page, 20, filters).then(setResult)
  }, [isAuthenticated, page, filters])

  const handleFilterChange = (next: TicketFilters) => {
    setFilters(next)
    setPage(1) // reset to first page on filter change
  }

  const stats = {
    total: result.total,
    open: result.data.filter(t => t.status === 'open').length,
    inProgress: result.data.filter(t => t.status === 'in-progress').length,
    resolved: result.data.filter(t => t.status === 'resolved').length,
  }

  const handleOpen = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    detailModal.open()
  }

  const handleDetailClose = () => {
    detailModal.close()
    setSelectedTicket(null)
  }

  const refetch = async () => {
    const fresh = await storage.getAllTickets(isAuthenticated, page, 20, filters)
    if (fresh.data.length === 0 && page > 1) {
      setPage(p => p - 1)
    } else {
      setResult(fresh)
    }
  }

  const handleCloseTicket = async (id: string) => {
    const updated = await storage.updateTicket(id, { status: 'closed' })
    if (updated) {
      setResult(prev => ({ ...prev, data: prev.data.map(t => t.id === id ? updated : t) }))
      setSelectedTicket(updated)
    }
  }

  const handleReopenTicket = async (id: string) => {
    const updated = await storage.updateTicket(id, { status: 'open' })
    if (updated) {
      setResult(prev => ({ ...prev, data: prev.data.map(t => t.id === id ? updated : t) }))
      setSelectedTicket(updated)
    }
  }

  const handleDeleteTicket = async (id: string) => {
    await storage.deleteTicket(id)
    handleDetailClose()
    await refetch()
  }

  // A ticket is owned by the current user if their IDs match.
  // Unauthenticated (guest) tickets have userId: null — those are always editable locally.
  const canModify = (ticket: Ticket) =>
    !isAuthenticated || (user !== null && ticket.userId === user.id)

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-fg-100">Admin</h1>
        <p className="mt-0.5 text-sm text-fg-300">
          {isAuthenticated ? 'All tickets across the system' : 'Your local tickets'}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Open" value={stats.open} />
        <StatCard label="In Progress" value={stats.inProgress} />
        <StatCard label="Resolved" value={stats.resolved} />
      </div>

      <FilterBar
        filters={filters}
        isAuthenticated={isAuthenticated}
        onChange={handleFilterChange}
      />

      <AdminTable
        tickets={result.data}
        onOpen={handleOpen}
        currentUserId={user?.id ?? null}
        pagination={{
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          pageSize: result.pageSize,
          onPrev: () => setPage(p => p - 1),
          onNext: () => setPage(p => p + 1),
        }}
      />

      <Modal
        isOpen={detailModal.isOpen}
        onClose={handleDetailClose}
        title={selectedTicket?.subject ?? ''}
      >
        {selectedTicket && (
          <TicketDetail
            ticket={selectedTicket}
            onCloseTicket={canModify(selectedTicket) ? handleCloseTicket : undefined}
            onReopenTicket={canModify(selectedTicket) ? handleReopenTicket : undefined}
            onDeleteTicket={canModify(selectedTicket) ? handleDeleteTicket : undefined}
          />
        )}
      </Modal>
    </>
  )
}
