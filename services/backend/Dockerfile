FROM node:24.21.0-alpine AS builder

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/budgetbuddyde

WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build -- --filter=@budgetbuddyde/backend
RUN npm prune --omit=dev --ignore-scripts

FROM node:24.21.0-alpine
ARG SOURCE_SHA
LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/budgetbuddyde
LABEL org.opencontainers.image.revision=$SOURCE_SHA

WORKDIR /app
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages ./packages
COPY --from=builder --chown=node:node /app/services/backend ./services/backend

ENV NODE_ENV=production

USER node
CMD ["node", "services/backend/build/src/server.js"]
