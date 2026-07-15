# `@budgetbuddyde/backend`

For full documentation, visit **[docs.budget-buddy.de › Services › Backend](https://docs.budget-buddy.de/services/backend/)**.

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Start in development mode
npm run dev

# Build for production
npm run build

# Start in production mode
npm start
```

## Credits

- [ExpressJS](https://expressjs.com/)
- [Drizzle ORM](https://orm.drizzle.team/)

## Configuration

All service configuration is centralized in [`src/config.ts`](src/config.ts). This includes environment-backed
infrastructure settings as well as rate limiting, scheduled jobs, caching, and attachment processing limits.
Backend modules consume the exported `config` object instead of reading environment variables directly.

## Attachment performance and safety

Transaction attachment endpoints are optimized for large attachment collections:

- `GET /api/transaction/:id/attachments` is paginated. When no range is supplied, the backend returns the first 24 attachments and caps each request at 100 attachments.
- `GET /api/transaction` returns only a small signed-url preview per transaction while still returning `attachmentCount` for the full count.
- Uploads are protected with server-side limits of 10 files per request and 20 MiB per file. The backend validates attachment content types and only accepts the configured image formats.
- Signed URLs remain short-lived and are generated only for the attachments that are actually returned to the client.
