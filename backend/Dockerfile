FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json ./
COPY drizzle.config.ts ./
COPY drizzle/ ./drizzle/
COPY src/ ./src/

RUN bun install --frozen-lockfile

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 4500

ENTRYPOINT ["./entrypoint.sh"]

