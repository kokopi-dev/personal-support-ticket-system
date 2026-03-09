import { useState, useEffect } from 'react'
import { AdminTable } from '../components/admin/AdminTable.tsx'
import { TicketDetail } from '../components/tickets/TicketDetail.tsx'
import { Modal } from '../components/ui/Modal.tsx'
import { storage } from '../lib/storage.ts'
import type { PaginatedResponse, TicketFilters } from '../lib/storage.ts'
import { useModal } from '../hooks/useModal.ts'
import type { Ticket, User } from '../lib/types.ts'
import { Button } from '../components/ui/Button.tsx'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border-100 bg-bg-200 px-4 py-3">
      <p className="text-xs text-fg-300">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-fg-100">{value}</p>
    </div>
  )
}

const STATUS_OPTIONS: { value: Ticket['status'] | ''; label: string }[] = [
  { value: '',            label: 'All statuses' },
  { value: 'open',        label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'resolved',    label: 'Resolved' },
  { value: 'closed',      label: 'Closed' },
]

const TYPE_OPTIONS: { value: Ticket['type'] | ''; label: string }[] = [
  { value: '',                label: 'All types' },
  { value: 'bug',             label: 'Bug' },
  { value: 'billing',         label: 'Billing' },
  { value: 'account',         label: 'Account' },
  { value: 'feature-request', label: 'Feature request' },
  { value: 'feedback',        label: 'Feedback' },
  { value: 'other',           label: 'Other' },
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
            <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M1.5 10.5c0-2.21 2.015-4 4.5-4s4.5 1.79 4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
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
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}


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
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const detailModal = useModal()

  useEffect(() => {
    storage.getAllTickets(isAuthenticated, page, 20, filters).then(setResult)
    setSelection(new Set()) // clear selection whenever the visible page changes
  }, [isAuthenticated, page, filters])

  const handleFilterChange = (next: TicketFilters) => {
    setFilters(next)
    setPage(1)
  }

  const stats = {
    total:      result.total,
    open:       result.data.filter(t => t.status === 'open').length,
    inProgress: result.data.filter(t => t.status === 'in-progress').length,
    resolved:   result.data.filter(t => t.status === 'resolved').length,
  }

  const handleOpen = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    detailModal.open()
  }

  const handleDetailClose = () => {
    detailModal.close()
    setSelectedTicket(null)
    setActionError(null)
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
    try {
      const updated = await storage.updateTicket(isAuthenticated, id, { status: 'closed' })
      if (updated) {
        setResult(prev => ({ ...prev, data: prev.data.map(t => t.id === id ? updated : t) }))
        setSelectedTicket(updated)
      }
    } catch {
      setActionError('Failed to close ticket. Please try again.')
    }
  }

  const handleReopenTicket = async (id: string) => {
    try {
      const updated = await storage.updateTicket(isAuthenticated, id, { status: 'open' })
      if (updated) {
        setResult(prev => ({ ...prev, data: prev.data.map(t => t.id === id ? updated : t) }))
        setSelectedTicket(updated)
      }
    } catch {
      setActionError('Failed to reopen ticket. Please try again.')
    }
  }

  const handleDeleteTicket = async (id: string) => {
    try {
      await storage.deleteTicket(isAuthenticated, id)
      handleDetailClose()
      await refetch()
    } catch {
      setActionError('Failed to delete ticket. Please try again.')
    }
  }

  const handleBatchDelete = async () => {
    if (selection.size === 0) return
    setBatchDeleting(true)
    try {
      await Promise.all([...selection].map(id => storage.deleteTicket(isAuthenticated, id)))
      setSelection(new Set())
      await refetch()
    } finally {
      setBatchDeleting(false)
    }
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
        <StatCard label="Total"       value={stats.total} />
        <StatCard label="Open"        value={stats.open} />
        <StatCard label="In Progress" value={stats.inProgress} />
        <StatCard label="Resolved"    value={stats.resolved} />
      </div>

      <FilterBar
        filters={filters}
        isAuthenticated={isAuthenticated}
        onChange={handleFilterChange}
      />

      {/* Batch action toolbar — visible only when tickets are selected */}
      {selection.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-border-100 bg-bg-200 px-4 py-2.5">
          <p className="text-xs text-fg-200">
            <span className="font-medium text-fg-100">{selection.size}</span>
            {' '}ticket{selection.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelection(new Set())}
              className="text-xs text-fg-300 hover:text-fg-200 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <Button
              variant="ghost"
              onClick={handleBatchDelete}
              disabled={batchDeleting}
              className="text-red-400 hover:text-red-300"
            >
              {batchDeleting ? 'Deleting…' : `Delete ${selection.size}`}
            </Button>
          </div>
        </div>
      )}

      <AdminTable
        tickets={result.data}
        onOpen={handleOpen}
        currentUserId={user?.id ?? null}
        selection={selection}
        onSelectionChange={setSelection}
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
          <>
            {actionError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-3">
                <span className="mt-0.5 text-sm">⚠️</span>
                <p className="text-xs leading-relaxed text-red-400">{actionError}</p>
              </div>
            )}
            <TicketDetail
              ticket={selectedTicket}
              onCloseTicket={canModify(selectedTicket) ? handleCloseTicket : undefined}
              onReopenTicket={canModify(selectedTicket) ? handleReopenTicket : undefined}
              onDeleteTicket={canModify(selectedTicket) ? handleDeleteTicket : undefined}
            />
          </>
        )}
      </Modal>
    </>
  )
}
