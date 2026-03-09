FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY index.html ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY src/ ./src/
COPY public/ ./public/

# VITE_API_URL must be set at build time — Vite bakes it into the bundle
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN bun install --frozen-lockfile
RUN bun run build

# ---- serve ----
FROM oven/bun:1-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/vite.config.ts ./

EXPOSE 4501

CMD ["bun", "run", "node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "4501"]
