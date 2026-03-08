import type { FastifyPluginAsync } from "fastify";
import { OAuth2Client } from "google-auth-library";
import { eq } from "drizzle-orm";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import type { User } from "../types.ts";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4500/api/auth/callback";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

const oauthClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

function generateUsername(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: " ",
    length: 3,
  });
}

export const authRouter: FastifyPluginAsync = async (app) => {
  // ── Step 1: Redirect to Google ──────────────────────────────
  app.get("/google", async (_req, reply) => {
    const url = oauthClient.generateAuthUrl({
      access_type: "online",
      // Only request openid + profile — no email scope
      scope: ["openid", "profile"],
      prompt: "select_account",
    });
    return reply.redirect(url);
  });

  // ── Step 2: Google redirects back here ──────────────────────
  app.get<{ Querystring: { code?: string; error?: string } }>(
    "/callback",
    async (req, reply) => {
      const { code, error } = req.query;

      if (error || !code) {
        return reply.redirect(`${FRONTEND_URL}?error=oauth_denied`);
      }

      try {
        const { tokens } = await oauthClient.getToken(code);
        oauthClient.setCredentials(tokens);

        const ticket = await oauthClient.verifyIdToken({
          idToken: tokens.id_token!,
          audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload?.sub) {
          return reply.redirect(`${FRONTEND_URL}?error=invalid_token`);
        }

        const googleId = payload.sub;
        const avatarUrl = payload.picture ?? null;

        // Find or create user
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.googleId, googleId))
          .limit(1);

        let user: User;

        if (existing[0]) {
          // Returning user — refresh avatar
          await db
            .update(users)
            .set({ avatarUrl })
            .where(eq(users.googleId, googleId));
          user = {
            id: existing[0].id,
            googleId: existing[0].googleId,
            username: existing[0].username,
            avatarUrl: avatarUrl ?? existing[0].avatarUrl,
            createdAt: existing[0].createdAt,
          };
        } else {
          // New user — generate readable username
          let username = generateUsername();
          // Retry on collision (very rare)
          const collision = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.username, username))
            .limit(1);
          if (collision[0]) {
            username = `${generateUsername()}-${Math.floor(Math.random() * 999)}`;
          }

          const id = crypto.randomUUID();
          const now = new Date().toISOString();
          await db
            .insert(users)
            .values({ id, googleId, username, avatarUrl, createdAt: now });
          user = { id, googleId, username, avatarUrl, createdAt: now };
        }

        req.session.user = user;
        return reply.redirect(FRONTEND_URL);
      } catch (err) {
        app.log.error(err, "OAuth callback error");
        return reply.redirect(`${FRONTEND_URL}?error=server_error`);
      }
    },
  );

  // /api/auth/me
  app.get("/me", async (req, reply) => {
    if (!req.isAuthenticated || !req.user) {
      return reply.status(401).send({ user: null });
    }
    return reply.send({ user: req.user });
  });

  // /api/auth/logout
  app.post("/logout", async (req, reply) => {
    await req.session.destroy();
    return reply.send({ ok: true });
  });
};
