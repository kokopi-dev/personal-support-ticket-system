import type { FastifyPluginAsync } from 'fastify'

export const storageModeRouter: FastifyPluginAsync = async (app) => {
  app.get('/', async (req, reply) => {
    if (!req.isAuthenticated) {
      return reply.status(401).send({ storageMode: 'local' })
    }
    return reply.status(200).send({ storageMode: 'remote' })
  })
}
