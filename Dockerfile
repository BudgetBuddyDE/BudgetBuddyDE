FROM oven/bun:1 AS build

WORKDIR /app

COPY bun.lockb .
COPY package.json .
COPY .husky ./.husky

RUN bun install --frozen-lockfile

COPY src ./src
COPY transactional ./transactional
COPY .husky ./.husky

# compile everything to a binary called cli which includes the bun runtime
RUN bun build ./src/server.ts --compile --outfile cli

FROM ubuntu:22.04

WORKDIR /app

# copy the compiled binary from the build image
COPY --from=build /app/cli /app/cli

# execute the binary!
CMD ["/app/cli"]