import type { Session } from 'fastify'
import { eq, lt } from 'drizzle-orm'
import { db } from './index.js'
import { sessions } from './schema.js'

type Callback = (err?: any) => void
type CallbackSession = (err: any, result?: Session | null) => void

export class SqliteSessionStore {
  private prune() {
    db.delete(sessions).where(lt(sessions.expiresAt, Date.now())).run()
  }

  constructor() {
    this.prune()
    setInterval(() => this.prune(), 60 * 60 * 1000).unref()
  }

  get(sessionId: string, callback: CallbackSession): void {
    try {
      const row = db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .get()

      if (!row) return callback(null, null)

      if (row.expiresAt < Date.now()) {
        this.destroy(sessionId, () => {})
        return callback(null, null)
      }

      callback(null, JSON.parse(row.data) as Session)
    } catch (err) {
      callback(err)
    }
  }

  set(sessionId: string, session: Session, callback: Callback): void {
    try {
      const expiresAt =
        session.cookie.expires instanceof Date
          ? session.cookie.expires.getTime()
          : Date.now() + (session.cookie.originalMaxAge ?? 7 * 24 * 60 * 60 * 1000)

      db
        .insert(sessions)
        .values({ id: sessionId, data: JSON.stringify(session), expiresAt })
        .onConflictDoUpdate({
          target: sessions.id,
          set: { data: JSON.stringify(session), expiresAt },
        })
        .run()

      callback()
    } catch (err) {
      callback(err)
    }
  }

  destroy(sessionId: string, callback: Callback): void {
    try {
      db.delete(sessions).where(eq(sessions.id, sessionId)).run()
      callback()
    } catch (err) {
      callback(err)
    }
  }
}
