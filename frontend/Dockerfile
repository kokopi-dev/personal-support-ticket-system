FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY index.html ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY src/ ./src/
COPY public/ ./public/
COPY .env ./

RUN bun install --frozen-lockfile
RUN bun run build
