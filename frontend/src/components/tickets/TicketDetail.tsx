import { useState, useRef, useEffect } from 'react'
import { Badge } from '../ui/Badge.tsx'
import { Button } from '../ui/Button.tsx'
import { FAKE_TRANSACTIONS } from './NewTicketForm.tsx'
import { parseDescription } from '../../lib/ticket.ts'
import { storage } from '../../lib/storage.ts'
import type { Ticket, Reply } from '../../lib/types.ts'
import { CloseIcon } from '../icons/close.tsx'
import { TrashIcon } from '../icons/trash.tsx'
import { CircleArrowIcon } from '../icons/circleArrow.tsx'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

const TYPE_LABELS: Record<Ticket['type'], string> = {
  'bug': 'Bug',
  'billing': 'Billing',
  'account': 'Account',
  'feature-request': 'Feature Request',
  'feedback': 'Feedback',
  'other': 'Other',
}

const HOLD_DURATION = 900 // ms

interface HoldButtonProps {
  onComplete: () => Promise<void>
  label: string
  completingLabel: string
  icon: React.ReactNode
  ariaLabel: string
}

function HoldButton({ onComplete, label, completingLabel, icon, ariaLabel }: HoldButtonProps) {
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

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

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
      aria-label={ariaLabel}
    >
      <span className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{ transition: progress === 0 ? 'stroke-dasharray 0.15s ease' : 'none' }} />
        </svg>
        {icon}
      </span>
      <span className="text-xs font-medium">
        {completing ? completingLabel : isHolding ? 'Keep holding…' : label}
      </span>
    </button>
  )
}

function ReplyBubble({ reply }: { reply: Reply }) {
  const isSupport = reply.authorRole === 'support'
  return (
    <div className={`flex flex-col gap-1 ${isSupport ? 'items-end' : 'items-start'}`}>
      <div className={`
        max-w-[85%] rounded-lg px-3.5 py-2.5
        ${isSupport
          ? 'bg-fg-100/10 border border-fg-100/15'
          : 'bg-bg-300 border border-border-100'
        }
      `}>
        <p className="text-sm text-fg-100 leading-relaxed whitespace-pre-wrap">{reply.body}</p>
      </div>
      <p className="text-[10px] text-fg-300 px-1">
        {isSupport ? 'Support' : (reply.username ?? 'You')} · {formatTime(reply.createdAt)}
      </p>
    </div>
  )
}

interface ReplyComposerProps {
  onSend: (body: string) => Promise<void>
  disabled?: boolean
}

function ReplyComposer({ onSend, disabled }: ReplyComposerProps) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if (!body.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      await onSend(body.trim())
      setBody('')
      textareaRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend()
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border-100 pt-4">
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={e => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || sending}
        placeholder="Write a reply… (⌘Enter to send)"
        rows={3}
        className="w-full rounded-md border border-border-100 bg-bg-300 px-3 py-2 text-sm text-fg-100 placeholder:text-fg-300 outline-none transition-colors focus:border-border-200 focus:ring-1 focus:ring-ring-100 resize-none disabled:opacity-50"
      />
      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={!body.trim() || sending || disabled}>
          {sending ? 'Sending…' : 'Send Reply'}
        </Button>
      </div>
    </div>
  )
}


interface TicketDetailProps {
  ticket: Ticket
  isAuthenticated: boolean
  canReply: boolean
  replyAs?: 'user' | 'support'  // defaults to 'user'; Admin tab passes 'support'
  onCloseTicket?: (id: string) => Promise<void>
  onDeleteTicket?: (id: string) => Promise<void>
  onReopenTicket?: (id: string) => Promise<void>
}

