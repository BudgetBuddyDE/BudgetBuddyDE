FROM node:18-alpine AS build

LABEL org.opencontainers.image.source=https://github.com/budgetbuddyde/budgetbuddyde

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run docs:build

FROM nginx:1.21.1-alpine

COPY --from=build /app/.vitepress/dist /usr/share/nginx/html

COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]