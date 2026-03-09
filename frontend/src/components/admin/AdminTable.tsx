import { Badge } from '../ui/Badge.tsx'
import { Button } from '../ui/Button.tsx'
import { parseDescription } from '../../lib/ticket.ts'
import type { Ticket } from '../../lib/types.ts'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPrev: () => void
  onNext: () => void
}

interface AdminTableProps {
  tickets: Ticket[]
  onOpen: (ticket: Ticket) => void
  currentUserId: string | null
  pagination: PaginationProps
}

export function AdminTable({ tickets, onOpen, currentUserId, pagination }: AdminTableProps) {
  const { page, totalPages, total, pageSize, onPrev, onNext } = pagination
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  if (tickets.length === 0 && total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border-100 bg-bg-200 py-16 text-center">
        <p className="text-sm text-fg-300">No tickets in the system.</p>
      </div>
    )
  }

  const hasBilling = tickets.some(t => t.type === 'billing')

  return (
    <div className="overflow-hidden rounded-lg border border-border-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-100 bg-bg-200">
            {(['Subject', 'User', 'Type', 'Status', ...(hasBilling ? ['Transaction'] : []), 'Description', 'Created'] as const).map(col => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-300"
              >
                {col}
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-100 bg-bg-100">
          {tickets.map(ticket => {
            const { txnId, txnLine, body: displayDescription } = parseDescription(ticket.description)
            const hasTxn = ticket.type === 'billing' && txnId !== null

            return (
              <tr
                key={ticket.id}
                className="transition-colors hover:bg-bg-200 cursor-pointer"
                onClick={() => onOpen(ticket)}
              >
                <td className="px-4 py-3 font-medium text-fg-100">
                  <div className="flex items-center gap-2">
                    {ticket.subject}
                    {currentUserId && ticket.userId === currentUserId && (
                      <span className="inline-flex items-center rounded-full border border-border-100 bg-bg-300 px-1.5 py-0.5 text-[10px] font-medium text-fg-300">
                        mine
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-fg-200 whitespace-nowrap">
                  {ticket.username ?? <span className="italic text-fg-300">guest</span>}
                </td>
                <td className="px-4 py-3 text-xs capitalize text-fg-200">
                  {ticket.type.replace('-', ' ')}
                </td>
                <td className="px-4 py-3">
                  <Badge status={ticket.status} />
                </td>
                {hasBilling && (
                  <td className="px-4 py-3 text-xs text-fg-200 whitespace-nowrap">
                    {hasTxn ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border-100 bg-bg-300 px-2 py-1 font-mono text-fg-200">
                        {txnLine!.split(' — ')[0]}
                      </span>
                    ) : (
                      <span className="text-fg-300 italic">—</span>
                    )}
                  </td>
                )}
                <td className="max-w-xs px-4 py-3 text-xs text-fg-300">
                  <span className="line-clamp-2">
                    {displayDescription || <span className="italic">No description</span>}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-fg-300">
                  {formatDate(ticket.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    onClick={e => { e.stopPropagation(); onOpen(ticket) }}
                  >
                    Open
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Pagination footer */}
      <div className="flex items-center justify-between border-t border-border-100 bg-bg-200 px-4 py-3">
        <p className="text-xs text-fg-300">
          {total === 0 ? 'No tickets' : `${start}–${end} of ${total}`}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onPrev} disabled={page <= 1}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Prev
          </Button>
          <span className="text-xs text-fg-300">
            {page} / {totalPages}
          </span>
          <Button variant="ghost" onClick={onNext} disabled={page >= totalPages}>
            Next
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}
