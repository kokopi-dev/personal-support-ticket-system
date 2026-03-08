import type { Ticket } from '../../lib/types.ts'

const variants: Record<Ticket['status'], string> = {
  'open':        'bg-blue-950/60 text-blue-400 border-blue-900/60',
  'in-progress': 'bg-amber-950/60 text-amber-400 border-amber-900/60',
  'resolved':    'bg-green-950/60 text-green-400 border-green-900/60',
  'closed':      'bg-bg-300 text-fg-300 border-border-100',
}

interface BadgeProps {
  status: Ticket['status']
}

export function Badge({ status }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize
      ${variants[status]}
    `}>
      {status}
    </span>
  )
}
