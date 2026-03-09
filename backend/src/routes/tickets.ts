import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { Ticket, TicketType } from "../types.ts";
import { TICKET_LIMIT } from "../types.ts";

async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.isAuthenticated) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
}

export const ticketsRouter: FastifyPluginAsync = async (app) => {
  // GET /api/tickets/all — admin view, returns all tickets in the system
  app.get("/all", { preHandler: requireAuth }, async (req) => {
    return req.storage.getTickets();
  });

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

    // Enforce per-user ticket limit
    if (req.user?.id) {
      const userTicketCount = await req.storage.countTicketsByUser(req.user.id);
      if (userTicketCount >= TICKET_LIMIT) {
        return reply.status(429).send({
          error: "ticket_limit_reached",
          message: `You have reached the maximum of ${TICKET_LIMIT} support tickets. Please delete some from the admin view before creating new ones.`,
          limit: TICKET_LIMIT,
          current: userTicketCount,
        });
      }
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
