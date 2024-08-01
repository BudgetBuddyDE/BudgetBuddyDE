FROM node:alpine

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/stock-service

WORKDIR /usr/src/stock-service/

COPY package*.json ./
COPY .husky ./.husky

RUN npm install --frozen-lockfile

COPY . .

RUN npm run build

CMD ["npm", "start"]