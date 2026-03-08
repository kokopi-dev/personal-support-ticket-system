import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { SQLiteAdapter } from '../adapters/sqlite.ts'
import type { StorageAdapter } from '../types.ts'

declare module 'fastify' {
  interface FastifyRequest {
    storage: StorageAdapter
  }
}

const adapter = new SQLiteAdapter()

export const storageMiddleware: FastifyPluginAsync = fp(async (app) => {
  app.decorateRequest('storage', { getter: () => adapter })
  // app.addHook('onRequest', async (req) => {
  //   req.storage = adapter
  // })
})
