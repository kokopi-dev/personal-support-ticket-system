import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import session from '@fastify/session'
import { authMiddleware } from './middleware/auth.ts'
import { storageMiddleware } from './middleware/storage.ts'
import { storageModeRouter } from './routes/storageMode.ts'
import { ticketsRouter } from './routes/tickets.ts'
import { authRouter } from './routes/auth.ts'

const app = Fastify({ logger: true })
const PORT = Number(process.env.PORT) || 4500

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

await app.register(cookie)

await app.register(session, {
  secret: process.env.SESSION_SECRET ?? 'dev-secret-change-in-production-min-32-chars!!',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
})

await app.register(authMiddleware)
await app.register(storageMiddleware)

await app.register(storageModeRouter, { prefix: '/api/storage-mode' })
await app.register(ticketsRouter,     { prefix: '/api/tickets' })
await app.register(authRouter,        { prefix: '/api/auth' })

await app.listen({ port: PORT })
console.log(`Backend running on http://localhost:${PORT}`)
