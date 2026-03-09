import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    // Real client IP resolved from CF-Connecting-IP in prod, req.ip in dev
    clientIp: string;
  }
}

export const cloudflareMiddleware: FastifyPluginAsync = fp(async (app) => {
  app.decorateRequest("clientIp", "");

  app.addHook("onRequest", async (req) => {
    // CF-Connecting-IP is set by Cloudflare and cannot be spoofed by the client.
    // X-Forwarded-For is not used here because it can be injected by anyone
    // sending a request directly to the origin, bypassing Cloudflare.
    const cfIp = req.headers["cf-connecting-ip"];
    req.clientIp = (Array.isArray(cfIp) ? cfIp[0] : cfIp) ?? req.ip;
  });
});
