import type { Ticket, TicketType, Reply } from "./types";
import { env } from "../env";

const API = env.apiUrl;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    // Try to parse a structured error body; fall back to a generic message
    let code = `http_${res.status}`;
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) code = body.error;
      if (body?.message) message = body.message;
    } catch {
      /* non-JSON body — keep defaults */
    }
    throw new ApiError(res.status, code, message);
  }
  return res.json();
}

const LOCAL_KEY = "support_tickets";

function localGet(): Ticket[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function localSet(tickets: Ticket[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(tickets));
}

export const localAdapter = {
  getTickets: (): Ticket[] => localGet(),

  createTicket: (data: {
    subject: string;
    description: string;
    type: TicketType;
  }): Ticket => {
    const ticket: Ticket = {
      id: crypto.randomUUID(),
      userId: null,
      username: null,
      subject: data.subject,
      description: data.description,
      type: data.type,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    localSet([ticket, ...localGet()]);
    return ticket;
  },

  updateTicket: (id: string, patch: Partial<Ticket>): Ticket | null => {
    const tickets = localGet();
    const idx = tickets.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    tickets[idx] = { ...tickets[idx], ...patch };
    localSet(tickets);
    return tickets[idx];
  },

  deleteTicket: (id: string): boolean => {
    const before = localGet();
    const after = before.filter((t) => t.id !== id);
    localSet(after);
    return after.length < before.length;
  },
};

const LOCAL_REPLIES_KEY = "support_replies";

function repliesGet(): Reply[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_REPLIES_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function repliesSet(replies: Reply[]) {
  localStorage.setItem(LOCAL_REPLIES_KEY, JSON.stringify(replies));
}

export const localReplyAdapter = {
  getReplies: (ticketId: string): Reply[] =>
    repliesGet().filter((r) => r.ticketId === ticketId),

  createReply: (ticketId: string, body: string, asSupport = false): Reply => {
    const reply: Reply = {
      id: crypto.randomUUID(),
      ticketId,
      userId: null,
      username: null,
      body,
      authorRole: asSupport ? "support" : "user",
      createdAt: new Date().toISOString(),
    };
    repliesSet([...repliesGet(), reply]);
    return reply;
  },
};

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TicketFilters {
  status?: Ticket["status"];
  type?: TicketType;
  mine?: boolean; // restrict to the current user's tickets
}

export const storage = {
  // User's own tickets — API when authenticated, localStorage when guest
  async getTickets(isAuthenticated: boolean): Promise<Ticket[]> {
    if (!isAuthenticated) return localAdapter.getTickets();
    return apiFetch<Ticket[]>("/api/tickets");
  },

  // Admin view — paginated from API when authenticated, sliced localStorage when guest
  async getAllTickets(
    isAuthenticated: boolean,
    page = 1,
    pageSize = 20,
    filters: TicketFilters = {},
  ): Promise<PaginatedResponse<Ticket>> {
    if (!isAuthenticated) {
      let all = localAdapter.getTickets();
      if (filters.status) all = all.filter((t) => t.status === filters.status);
      if (filters.type) all = all.filter((t) => t.type === filters.type);
      const start = (page - 1) * pageSize;
      return {
        data: all.slice(start, start + pageSize),
        total: all.length,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
      };
    }

    const params = new URLSearchParams({ page: String(page) });
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.mine) params.set("mine", "true");

    return apiFetch<PaginatedResponse<Ticket>>(`/api/tickets/all?${params}`);
  },

  async createTicket(
    isAuthenticated: boolean,
    data: { subject: string; description: string; type: TicketType },
  ): Promise<Ticket> {
    if (!isAuthenticated) return localAdapter.createTicket(data);
    return apiFetch<Ticket>("/api/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateTicket(
    isAuthenticated: boolean,
    id: string,
    patch: Partial<Ticket>,
  ): Promise<Ticket | null> {
    if (!isAuthenticated) return localAdapter.updateTicket(id, patch);
    return apiFetch<Ticket>(`/api/tickets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  async deleteTicket(isAuthenticated: boolean, id: string): Promise<boolean> {
    if (!isAuthenticated) return localAdapter.deleteTicket(id);
    await apiFetch(`/api/tickets/${id}`, { method: "DELETE" });
    return true;
  },

  async getReplies(
    isAuthenticated: boolean,
    ticketId: string,
  ): Promise<Reply[]> {
    if (!isAuthenticated) return localReplyAdapter.getReplies(ticketId);
    return apiFetch<Reply[]>(`/api/tickets/${ticketId}/replies`);
  },

  async createReply(
    isAuthenticated: boolean,
    ticketId: string,
    body: string,
    asSupport = false,
  ): Promise<Reply> {
    if (!isAuthenticated)
      return localReplyAdapter.createReply(ticketId, body, asSupport);
    return apiFetch<Reply>(`/api/tickets/${ticketId}/replies`, {
      method: "POST",
      body: JSON.stringify({ body, asSupport }),
    });
  },
};
