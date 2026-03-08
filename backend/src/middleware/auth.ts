import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import type { User } from '../types.ts'

declare module 'fastify' {
  interface FastifyRequest {
    isAuthenticated: boolean
    user: User | null
  }
  interface Session {
    userId?: string
    user?: User
  }
}

export const authMiddleware: FastifyPluginAsync = fp(async (app) => {
  app.decorateRequest('isAuthenticated', false)
  app.decorateRequest('user', null)

  app.addHook('onRequest', async (req) => {
    const sessionUser = req.session?.user
    if (sessionUser) {
      req.isAuthenticated = true
      req.user = sessionUser
    } else {
      req.isAuthenticated = false
      req.user = null
    }
  })
})
