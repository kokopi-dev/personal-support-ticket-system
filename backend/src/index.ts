import Fastify from 'fastify'
import cors from '@fastify/cors'
import { authMiddleware } from './middleware/auth.ts'
import { storageMiddleware } from './middleware/storage.ts'
import { storageModeRouter } from './routes/storageMode.ts'
import { ticketsRouter } from './routes/tickets.ts'

const app = Fastify({ logger: true })
const PORT = Number(process.env.PORT) || 3000

await app.register(cors)
await app.register(authMiddleware)
await app.register(storageMiddleware)
await app.register(storageModeRouter, { prefix: '/api/storage-mode' })
await app.register(ticketsRouter, { prefix: '/api/tickets' })

app.listen({ port: PORT }, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
