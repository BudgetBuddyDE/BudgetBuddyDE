FROM oven/bun:1 AS build

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/stock-service

WORKDIR /app

COPY bun.lockb .
COPY package.json .
COPY .husky ./.husky

RUN bun install --frozen-lockfile

COPY src ./src
COPY .husky ./.husky

# compile everything to a binary called cli which includes the bun runtime
RUN bun build ./src/server.ts --compile --outfile stock-service

FROM ubuntu:22.04

WORKDIR /app

# copy the compiled binary from the build image
COPY --from=build /app/stock-service /app/stock-service

# execute the binary!
CMD ["/app/stock-service"]