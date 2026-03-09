import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { Ticket, TicketType } from "../types.ts";

async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.isAuthenticated) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
}

export const ticketsRouter: FastifyPluginAsync = async (app) => {
  // GET /api/tickets
  app.get("/", { preHandler: requireAuth }, async (req) => {
    return req.storage.getTickets();
  });

  // GET /api/tickets/:id
  app.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: requireAuth },
    async (req, reply) => {
      const ticket = await req.storage.getTicket(req.params.id);
      if (!ticket) return reply.status(404).send({ error: "Not found" });
      return ticket;
    },
  );

  // POST /api/tickets
  app.post<{
    Body: { subject: string; description?: string; type?: TicketType };
  }>("/", { preHandler: requireAuth }, async (req, reply) => {
    const { subject, description = "", type = "other" } = req.body;
    if (!subject?.trim()) {
      return reply.status(400).send({ error: "subject is required" });
    }
    const ticket = await req.storage.createTicket({
      subject: subject.trim(),
      description,
      type,
      userId: req.user?.id,
    });
    return reply.status(201).send(ticket);
  });

  // PATCH /api/tickets/:id
  app.patch<{
    Params: { id: string };
    Body: Partial<Ticket>;
  }>("/:id", { preHandler: requireAuth }, async (req, reply) => {
    const ticket = await req.storage.updateTicket(req.params.id, req.body);
    if (!ticket) return reply.status(404).send({ error: "Not found" });
    return ticket;
  });

  // DELETE /api/tickets/:id
  app.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: requireAuth },
    async (req, reply) => {
      await req.storage.deleteTicket(req.params.id);
      return reply.status(204).send();
    },
  );
};
