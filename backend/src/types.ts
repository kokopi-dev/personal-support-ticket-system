export type TicketType =
  | "bug"
  | "billing"
  | "account"
  | "feature-request"
  | "feedback"
  | "other";

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  type: TicketType;
  createdAt: string;
}

export interface StorageAdapter {
  getTickets(): Ticket[];
  getTicket(id: string): Ticket | null;
  createTicket(data: Pick<Ticket, "subject" | "description" | "type">): Ticket;
  updateTicket(id: string, patch: Partial<Ticket>): Ticket | null;
  deleteTicket(id: string): void;
}