export function TicketDetail({
  ticket,
  isAuthenticated,
  canReply,
  replyAs = 'user',
  onCloseTicket,
  onDeleteTicket,
  onReopenTicket,
}: TicketDetailProps) {
  const { txnId, body } = parseDescription(ticket.description)
  const txn = txnId ? FAKE_TRANSACTIONS.find(t => t.id === txnId) ?? null : null
  const isClosed = ticket.status === 'closed'
  const hasAnyAction = onCloseTicket || onReopenTicket || onDeleteTicket

  const [replies, setReplies] = useState<Reply[]>([])
  const [repliesLoading, setRepliesLoading] = useState(true)
  const threadEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRepliesLoading(true)
    storage.getReplies(isAuthenticated, ticket.id)
      .then(setReplies)
      .finally(() => setRepliesLoading(false))
  }, [isAuthenticated, ticket.id])

  // Scroll to bottom when new replies arrive
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies.length])

  const handleSendReply = async (replyBody: string) => {
    const newReply = await storage.createReply(isAuthenticated, ticket.id, replyBody, replyAs === 'support')
    setReplies(prev => [...prev, newReply])
  }

  return (
    <div className="flex flex-col gap-4 max-h-[75vh]">

      {/* Status + meta row */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <Badge status={ticket.status} />
        <span className="text-xs text-fg-300">·</span>
        <span className="text-xs text-fg-200 capitalize">{TYPE_LABELS[ticket.type]}</span>
        <span className="text-xs text-fg-300">·</span>
        <span className="text-xs text-fg-300">Opened {formatDate(ticket.createdAt)}</span>
      </div>

      {/* Transaction card */}
      {txn && (
        <div className="rounded-md border border-border-100 bg-bg-300 px-3 py-2.5 shrink-0">
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

      {/* Original description */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <p className="text-xs font-medium text-fg-200">Description</p>
        {body ? (
          <p className="text-sm text-fg-100 leading-relaxed whitespace-pre-wrap">{body}</p>
        ) : (
          <p className="text-xs italic text-fg-300">No description provided.</p>
        )}
      </div>

      {/* Reply thread — this section scrolls, nothing else does */}
      <div className="flex flex-col gap-1.5 min-h-0 flex-1">
        <p className="text-xs font-medium text-fg-200 shrink-0">
          Replies {!repliesLoading && replies.length > 0 && (
            <span className="text-fg-300 font-normal">({replies.length})</span>
          )}
        </p>
        <div className="overflow-y-auto flex-1 min-h-[80px]">
          {repliesLoading ? (
            <p className="text-xs text-fg-300 py-2">Loading…</p>
          ) : replies.length === 0 ? (
            <p className="text-xs italic text-fg-300">No replies yet.</p>
          ) : (
            <div className="flex flex-col gap-3 py-1 pr-1">
              {replies.map(r => <ReplyBubble key={r.id} reply={r} />)}
              <div ref={threadEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Compose — hidden for read-only viewers and closed tickets */}
      {canReply && !isClosed && (
        <ReplyComposer onSend={handleSendReply} />
      )}
      {canReply && isClosed && (
        <p className="text-xs text-fg-300 italic border-t border-border-100 pt-3 shrink-0">
          This ticket is closed — replies are disabled.
        </p>
      )}

      {/* Footer: ticket ID + actions */}
      <div className="flex items-center justify-between border-t border-border-100 pt-3 shrink-0">
        <p className="text-xs text-fg-300 font-mono">ID: {ticket.id}</p>
        <div className="flex items-center gap-1">
          {!hasAnyAction && (
            <span className="text-xs text-fg-300 italic">Read only</span>
          )}
          {isClosed ? (
            onReopenTicket ? (
              <HoldButton
                onComplete={() => onReopenTicket(ticket.id)}
                label="Hold to reopen"
                completingLabel="Reopening…"
                icon={<CircleArrowIcon className="size-4" />}
                ariaLabel="Hold to reopen ticket"
              />
            ) : onCloseTicket ? (
              <span className="text-xs text-fg-300 italic">This ticket is closed.</span>
            ) : null
          ) : (
            onCloseTicket && (
              <HoldButton
                onComplete={() => onCloseTicket(ticket.id)}
                label="Hold to close"
                completingLabel="Closing…"
                icon={<CloseIcon className="size-4" />}
                ariaLabel="Hold to close ticket"
              />
            )
          )}
          {onDeleteTicket && (
            <HoldButton
              onComplete={() => onDeleteTicket(ticket.id)}
              label="Hold to delete"
              completingLabel="Deleting…"
              icon={<TrashIcon className="size-4" />}
              ariaLabel="Hold to delete ticket"
            />
          )}
        </div>
      </div>

    </div>
  )
}
