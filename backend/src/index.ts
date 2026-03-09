import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import session from '@fastify/session'
import csrf from '@fastify/csrf-protection'

import { authMiddleware } from './middleware/auth.js'
import { storageMiddleware } from './middleware/storage.js'
import { ticketsRouter } from './routes/tickets.js'
import { authRouter } from './routes/auth.js'
import { SqliteSessionStore } from './db/sessionStore.js'

const isProd = process.env.NODE_ENV === 'production'

const app = Fastify({ logger: true })

await app.register(cors, {
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

await app.register(cookie)

await app.register(session, {
  secret: process.env.SESSION_SECRET!,
  store: new SqliteSessionStore(),       // ← persistent SQLite store
  cookie: {
    httpOnly: true,
    secure: isProd,                      // HTTPS-only in production
    sameSite: isProd ? 'strict' : 'lax', // strict in prod, lax in dev
    maxAge: 7 * 24 * 60 * 60 * 1000,    // 7 days in ms
  },
  saveUninitialized: false,
})

if (isProd) {
  await app.register(csrf, {
    sessionPlugin: '@fastify/session',
  })
}

await app.register(authMiddleware)
await app.register(storageMiddleware)

await app.register(authRouter, { prefix: '/api/auth' })
await app.register(ticketsRouter, { prefix: '/api/tickets' })

await app.listen({ port: 4500, host: 'localhost' })
