import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { OAuth2Client } from "google-auth-library";
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from "unique-names-generator";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

const isProd = process.env.NODE_ENV === "production";

export const authRouter: FastifyPluginAsync = async (fastify) => {
  // GET /api/auth/google — redirect to Google consent screen
  fastify.get("/google", async (_req, reply) => {
    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "profile"],
    });
    reply.redirect(url);
  });

  // GET /api/auth/callback — exchange code, upsert user, set session
  fastify.get<{ Querystring: { code?: string } }>(
    "/callback",
    async (req, reply) => {
      const { code } = req.query;
      if (!code) return reply.status(400).send({ error: "Missing code" });

      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload()!;

      // Look up existing user by Google ID
      let user = db
        .select()
        .from(users)
        .where(eq(users.googleId, payload.sub))
        .get();

      if (!user) {
        let username = uniqueNamesGenerator({
          dictionaries: [adjectives, animals],
          separator: " ",
          length: 2,
        });

        // Collision retry — append a random suffix if username is taken
        const existing = db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, username))
          .get();
        if (existing) username += `-${Math.floor(Math.random() * 1000)}`;

        const newUser = {
          id: crypto.randomUUID(),
          googleId: payload.sub,
          username,
          avatarUrl: payload.picture ?? null,
          createdAt: new Date().toISOString(),
        };

        db.insert(users).values(newUser).run();

        user = newUser;
      }

      req.session.user = user;
      reply.redirect(process.env.FRONTEND_URL ?? "http://localhost:5173");
    },
  );

  // GET /api/auth/me — return current session user
  fastify.get("/me", async (req, reply) => {
    if (!req.isAuthenticated)
      return reply.status(401).send({ error: "Unauthenticated" });
    reply.send(req.user);
  });

  // POST /api/auth/logout
  fastify.post("/logout", async (req, reply) => {
    await req.session.destroy();
    reply.send({ ok: true });
  });

  // GET /api/auth/csrf-token — used by the frontend to get a CSRF token
  // before making state-mutating requests in production.
  // In dev this route still exists but returns a no-op token.
  fastify.get("/csrf-token", async (req, reply) => {
    if (isProd) {
      const token = reply.generateCsrf();
      return reply.send({ token });
    }
    return reply.send({ token: null });
  });
};
