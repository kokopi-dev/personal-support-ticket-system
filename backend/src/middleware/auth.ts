import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    isAuthenticated: boolean
  }
}

export const authMiddleware: FastifyPluginAsync = fp(async (app) => {
  app.decorateRequest('isAuthenticated', false)
  app.addHook('onRequest', async (req) => {
    // hardcoded false — replace with real session/token check when auth is implemented
    req.isAuthenticated = false
  })
})
