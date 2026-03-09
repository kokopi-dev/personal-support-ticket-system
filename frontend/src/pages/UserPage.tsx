import { useState, useEffect } from 'react'
import { Modal } from '../components/ui/Modal.tsx'
import { Button } from '../components/ui/Button.tsx'
import { TicketTable } from '../components/tickets/TicketTable.tsx'
import { NewTicketForm } from '../components/tickets/NewTicketForm.tsx'
import { useModal } from '../hooks/useModal.ts'
import { storage } from '../lib/storage.ts'
import type { Ticket } from '../lib/types.ts'

export function UserPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const newTicketModal = useModal()

  useEffect(() => {
    storage.getTickets().then(setTickets)
  }, [])

  const handleCreate = async (form: Pick<Ticket, 'subject' | 'description' | 'type'>) => {
    const ticket = await storage.createTicket(form)
    setTickets(prev => [ticket, ...prev])
    newTicketModal.close()
  }

  const handleDelete = async (id: string) => {
    await storage.deleteTicket(id)
    setTickets(prev => prev.filter(t => t.id !== id))
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-fg-100">My Tickets</h1>
          <p className="mt-0.5 text-sm text-fg-300">
            {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
          </p>
        </div>
        <Button onClick={newTicketModal.open}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          New Ticket
        </Button>
      </div>

      <TicketTable tickets={tickets} onDelete={handleDelete} />

      <Modal isOpen={newTicketModal.isOpen} onClose={newTicketModal.close} title="New Ticket">
        <NewTicketForm onSubmit={handleCreate} />
      </Modal>
    </>
  )
}
