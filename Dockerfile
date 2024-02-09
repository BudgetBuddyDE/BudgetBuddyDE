FROM node:alpine

LABEL org.opencontainers.image.source https://github.com/budgetbuddyde/expressjs-template

WORKDIR /usr/src/app/

COPY package*.json ./


RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]