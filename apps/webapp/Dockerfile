FROM node:20-alpine AS build

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/budgetbuddyde

ARG SHOW_ENVIRONMENT_DISCLAIMER
ARG STOCK_SERVICE_HOST
ARG MAIL_SERVICE_HOST
ARG POCKETBASE_URL

ENV NPM_CONFIG_UPDATE_NOTIFIER false
ENV NPM_CONFIG_FUND false

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV production
ENV SHOW_ENVIRONMENT_DISCLAIMER $SHOW_ENVIRONMENT_DISCLAIMER
ENV STOCK_SERVICE_HOST $STOCK_SERVICE_HOST
ENV MAIL_SERVICE_HOST $MAIL_SERVICE_HOST
ENV POCKETBASE_URL $POCKETBASE_URL

RUN npm run build

FROM nginx:1.21.1-alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]