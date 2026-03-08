import { eq } from 'drizzle-orm'
import { db } from '../db/index.ts'
import { tickets } from '../db/schema.ts'
import type { StorageAdapter, Ticket, TicketType } from '../types.ts'

export class SQLiteAdapter implements StorageAdapter {
  async getTickets(): Promise<Ticket[]> {
    const rows = await db.select().from(tickets).orderBy(tickets.createdAt)
    return rows.map(toTicket).reverse()
  }

  async getTicket(id: string): Promise<Ticket | null> {
    const rows = await db.select().from(tickets).where(eq(tickets.id, id))
    return rows[0] ? toTicket(rows[0]) : null
  }

  async createTicket(
    data: Pick<Ticket, 'subject' | 'description' | 'type'> & { userId?: string }
  ): Promise<Ticket> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await db.insert(tickets).values({
      id,
      userId: data.userId ?? null,
      subject: data.subject,
      description: data.description,
      type: data.type,
      status: 'open',
      createdAt: now,
    })
    return (await this.getTicket(id))!
  }

  async updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket | null> {
    await db.update(tickets).set(patch).where(eq(tickets.id, id))
    return this.getTicket(id)
  }

  async deleteTicket(id: string): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id))
  }
}

function toTicket(row: typeof tickets.$inferSelect): Ticket {
  return {
    id: row.id,
    userId: row.userId,
    subject: row.subject,
    description: row.description,
    type: row.type as TicketType,
    status: row.status as Ticket['status'],
    createdAt: row.createdAt,
  }
}
