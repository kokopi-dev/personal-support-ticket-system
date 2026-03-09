import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { tickets, users, sessions } from './schema.ts'

const sqlite = new Database('app.db')
export const db = drizzle(sqlite, { schema: { tickets, users, sessions } })
