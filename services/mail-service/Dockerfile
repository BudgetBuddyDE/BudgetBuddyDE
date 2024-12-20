FROM node:alpine AS builder

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/mail-service

WORKDIR /usr/src/mail-service/

COPY package*.json ./

RUN npm install --frozen-lockfile

COPY . .

RUN npm run build

FROM node:alpine

WORKDIR /usr/src/mail-service/

COPY --from=builder /usr/src/mail-service/package*.json ./
COPY --from=builder /usr/src/mail-service/node_modules ./node_modules
COPY --from=builder /usr/src/mail-service/build ./build

ENV NODE_ENV=production

CMD ["npm", "start"]