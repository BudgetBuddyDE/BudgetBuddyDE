FROM node:alpine AS builder

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/budgetbuddyde

WORKDIR /usr/src/auth-service/

COPY package*.json ./

RUN npm install --frozen-lockfile

COPY . .

RUN npm run build

FROM node:alpine

WORKDIR /usr/src/auth-service/

COPY --from=builder /usr/src/auth-service/package*.json ./
COPY --from=builder /usr/src/auth-service/node_modules ./node_modules
COPY --from=builder /usr/src/auth-service/build ./build

ENV NODE_ENV=production

CMD ["npm", "start"]