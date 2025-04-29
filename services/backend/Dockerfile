FROM node:alpine AS builder

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/budgetbuddyde

WORKDIR /usr/src/backend/

COPY package*.json ./

RUN npm install --frozen-lockfile

COPY . .

RUN npm run build

FROM node:alpine

WORKDIR /usr/src/backend/

COPY --from=builder /usr/src/backend/package*.json ./
COPY --from=builder /usr/src/backend/node_modules ./node_modules
COPY --from=builder /usr/src/backend/build ./build

CMD ["npm", "start"]