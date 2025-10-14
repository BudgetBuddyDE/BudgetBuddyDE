FROM node:22-slim AS builder

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/backend

WORKDIR /usr/src/backend/

# COPY package*.json ./
COPY . .

RUN npm install

RUN npx cds build --production

FROM node:22-slim

WORKDIR /usr/src/backend/

COPY --from=builder /usr/src/backend/package*.json ./
COPY --from=builder /usr/src/backend/node_modules ./node_modules
COPY --from=builder /usr/src/backend/gen ./gen

ENV PORT=4004

CMD ["npx", "cds", "run", "./gen/srv/", "--profile", "production"]
