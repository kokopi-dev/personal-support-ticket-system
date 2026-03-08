import { useState, useEffect } from 'react'
import { Modal } from './components/ui/Modal.tsx'
import { Button } from './components/ui/Button.tsx'
import { TicketTable } from './components/tickets/TicketTable.tsx'
import { NewTicketForm } from './components/tickets/NewTicketForm.tsx'
import { useModal } from './hooks/useModal.ts'
import { useStorageMode } from './hooks/useStorageMode.ts'
import { getStorage } from './lib/storage.ts'
import type { Ticket } from './lib/types.ts'
import { Layout } from './components/ui/Layout.tsx'
import { PlusIcon } from './components/icons/plus.tsx'

function TicketApp({ storageMode }: { storageMode: 'local' | 'remote' }) {
  const storage = getStorage(storageMode)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const newTicketModal = useModal()

  // load tickets — handles both sync (local) and async (remote)
  useEffect(() => {
    const result = storage.getTickets()
    if (result instanceof Promise) {
      result.then(setTickets)
    } else {
      setTickets(result)
    }
  }, [storageMode])

  const handleCreateTicket = async (form: Pick<Ticket, 'subject' | 'description' | 'type'>) => {
    const result = storage.createTicket(form)
    const ticket = result instanceof Promise ? await result : result
    setTickets(prev => [ticket, ...prev])
    newTicketModal.close()
  }
  const handleDeleteTicket = async (id: string) => {
    const result = storage.deleteTicket(id)
    if (result instanceof Promise) await result
    setTickets(prev => prev.filter(t => t.id !== id))
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-fg-100">Support Tickets</h1>
          <p className="mt-0.5 text-sm text-fg-300">
            {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} total
          </p>
        </div>
        <Button onClick={newTicketModal.open}>
          <PlusIcon className="size-3" />
          New Ticket
        </Button>
      </div>

      <TicketTable tickets={tickets} onDelete={handleDeleteTicket} />

      <Modal isOpen={newTicketModal.isOpen} onClose={newTicketModal.close} title="New Ticket">
        <NewTicketForm onSubmit={handleCreateTicket} />
      </Modal>
    </Layout>
  )
}

export default function App() {
  const storageMode = useStorageMode()

  if (storageMode === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-fg-300">Loading...</p>
      </div>
    )
  }

  return <TicketApp storageMode={storageMode} />
}
