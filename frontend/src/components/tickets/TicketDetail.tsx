import { useState, useRef, useEffect } from 'react'
import { Badge } from '../ui/Badge.tsx'
import { FAKE_TRANSACTIONS } from './NewTicketForm.tsx'
import { parseDescription } from '../../lib/ticket.ts'
import type { Ticket } from '../../lib/types.ts'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

const TYPE_LABELS: Record<Ticket['type'], string> = {
  'bug':            'Bug',
  'billing':        'Billing',
  'account':        'Account',
  'feature-request':'Feature Request',
  'feedback':       'Feedback',
  'other':          'Other',
}

const HOLD_DURATION = 2000 // ms

interface HoldToCloseProps {
  onComplete: () => Promise<void>
}

function HoldToClose({ onComplete }: HoldToCloseProps) {
  const [progress, setProgress] = useState(0) // 0–1
  const [completing, setCompleting] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  const cancel = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    startRef.current = null
    setProgress(0)
  }

  const tick = (now: number) => {
    if (!startRef.current) return
    const elapsed = now - startRef.current
    const next = Math.min(elapsed / HOLD_DURATION, 1)
    setProgress(next)
    if (next < 1) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      setCompleting(true)
      onComplete().finally(() => setCompleting(false))
    }
  }

  const start = () => {
    if (completing) return
    startRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
  }

  // Clean up on unmount
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  // SVG arc helpers
  const size = 28
  const stroke = 2.5
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = progress * circ

  const isHolding = progress > 0 && progress < 1

  return (
    <button
      type="button"
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onTouchStart={start}
      onTouchEnd={cancel}
      disabled={completing}
      className={`
        relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm
        select-none transition-colors duration-150 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${isHolding
          ? 'text-red-400 bg-red-950/40'
          : 'text-fg-300 hover:text-fg-100 hover:bg-bg-300'
        }
      `}
      aria-label="Hold to close ticket"
    >
      {/* Progress ring */}
      <span className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        {/* Track */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={stroke}
          />
          {/* Fill arc */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: progress === 0 ? 'stroke-dasharray 0.15s ease' : 'none' }}
          />
        </svg>
        {/* Icon */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </span>

      <span className="text-xs font-medium">
        {completing ? 'Closing…' : isHolding ? 'Keep holding…' : 'Hold to close'}
      </span>
    </button>
  )
}

interface TicketDetailProps {
  ticket: Ticket
  onCloseTicket: (id: string) => Promise<void>
}

export function TicketDetail({ ticket, onCloseTicket }: TicketDetailProps) {
  const { txnId, body } = parseDescription(ticket.description)
  const txn = txnId ? FAKE_TRANSACTIONS.find(t => t.id === txnId) ?? null : null
  const isClosed = ticket.status === 'closed'

  return (
    <div className="flex flex-col gap-4">

      {/* Status + meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge status={ticket.status} />
        <span className="text-xs text-fg-300">·</span>
        <span className="text-xs text-fg-200 capitalize">{TYPE_LABELS[ticket.type]}</span>
        <span className="text-xs text-fg-300">·</span>
        <span className="text-xs text-fg-300">Opened {formatDate(ticket.createdAt)}</span>
      </div>

      {/* Transaction card — only for billing tickets with a linked txn */}
      {txn && (
        <div className="rounded-md border border-border-100 bg-bg-300 px-3 py-2.5">
          <p className="text-xs font-medium text-fg-300 mb-1.5">Linked transaction</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-fg-100">{txn.label}</span>
              <span className="text-xs text-fg-300">{txn.id} · {txn.date}</span>
            </div>
            <span className="text-sm font-semibold text-fg-100 shrink-0">{txn.amount}</span>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-fg-200">Description</p>
        {body ? (
          <p className="text-sm text-fg-100 leading-relaxed whitespace-pre-wrap">{body}</p>
        ) : (
          <p className="text-xs italic text-fg-300">No description provided.</p>
        )}
      </div>

      {/* Footer: ticket ID + close action */}
      <div className="flex items-center justify-between border-t border-border-100 pt-3">
        <p className="text-xs text-fg-300 font-mono">ID: {ticket.id}</p>
        {isClosed ? (
          <span className="text-xs text-fg-300 italic">This ticket is closed.</span>
        ) : (
          <HoldToClose onComplete={() => onCloseTicket(ticket.id)} />
        )}
      </div>

    </div>
  )
}
