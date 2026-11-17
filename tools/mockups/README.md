# Webapp mockups

Capture fresh screenshots of the running BudgetBuddyDE webapp with Playwright.
The runner uses the real application and backend, so screenshots reflect the
currently checked out UI. Use a dedicated demo account with fictional data.

## Requirements

- Node.js 24.21.0 and pnpm from the repository root.
- The backend, webapp, and their database must already be running.
- A dedicated account must contain data for the routes being captured.
- Playwright Chromium must be installed once with `pnpm exec playwright install chromium`.

## Run

Set credentials in the shell, then run:

```bash
MOCKUPS_EMAIL=demo@example.test MOCKUPS_PASSWORD='your-demo-password' pnpm run mockups
```

The command checks backend and webapp readiness, signs in, waits for page content,
and saves desktop and mobile PNGs under `artifacts/mockups/`. It writes outputs
to a staging directory first, preserving the previous successful set if capture
fails.

## Configuration

- `MOCKUPS_BASE_URL`: webapp origin, default `http://localhost:3000`.
- `NEXT_PUBLIC_BACKEND_SERVICE_HOST`: backend origin, default `http://localhost:9000`.
- `MOCKUPS_EMAIL` and `MOCKUPS_PASSWORD`: dedicated demo-user credentials.
- `MOCKUPS_OUTPUT_DIR`: output directory under `artifacts/`, default `artifacts/mockups`.
- `MOCKUPS_TIMEOUT_MS`: per-step timeout, default `45000`.
- `MOCKUPS_IGNORE_HTTPS_ERRORS=true`: accept invalid TLS certificates for a trusted preview only.

Remote service URLs must use HTTPS. HTTP is allowed only for localhost services.

Routes and viewport sizes live in `src/cli.ts`. Demo data setup is intentionally
not automatic: the runner never mutates or resets a database.
