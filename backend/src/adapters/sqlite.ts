import { eq } from 'drizzle-orm'
import { db } from '../db/index.ts'
import { tickets } from '../db/schema.ts'
import type { Ticket, StorageAdapter } from '../types.ts'

export class SQLiteAdapter implements StorageAdapter {
  getTickets(): Ticket[] {
    return db.select().from(tickets).all()
  }

  getTicket(id: string): Ticket | null {
    return db.select().from(tickets).where(eq(tickets.id, id)).get() ?? null
  }

  createTicket({ subject, description, type }: Pick<Ticket, 'subject' | 'description' | 'type'>): Ticket {
    const ticket: Ticket = {
      id: crypto.randomUUID(),
      subject,
      description,
      status: 'open',
      type,
      createdAt: new Date().toISOString(),
    }
    db.insert(tickets).values(ticket).run()
    return ticket
  }

  updateTicket(id: string, patch: Partial<Ticket>): Ticket | null {
    const current = this.getTicket(id)
    if (!current) return null
    db.update(tickets).set(patch).where(eq(tickets.id, id)).run()
    return { ...current, ...patch }
  }

  deleteTicket(id: string): void {
    db.delete(tickets).where(eq(tickets.id, id)).run()
  }
}
