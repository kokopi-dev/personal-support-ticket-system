import type { Ticket } from './types.ts'

export type StorageMode = 'local' | 'remote'

// ─── Local (browser localStorage) ────────────────────────────

const KEY = 'support_tickets'

function load(): Ticket[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(tickets: Ticket[]): void {
  localStorage.setItem(KEY, JSON.stringify(tickets))
}

const local = {
  getTickets: (): Ticket[] => load(),

  createTicket: (data: Pick<Ticket, 'subject' | 'description' | 'type'>): Ticket => {
    const ticket: Ticket = {
      id: crypto.randomUUID(),
      subject: data.subject,
      description: data.description,
      status: 'open',
      type: 'other',
      createdAt: new Date().toISOString(),
    }
    save([ticket, ...load()])
    return ticket
  },

  updateTicket: (id: string, patch: Partial<Ticket>): Ticket | null => {
    const tickets = load().map(t => t.id === id ? { ...t, ...patch } : t)
    save(tickets)
    return tickets.find(t => t.id === id) ?? null
  },

  deleteTicket: (id: string): void => {
    save(load().filter(t => t.id !== id))
  },
}

// ─── Remote (backend API) ─────────────────────────────────────

const remote = {
  getTickets: (): Promise<Ticket[]> =>
    fetch('/api/tickets').then(r => r.json()),

  createTicket: (data: Pick<Ticket, 'subject' | 'description' | 'type'>): Promise<Ticket> =>
    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  updateTicket: (id: string, patch: Partial<Ticket>): Promise<Ticket> =>
    fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(r => r.json()),

  deleteTicket: (id: string): Promise<void> =>
    fetch(`/api/tickets/${id}`, { method: 'DELETE' }).then(() => undefined),
}

// ─── Resolver ─────────────────────────────────────────────────

export function getStorage(mode: StorageMode) {
  return mode === 'remote' ? remote : local
}
