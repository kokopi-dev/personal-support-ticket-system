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
  subject: string
  description: string
  type: TicketType
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  createdAt: string
}

export interface StorageAdapter {
  getTickets(): Promise<Ticket[]>
  getTicket(id: string): Promise<Ticket | null>
  createTicket(data: Pick<Ticket, 'subject' | 'description' | 'type'> & { userId?: string }): Promise<Ticket>
  updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket | null>
  deleteTicket(id: string): Promise<void>
}
