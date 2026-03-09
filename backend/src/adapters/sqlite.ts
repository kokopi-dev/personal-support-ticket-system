import { eq, count, desc, and, type SQL } from "drizzle-orm";
import { db } from "../db/index.ts";
import { tickets, users, ticketReplies } from "../db/schema.ts";
import type {
  StorageAdapter,
  Ticket,
  TicketType,
  PaginatedTickets,
  TicketFilters,
  Reply,
} from "../types.ts";

const ticketSelect = {
  id: tickets.id,
  userId: tickets.userId,
  subject: tickets.subject,
  description: tickets.description,
  type: tickets.type,
  status: tickets.status,
  createdAt: tickets.createdAt,
  username: users.username,
};

type TicketRow = {
  id: string;
  userId: string | null;
  subject: string;
  description: string;
  type: string;
  status: string;
  createdAt: string;
  username: string | null;
};

export class SQLiteAdapter implements StorageAdapter {
  async getTickets(): Promise<Ticket[]> {
    const rows = await db
      .select(ticketSelect)
      .from(tickets)
      .leftJoin(users, eq(tickets.userId, users.id))
      .orderBy(desc(tickets.createdAt));
    return rows.map(toTicket);
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    const rows = await db
      .select(ticketSelect)
      .from(tickets)
      .leftJoin(users, eq(tickets.userId, users.id))
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.createdAt));
    return rows.map(toTicket);
  }

  async getTicketsPaginated(
    limit: number,
    offset: number,
    filters: TicketFilters = {},
  ): Promise<PaginatedTickets> {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(tickets.status, filters.status));
    if (filters.type) conditions.push(eq(tickets.type, filters.type));
    if (filters.userId) conditions.push(eq(tickets.userId, filters.userId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select(ticketSelect)
        .from(tickets)
        .leftJoin(users, eq(tickets.userId, users.id))
        .where(where)
        .orderBy(desc(tickets.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(tickets).where(where),
    ]);
    return {
      data: rows.map(toTicket),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async getTicket(id: string): Promise<Ticket | null> {
    const rows = await db
      .select(ticketSelect)
      .from(tickets)
      .leftJoin(users, eq(tickets.userId, users.id))
      .where(eq(tickets.id, id));
    return rows[0] ? toTicket(rows[0]) : null;
  }

  async countTicketsByUser(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.userId, userId));
    return result[0]?.count ?? 0;
  }

  async createTicket(
    data: Pick<Ticket, "subject" | "description" | "type"> & {
      userId?: string;
    },
  ): Promise<Ticket> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.insert(tickets).values({
      id,
      userId: data.userId ?? null,
      subject: data.subject,
      description: data.description,
      type: data.type,
      status: "open",
      createdAt: now,
    });
    return (await this.getTicket(id))!;
  }

  async updateTicket(
    id: string,
    patch: Partial<Ticket>,
  ): Promise<Ticket | null> {
    // Strip username — it's a derived field from the join, not a column
    const { username: _, ...columnPatch } = patch as Ticket;
    await db.update(tickets).set(columnPatch).where(eq(tickets.id, id));
    return this.getTicket(id);
  }

  async deleteTicket(id: string): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  async countRepliesByTicket(ticketId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(ticketReplies)
      .where(eq(ticketReplies.ticketId, ticketId));
    return result[0]?.count ?? 0;
  }

  async getReplies(ticketId: string): Promise<Reply[]> {
    const rows = await db
      .select({
        id: ticketReplies.id,
        ticketId: ticketReplies.ticketId,
        userId: ticketReplies.userId,
        body: ticketReplies.body,
        authorRole: ticketReplies.authorRole,
        createdAt: ticketReplies.createdAt,
        username: users.username,
      })
      .from(ticketReplies)
      .leftJoin(users, eq(ticketReplies.userId, users.id))
      .where(eq(ticketReplies.ticketId, ticketId))
      .orderBy(ticketReplies.createdAt);
    return rows.map((r) => ({
      ...r,
      authorRole: r.authorRole as Reply["authorRole"],
      username: r.username ?? null,
    }));
  }

  async createReply(data: {
    ticketId: string;
    body: string;
    userId?: string;
    authorRole: Reply["authorRole"];
  }): Promise<Reply> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.insert(ticketReplies).values({
      id,
      ticketId: data.ticketId,
      userId: data.userId ?? null,
      body: data.body,
      authorRole: data.authorRole,
      createdAt: now,
    });
    const rows = await db
      .select({
        id: ticketReplies.id,
        ticketId: ticketReplies.ticketId,
        userId: ticketReplies.userId,
        body: ticketReplies.body,
        authorRole: ticketReplies.authorRole,
        createdAt: ticketReplies.createdAt,
        username: users.username,
      })
      .from(ticketReplies)
      .leftJoin(users, eq(ticketReplies.userId, users.id))
      .where(eq(ticketReplies.id, id));
    const row = rows[0]!;
    return {
      ...row,
      authorRole: row.authorRole as Reply["authorRole"],
      username: row.username ?? null,
    };
  }
}

function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    userId: row.userId,
    username: row.username ?? null,
    subject: row.subject,
    description: row.description,
    type: row.type as TicketType,
    status: row.status as Ticket["status"],
    createdAt: row.createdAt,
  };
}
