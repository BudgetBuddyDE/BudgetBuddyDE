FROM oven/bun as builder

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/budgetbuddyde

WORKDIR /app

COPY . .

RUN bun install

RUN bun run build

FROM oven/bun

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lockb ./

RUN bun install --production

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "dist/server.js"]