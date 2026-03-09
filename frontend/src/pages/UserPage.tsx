import { useState, useEffect } from 'react'
import { Modal } from '../components/ui/Modal.tsx'
import { Button } from '../components/ui/Button.tsx'
import { TicketTable } from '../components/tickets/TicketTable.tsx'
import { TicketDetail } from '../components/tickets/TicketDetail.tsx'
import { NewTicketForm } from '../components/tickets/NewTicketForm.tsx'
import { useModal } from '../hooks/useModal.ts'
import { storage, ApiError } from '../lib/storage.ts'
import type { Ticket } from '../lib/types.ts'
import { PlusIcon } from '../components/icons/plus.tsx'

const TICKET_LIMIT = 10

interface UserPageProps {
  isAuthenticated: boolean
}

function TicketLimitReached({ onClose, fromServer }: { onClose: () => void; fromServer?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border-100 bg-bg-300 text-2xl">
        🗂️
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-fg-100">Ticket limit reached</p>
        <p className="text-xs leading-relaxed text-fg-300 max-w-xs">
          {fromServer ? (
            <>
              The server rejected your request — you already have{' '}
              <span className="text-fg-200 font-medium">{TICKET_LIMIT} active support tickets</span>.
              Your ticket was not created.
            </>
          ) : (
            <>
              You can have a maximum of{' '}
              <span className="text-fg-200 font-medium">{TICKET_LIMIT} active support tickets</span>{' '}
              at a time.
            </>
          )}
        </p>
      </div>
      <div className="w-full rounded-lg border border-border-100 bg-bg-300 px-4 py-3 text-left">
        <p className="text-xs font-medium text-fg-200 mb-2">How to free up a slot</p>
        <ol className="flex flex-col gap-1.5">
          {[
            'Switch to the Admin tab',
            'Find a resolved or closed ticket',
            'Delete it to make room',
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-2.5 text-xs text-fg-300">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-bg-400 text-[10px] font-medium text-fg-200">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <Button variant="ghost" onClick={onClose} className="mt-1">
        Got it
      </Button>
    </div>
  )
}

export function UserPage({ isAuthenticated }: UserPageProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [serverLimitHit, setServerLimitHit] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  const newTicketModal = useModal()
  const detailModal = useModal()

  const atLimit = isAuthenticated && tickets.length >= TICKET_LIMIT
  const showLimitScreen = atLimit || serverLimitHit

  useEffect(() => {
    storage.getTickets().then(setTickets)
  }, [isAuthenticated])

  const handleNewClose = () => {
    newTicketModal.close()
    setServerLimitHit(false)
    setContentError(null)
  }

  const handleOpen = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    detailModal.open()
  }

  const handleDetailClose = () => {
    detailModal.close()
    setSelectedTicket(null)
  }

  const handleCloseTicket = async (id: string) => {
    const updated = await storage.updateTicket(id, { status: 'closed' })
    if (updated) {
      setTickets(prev => prev.map(t => t.id === id ? updated : t))
      setSelectedTicket(updated)
    }
  }

  const handleCreate = async (form: Pick<Ticket, 'subject' | 'description' | 'type'>) => {
    if (atLimit) return
    setContentError(null)
    try {
      const ticket = await storage.createTicket(form)
      setTickets(prev => [ticket, ...prev])
      newTicketModal.close()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'ticket_limit_reached') {
          setServerLimitHit(true)
          storage.getTickets().then(setTickets)
        } else if (err.code === 'profanity') {
          // Surface the server's message directly — it says which field was flagged
          setContentError(err.message)
        }
      }
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-fg-100">My Tickets</h1>
          <p className="mt-0.5 text-sm text-fg-300">
            {isAuthenticated ? (
              <>
                {tickets.length}{' '}
                <span className={atLimit ? 'text-amber-400' : 'text-fg-300'}>
                  / {TICKET_LIMIT}
                </span>{' '}
                tickets
              </>
            ) : (
              <>{tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}</>
            )}
          </p>
        </div>
        <Button onClick={newTicketModal.open}>
          <PlusIcon className="size-4" />
          New Ticket
        </Button>
      </div>

      <TicketTable tickets={tickets} onOpen={handleOpen} />

      {/* New ticket modal */}
      <Modal
        isOpen={newTicketModal.isOpen}
        onClose={handleNewClose}
        title={showLimitScreen ? 'Ticket Limit Reached' : 'New Ticket'}
      >
        {showLimitScreen
          ? <TicketLimitReached onClose={handleNewClose} fromServer={serverLimitHit && !atLimit} />
          : (
            <>
              {contentError && (
                <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-3">
                  <span className="mt-0.5 text-sm">🚫</span>
                  <p className="text-xs leading-relaxed text-red-400">{contentError}</p>
                </div>
              )}
              <NewTicketForm onSubmit={handleCreate} />
            </>
          )
        }
      </Modal>

      {/* Ticket detail modal */}
      <Modal
        isOpen={detailModal.isOpen}
        onClose={handleDetailClose}
        title={selectedTicket?.subject ?? ''}
      >
        {selectedTicket && <TicketDetail ticket={selectedTicket} onCloseTicket={handleCloseTicket} />}
      </Modal>
    </>
  )
}
