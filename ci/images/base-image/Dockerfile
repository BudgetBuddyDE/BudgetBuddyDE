FROM node:20

RUN corepack enable && \
    corepack prepare pnpm@latest --activate

WORKDIR /app

RUN pnpm --version

CMD ["node"]
