FROM node:alpine AS builder

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/stock-service

WORKDIR /usr/src/stock-service/

COPY package*.json ./
COPY .husky ./.husky

RUN npm install --frozen-lockfile

COPY . .

RUN npm run build

FROM node:alpine

WORKDIR /usr/src/stock-service/

COPY --from=builder /usr/src/stock-service/package*.json ./
COPY --from=builder /usr/src/stock-service/node_modules ./node_modules
COPY --from=builder /usr/src/stock-service/build ./build

CMD ["npm", "start"]