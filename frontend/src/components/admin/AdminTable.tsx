import { Badge } from '../ui/Badge.tsx'
import type { Ticket } from '../../lib/types.ts'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

// Parse transaction reference encoded by NewTicketForm into the description
// Format: "[Transaction: TXN-XXXXX — Label $X.XX on Date]\n\n..."
function parseTransaction(description: string): { txnLine: string; body: string } | null {
  const match = description.match(/^\[Transaction: ([^\]]+)\]\n?\n?(.*)$/s)
  if (!match) return null
  return { txnLine: match[1].trim(), body: match[2].trim() }
}

interface AdminTableProps {
  tickets: Ticket[]
}

export function AdminTable({ tickets }: AdminTableProps) {
  if (tickets.length === 0) {
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
            {(['Subject', 'Type', 'Status', ...(hasBilling ? ['Transaction'] : []), 'Description', 'Created'] as const).map(col => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-300"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-100 bg-bg-100">
          {tickets.map(ticket => {
            const txn = ticket.type === 'billing' ? parseTransaction(ticket.description) : null
            const displayDescription = txn ? txn.body : ticket.description

            return (
              <tr key={ticket.id} className="transition-colors hover:bg-bg-200">
                <td className="px-4 py-3 font-medium text-fg-100">
                  {ticket.subject}
                </td>
                <td className="px-4 py-3 text-xs capitalize text-fg-200">
                  {ticket.type.replace('-', ' ')}
                </td>
                <td className="px-4 py-3">
                  <Badge status={ticket.status} />
                </td>
                {hasBilling && (
                  <td className="px-4 py-3 text-xs text-fg-200 whitespace-nowrap">
                    {txn ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border-100 bg-bg-300 px-2 py-1 font-mono text-fg-200">
                        {txn.txnLine.split(' — ')[0]}
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
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
