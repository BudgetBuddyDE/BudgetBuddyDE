# syntax=docker/dockerfile:1

ARG NGINX_IMAGE=nginx:1.27-alpine
ARG VITE_PLUS_IMAGE=ghcr.io/voidzero-dev/vite-plus:1.3.0@sha256:61860c1b58bf35878605280802809973c668f1594675298c3be553a98ac06e59

FROM ${VITE_PLUS_IMAGE} AS manifests

WORKDIR /app

COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version ./
COPY --chown=vp:vp apps/documentation/package.json apps/documentation/package.json
COPY --chown=vp:vp apps/webapp/package.json apps/webapp/package.json
COPY --chown=vp:vp examples/api-key-client/package.json examples/api-key-client/package.json
COPY --chown=vp:vp packages/api/package.json packages/api/package.json
COPY --chown=vp:vp packages/charts/package.json packages/charts/package.json
COPY --chown=vp:vp packages/core/package.json packages/core/package.json
COPY --chown=vp:vp packages/db/package.json packages/db/package.json
COPY --chown=vp:vp packages/logger/package.json packages/logger/package.json
COPY --chown=vp:vp services/backend/package.json services/backend/package.json

FROM manifests AS build

ENV VP_GIT_HOOKS=0

RUN vp install --frozen-lockfile

COPY --chown=vp:vp . .

RUN pnpm run build --filter=@budgetbuddyde/documentation

FROM ${NGINX_IMAGE} AS runtime

COPY --from=build --chown=nginx:nginx /app/apps/documentation/dist/public /usr/share/nginx/html
COPY --from=build /app/apps/documentation/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
