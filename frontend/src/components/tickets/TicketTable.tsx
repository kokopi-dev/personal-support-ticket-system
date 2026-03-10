import { Badge } from '../ui/Badge.tsx'
import type { Ticket } from '../../lib/types.ts'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

interface TicketTableProps {
  tickets: Ticket[]
  onOpen: (ticket: Ticket) => void
}

export function TicketTable({ tickets, onOpen }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border-100 bg-bg-200 py-16 text-center">
        <p className="text-sm text-fg-300">No tickets yet.</p>
        <p className="mt-1 text-xs text-fg-300">Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-scroll overflow-y-hidden rounded-lg border border-border-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-100 bg-bg-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-fg-300 uppercase tracking-wider">Subject</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fg-300 uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fg-300 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fg-300 uppercase tracking-wider">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-100 bg-bg-100">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="transition-colors hover:bg-bg-200 cursor-pointer"
              onClick={() => onOpen(ticket)}
            >
              <td className="px-4 py-3 text-fg-100">{ticket.subject}</td>
              <td className="px-4 py-3 text-xs capitalize text-fg-200">{ticket.type.replace('-', ' ')}</td>
              <td className="px-4 py-3"><Badge status={ticket.status} /></td>
              <td className="px-4 py-3 text-xs text-fg-300">{formatDate(ticket.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
