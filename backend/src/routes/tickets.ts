import type { FastifyPluginAsync } from 'fastify'
import type { Ticket } from '../types.ts'

export const ticketsRouter: FastifyPluginAsync = async (app) => {
  app.get('/', async (req) => req.storage.getTickets())

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const ticket = req.storage.getTicket(req.params.id)
    if (!ticket) return reply.status(404).send({ error: 'Not found' })
    return ticket
  })

  app.post<{ Body: Pick<Ticket, 'subject' | 'description'> }>('/', async (req, reply) => {
    const { subject, description } = req.body
    if (!subject?.trim()) return reply.status(400).send({ error: 'subject is required' })
    return reply.status(201).send(req.storage.createTicket({ subject, description }))
  })

  app.patch<{ Params: { id: string }; Body: Partial<Ticket> }>('/:id', async (req, reply) => {
    const ticket = req.storage.updateTicket(req.params.id, req.body)
    if (!ticket) return reply.status(404).send({ error: 'Not found' })
    return ticket
  })

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    req.storage.deleteTicket(req.params.id)
    return reply.status(204).send()
  })
}

