# Buildtime Stage
FROM node:22-slim AS builder

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/backend

WORKDIR /usr/src/backend/

# COPY package*.json ./
COPY . .

RUN npm install

RUN npx cds build --production

# Runtime Stage
FROM node:22-slim

ARG DB_HOST
ARG DB_PORT
ARG DB_USER
ARG DB_PASSWORD
ARG DB_DATABASE

WORKDIR /usr/src/backend/

COPY --from=builder /usr/src/backend/package*.json ./
COPY --from=builder /usr/src/backend/node_modules ./node_modules
COPY --from=builder /usr/src/backend/gen ./gen

ENV PORT=4004
ENV NODE_ENV=production

RUN printf '{"requires":{"db":{"[production]":{"kind":"postgres","credentials":{"host":"%s","port":%s,"user":"%s","password":"%s","database":"%s"}}}}}' \
    "$DB_HOST" "$DB_PORT" "$DB_USER" "$DB_PASSWORD" "$DB_DATABASE" \
    > ./gen/srv/.cdsrc.json

EXPOSE 4004

CMD ["npx", "cds", "run", "./gen/srv/", "--profile", "production"]