import type { Ticket, TicketType } from './types'
import { env } from '../env'

const API = env.apiUrl

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  if (res.status === 401) throw new Error('unauthenticated')
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

// ─── Local (localStorage) adapter ────────────────────────────────────────────

const LOCAL_KEY = 'support_tickets'

function localGet(): Ticket[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
  } catch {
    return []
  }
}

function localSet(tickets: Ticket[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(tickets))
}

export const localAdapter = {
  getTickets: (): Ticket[] => localGet(),

  createTicket: (data: { subject: string; description: string; type: TicketType }): Ticket => {
    const ticket: Ticket = {
      id: crypto.randomUUID(),
      userId: null,
      subject: data.subject,
      description: data.description,
      type: data.type,
      status: 'open',
      createdAt: new Date().toISOString(),
    }
    localSet([ticket, ...localGet()])
    return ticket
  },

  updateTicket: (id: string, patch: Partial<Ticket>): Ticket | null => {
    const tickets = localGet()
    const idx = tickets.findIndex(t => t.id === id)
    if (idx === -1) return null
    tickets[idx] = { ...tickets[idx], ...patch }
    localSet(tickets)
    return tickets[idx]
  },

  deleteTicket: (id: string): boolean => {
    const before = localGet()
    const after = before.filter(t => t.id !== id)
    localSet(after)
    return after.length < before.length
  },
}

// ─── Storage API ──────────────────────────────────────────────────────────────

export const storage = {
  // User's own tickets — API when authenticated, localStorage when guest
  async getTickets(): Promise<Ticket[]> {
    try {
      return await apiFetch<Ticket[]>('/api/tickets')
    } catch {
      return localAdapter.getTickets()
    }
  },

  // Admin view — all DB tickets when authenticated, localStorage when guest
  async getAllTickets(isAuthenticated: boolean): Promise<Ticket[]> {
    if (!isAuthenticated) return localAdapter.getTickets()
    try {
      return await apiFetch<Ticket[]>('/api/tickets/all')
    } catch {
      return localAdapter.getTickets()
    }
  },

  async createTicket(data: { subject: string; description: string; type: TicketType }): Promise<Ticket> {
    try {
      return await apiFetch<Ticket>('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch {
      return localAdapter.createTicket(data)
    }
  },

  async updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket | null> {
    try {
      return await apiFetch<Ticket>(`/api/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
    } catch {
      return localAdapter.updateTicket(id, patch)
    }
  },

  async deleteTicket(id: string): Promise<boolean> {
    try {
      await apiFetch(`/api/tickets/${id}`, { method: 'DELETE' })
      return true
    } catch {
      return localAdapter.deleteTicket(id)
    }
  },
}
