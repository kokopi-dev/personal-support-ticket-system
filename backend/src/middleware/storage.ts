import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { SQLiteAdapter } from '../adapters/sqlite.ts'
import type { StorageAdapter } from '../types.ts'

declare module 'fastify' {
  interface FastifyRequest {
    storage: StorageAdapter
  }
}

const adapter: StorageAdapter = new SQLiteAdapter()

const plugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest('storage', null)
  app.addHook('onRequest', async (req) => {
    req.storage = adapter
  })
}

export const storageMiddleware = fp(plugin)
