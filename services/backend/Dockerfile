# syntax=docker/dockerfile:1

ARG VITE_PLUS_IMAGE=ghcr.io/voidzero-dev/vite-plus:1.3.0@sha256:61860c1b58bf35878605280802809973c668f1594675298c3be553a98ac06e59

FROM ${VITE_PLUS_IMAGE} AS manifests

WORKDIR /app

COPY --chown=vp:vp package.json package-lock.json .node-version ./
COPY --chown=vp:vp packages/api/package.json packages/api/package.json
COPY --chown=vp:vp packages/charts/package.json packages/charts/package.json
COPY --chown=vp:vp packages/core/package.json packages/core/package.json
COPY --chown=vp:vp packages/db/package.json packages/db/package.json
COPY --chown=vp:vp packages/logger/package.json packages/logger/package.json
COPY --chown=vp:vp examples/api-key-client/package.json examples/api-key-client/package.json
COPY --chown=vp:vp services/backend/package.json services/backend/package.json

FROM manifests AS build

ENV VP_GIT_HOOKS=0

RUN vp install --frozen-lockfile

COPY --chown=vp:vp . .

RUN npm run build -- --filter=@budgetbuddyde/backend \
  && cp "$(vp env which node | head -1)" /tmp/node

FROM manifests AS production-dependencies

ENV VP_GIT_HOOKS=0

RUN npm_config_ignore_scripts=true npm install --omit=dev --omit=peer --no-audit --no-fund \
  --workspace=@budgetbuddyde/backend --include-workspace-root=false

FROM debian:bookworm-slim AS runtime-files

WORKDIR /runtime

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/services/backend/package.json ./services/backend/package.json
COPY --from=build /app/services/backend/build ./services/backend/build
COPY --from=build /app/packages/api/package.json ./packages/api/package.json
COPY --from=build /app/packages/api/lib ./packages/api/lib
COPY --from=build /app/packages/core/package.json ./packages/core/package.json
COPY --from=build /app/packages/core/lib ./packages/core/lib
COPY --from=build /app/packages/db/package.json ./packages/db/package.json
COPY --from=build /app/packages/db/lib ./packages/db/lib
COPY --from=build /app/packages/logger/package.json ./packages/logger/package.json
COPY --from=build /app/packages/logger/lib ./packages/logger/lib

FROM debian:bookworm-slim AS runtime

ARG SOURCE_SHA=unknown

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/budgetbuddyde \
  org.opencontainers.image.revision=$SOURCE_SHA

WORKDIR /app

ENV NODE_ENV=production

COPY --from=runtime-files --chown=10001:10001 /runtime /app
COPY --from=build /tmp/node /usr/local/bin/node

USER 10001:10001

CMD ["node", "services/backend/build/src/server.js"]
