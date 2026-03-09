import type { Ticket, TicketType } from './types'

const API = import.meta.env.VITE_API_URL ?? ''
const isProd = import.meta.env.PROD

// ─── CSRF ────────────────────────────────────────────────────────────────────
// In production we fetch a CSRF token once and attach it to all mutating
// requests via the x-csrf-token header (required by @fastify/csrf-protection).

let csrfToken: string | null = null

async function getCsrfToken(): Promise<string | null> {
  if (!isProd) return null
  if (csrfToken) return csrfToken
  const res = await fetch(`${API}/api/auth/csrf-token`, { credentials: 'include' })
  const json = await res.json()
  csrfToken = json.token ?? null
  return csrfToken
}

// Invalidate cached token on 403 so the next call fetches a fresh one.
function invalidateCsrf() {
  csrfToken = null
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }

  if (isMutating) {
    const token = await getCsrfToken()
    if (token) headers['x-csrf-token'] = token
  }

  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })

  if (res.status === 401) throw new Error('unauthenticated')
  if (res.status === 403) {
    invalidateCsrf()
    throw new Error('forbidden')
  }
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
    localSet([...localGet(), ticket])
    return ticket
  },
  updateTicket: (id: string, patch: Partial<Ticket>): Ticket | null => {
    const tickets = localGet()
    const idx = tickets.findIndex((t) => t.id === id)
    if (idx === -1) return null
    tickets[idx] = { ...tickets[idx], ...patch }
    localSet(tickets)
    return tickets[idx]
  },
  deleteTicket: (id: string): boolean => {
    const before = localGet()
    const after = before.filter((t) => t.id !== id)
    localSet(after)
    return after.length < before.length
  },
}

// ─── API adapter (falls back to local on 401) ─────────────────────────────────

export const storage = {
  async getTickets(): Promise<Ticket[]> {
    try {
      return await apiFetch<Ticket[]>('/api/tickets')
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

  async getAllTickets(): Promise<Ticket[]> {
    try {
      return await apiFetch<Ticket[]>('/api/tickets/all')
    } catch {
      return localAdapter.getTickets()
    }
  },
}
