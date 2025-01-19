FROM oven/bun as builder

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/budgetbuddyde

WORKDIR /app

COPY . .

RUN bun install

CMD ["bun", "run", "build"]

FROM alpine:3.18

RUN apk add --no-cache nodejs libuv

COPY --from=builder /bin/bun /bin/bun

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lockb ./

RUN bun install --production

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000


CMD ["bun", "run", "dist/server.js"]