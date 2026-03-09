export interface User {
  id: string
  googleId: string
  username: string
  avatarUrl: string | null
  createdAt: string
}

export type TicketType =
  | "bug"
  | "billing"
  | "account"
  | "feature-request"
  | "feedback"
  | "other";

export interface Ticket {
  id: string
  userId: string | null
  username: string | null
  subject: string
  description: string
  type: TicketType
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  createdAt: string
}

export const TICKET_LIMIT = 10
export const REPLY_LIMIT = 20

export interface TicketFilters {
  status?: Ticket['status']
  type?: TicketType
  userId?: string
}

export interface PaginatedTickets {
  data: Ticket[]
  total: number
}

export interface Reply {
  id: string
  ticketId: string
  userId: string | null
  username: string | null
  body: string
  authorRole: 'user' | 'support'
  createdAt: string
}

export interface StorageAdapter {
  getTickets(): Promise<Ticket[]>
  getTicketsByUser(userId: string): Promise<Ticket[]>
  getTicketsPaginated(limit: number, offset: number, filters?: TicketFilters): Promise<PaginatedTickets>
  getTicket(id: string): Promise<Ticket | null>
  countTicketsByUser(userId: string): Promise<number>
  createTicket(data: Pick<Ticket, 'subject' | 'description' | 'type'> & { userId?: string }): Promise<Ticket>
  updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket | null>
  deleteTicket(id: string): Promise<void>
  getReplies(ticketId: string): Promise<Reply[]>
  countRepliesByTicket(ticketId: string): Promise<number>
  createReply(data: { ticketId: string; body: string; userId?: string; authorRole: Reply['authorRole'] }): Promise<Reply>
}
