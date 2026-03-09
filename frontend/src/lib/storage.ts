import type { Ticket, TicketType } from './types'
import { env } from '../env'

const API = env.apiUrl

// ─── API error with structured body ──────────────────────────────────────────

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  if (!res.ok) {
    // Try to parse a structured error body; fall back to a generic message
    let code = `http_${res.status}`
    let message = `API error ${res.status}`
    try {
      const body = await res.json()
      if (body?.error) code = body.error
      if (body?.message) message = body.message
    } catch { /* non-JSON body — keep defaults */ }
    throw new ApiError(res.status, code, message)
  }
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
      username: null,
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

// ─── Paginated response envelope ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TicketFilters {
  status?: Ticket['status']
  type?: TicketType
  mine?: boolean  // restrict to the current user's tickets
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

  // Admin view — paginated from API when authenticated, sliced localStorage when guest
  async getAllTickets(
    isAuthenticated: boolean,
    page = 1,
    pageSize = 20,
    filters: TicketFilters = {},
  ): Promise<PaginatedResponse<Ticket>> {
    if (!isAuthenticated) {
      let all = localAdapter.getTickets()
      if (filters.status) all = all.filter(t => t.status === filters.status)
      if (filters.type)   all = all.filter(t => t.type === filters.type)
      const start = (page - 1) * pageSize
      return {
        data: all.slice(start, start + pageSize),
        total: all.length,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
      }
    }

    const params = new URLSearchParams({ page: String(page) })
    if (filters.status) params.set('status', filters.status)
    if (filters.type)   params.set('type', filters.type)
    if (filters.mine)   params.set('mine', 'true')

    try {
      return await apiFetch<PaginatedResponse<Ticket>>(`/api/tickets/all?${params}`)
    } catch {
      const all = localAdapter.getTickets()
      const start = (page - 1) * pageSize
      return {
        data: all.slice(start, start + pageSize),
        total: all.length,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
      }
    }
  },

  async createTicket(data: { subject: string; description: string; type: TicketType }): Promise<Ticket> {
    try {
      return await apiFetch<Ticket>('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (err) {
      // Re-throw structured API errors (e.g. profanity, ticket limit) — don't silently
      // fall back to localStorage, as these are intentional rejections from the server.
      if (err instanceof ApiError) throw err
      return localAdapter.createTicket(data)
    }
  },

  async updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket | null> {
    try {
      return await apiFetch<Ticket>(`/api/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
    } catch (err) {
      if (err instanceof ApiError) throw err
      return localAdapter.updateTicket(id, patch)
    }
  },

  async deleteTicket(id: string): Promise<boolean> {
    try {
      await apiFetch(`/api/tickets/${id}`, { method: 'DELETE' })
      return true
    } catch (err) {
      if (err instanceof ApiError) throw err
      return localAdapter.deleteTicket(id)
    }
  },
}
