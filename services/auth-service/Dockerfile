FROM oven/bun:1 AS build

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/budgetbuddyde

WORKDIR /app

COPY package.json .

RUN bun install --frozen-lockfile

COPY src ./src

RUN bun build ./src/server.ts --compile --outfile auth-service

FROM ubuntu:22.04

WORKDIR /app

COPY --from=build /app/auth-service /app/auth-service

ENV NODE_ENV=production

CMD ["/app/auth-service"]