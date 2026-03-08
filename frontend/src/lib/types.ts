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
  type: TicketType;
  status: "open" | "in-progress" | "resolved" | "closed";
  createdAt: string;
}

export interface IconProps {
  className?: string;
}
