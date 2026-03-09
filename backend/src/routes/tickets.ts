import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { Ticket, TicketType } from "../types.ts";
import { TICKET_LIMIT } from "../types.ts";
import { filterContent, filterBody } from "../middleware/contentFilter.ts";

const PAGE_SIZE = 10;

async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.isAuthenticated) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
}

export const ticketsRouter: FastifyPluginAsync = async (app) => {
  // GET /api/tickets/all — admin view, paginated with optional filters
  app.get<{
    Querystring: {
      page?: string;
      status?: Ticket["status"];
      type?: TicketType;
      mine?: string; // "true" to restrict to the requesting user's tickets
    };
  }>("/all", { preHandler: requireAuth }, async (req) => {
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    const filters = {
      status: req.query.status,
      type: req.query.type,
      // If mine=true, scope to the current user's tickets
      userId: req.query.mine === "true" ? req.user!.id : undefined,
    };

    const result = await req.storage.getTicketsPaginated(
      PAGE_SIZE,
      offset,
      filters,
    );
    return {
      data: result.data,
      total: result.total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(result.total / PAGE_SIZE)),
    };
  });

  // GET /api/tickets — returns only the current user's tickets
  app.get("/", { preHandler: requireAuth }, async (req) => {
    return req.storage.getTicketsByUser(req.user!.id);
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

    // Run content filter for authenticated users only
    const filtered = filterContent(subject.trim(), description);
    if (!filtered.ok) {
      return reply.status(400).send({
        error: filtered.reason,
        message: filtered.message,
      });
    }

    const ticket = await req.storage.createTicket({
      subject: filtered.subject,
      description: filtered.description,
      type,
      userId: req.user?.id,
    });
    return reply.status(201).send(ticket);
  });

  // PATCH /api/tickets/:id — user may only update their own tickets
  app.patch<{
    Params: { id: string };
    Body: Partial<Ticket>;
  }>("/:id", { preHandler: requireAuth }, async (req, reply) => {
    const existing = await req.storage.getTicket(req.params.id);
    if (!existing) return reply.status(404).send({ error: "Not found" });
    if (existing.userId !== req.user!.id) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const ticket = await req.storage.updateTicket(req.params.id, req.body);
    if (!ticket) return reply.status(404).send({ error: "Not found" });
    return ticket;
  });

  // GET /api/tickets/:id/replies
  app.get<{ Params: { id: string } }>(
    "/:id/replies",
    { preHandler: requireAuth },
    async (req, reply) => {
      const ticket = await req.storage.getTicket(req.params.id);
      if (!ticket) return reply.status(404).send({ error: "Not found" });
      const replies = await req.storage.getReplies(req.params.id);
      return replies;
    },
  );

  // POST /api/tickets/:id/replies
  app.post<{
    Params: { id: string };
    Body: { body: string; asSupport?: boolean };
  }>("/:id/replies", { preHandler: requireAuth }, async (req, reply) => {
    const { body, asSupport = false } = req.body;
    if (!body?.trim()) {
      return reply.status(400).send({ error: "body is required" });
    }

    const ticket = await req.storage.getTicket(req.params.id);
    if (!ticket) return reply.status(404).send({ error: "Not found" });

    if (ticket.status === "closed") {
      return reply
        .status(409)
        .send({
          error: "ticket_closed",
          message: "Cannot reply to a closed ticket.",
        });
    }

    // Determine role:
    // - Guest ticket (userId null): always "support" since only auth'd users can POST
    // - Owner replying from admin tab with asSupport flag: "support"
    // - Owner replying normally: "user"
    // - Non-owner: blocked by canModify on the frontend; defence-in-depth here returns 403
    const isOwner = ticket.userId === req.user!.id;
    if (!isOwner && ticket.userId !== null) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const authorRole: "user" | "support" =
      ticket.userId === null || asSupport ? "support" : "user";

    const filtered = filterBody(body.trim());
    if (!filtered.ok) {
      return reply
        .status(400)
        .send({ error: filtered.reason, message: filtered.message });
    }

    const newReply = await req.storage.createReply({
      ticketId: req.params.id,
      body: filtered.description,
      userId: req.user!.id,
      authorRole,
    });
    return reply.status(201).send(newReply);
  });
  app.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: requireAuth },
    async (req, reply) => {
      const existing = await req.storage.getTicket(req.params.id);
      if (!existing) return reply.status(404).send({ error: "Not found" });
      if (existing.userId !== req.user!.id) {
        return reply.status(403).send({ error: "Forbidden" });
      }
      await req.storage.deleteTicket(req.params.id);
      return reply.status(204).send();
    },
  );
};
