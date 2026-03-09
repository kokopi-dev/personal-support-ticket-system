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

export interface Reply {
  id: string
  ticketId: string
  userId: string | null
  username: string | null
  body: string
  authorRole: 'user' | 'support'
  createdAt: string
}

export interface IconProps {
  className?: string;
}

export interface User {
  id: string
  googleId: string
  username: string
  avatarUrl: string | null
  createdAt: string
}
