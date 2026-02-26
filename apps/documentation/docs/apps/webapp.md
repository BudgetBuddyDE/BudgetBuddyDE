---
title: Webapp
icon: lucide/app-window
tags:
    - app
---

# Webapp 

## Overview

![version](https://img.shields.io/github/v/tag/budgetbuddyde/budgetbuddyde?filter=webapp*&cacheSeconds=3600)

The Webapp is the main application of BudgetBuddyDE, providing users with an intuitive and user-friendly interface to manage their finances. 
It is based on Next.js with TypeScript and uses the [auth-service](../services/auth-service.md#overview) as well as the [backend](../services/backend.md) to process and store data.

## Features

### Authentication

- User registration and login
- Password reset via email
- Email verification after registration
- OAuth2 login (Google, Github)

### Budgeting

- Create and manage budgets
- Categorization of expenses
- Visualization of expenses and income
- Monthly reports and analytics (upcoming)

## Architecture

### Technologies

- Framework: [Next.js](https://github.com/nextjs/next.js)
- UI Library: [Material UI](https://mui.com/)
- Language: [TypeScript](https://github.com/microsoft/TypeScript)

### API

| Method | Path        | Description     |
|--------|-------------|-----------------|
| GET    | /api/health | Health endpoint |

## Development

### Start locally

```bash
# Install dependencies
npm install
 
# Start in development mode
npm run dev
```

### Lint & Format

```bash
# Check linter
npm run check
 
# Automatically fix linter errors
npm run check:write
 
# Format code
npm run format
```

### Configuration

#### Environment Variables

| Variable                           | Description                              | Default value       |
|------------------------------------|------------------------------------------|---------------------|
| `NEXT_PUBLIC_AUTH_SERVICE_HOST`    | Host URL of the Auth-Service             | `undefined`         |
| `NEXT_PUBLIC_BACKEND_SERVICE_HOST` | Host URL of the Backend-Service          | `undefined`         |
| `TEMPO_URL`                        | Ingest URL for the Tempo tracing service | `http://tempo:4318` |
| `NEXT_OTEL_VERBOSE`                | Enable verbose OpenTelemetry tracing     | `undefined`         |

!!! note
    The environment variable `TEMPO_URL` is only required if the server is started with tracing functionality. Next.js traces more spans than are emitted by default. To see more spans, you must set `NEXT_OTEL_VERBOSE=1`.

For more information on setting up OpenTelemetry for Next.js, refer to the [official documentation](https://nextjs.org/docs/15/app/guides/open-telemetry).

## Testing

The Webapp uses [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/) for unit and component tests.

### Setup

The test configuration lives in `vitest.config.mts` at the app root and extends the workspace base config (`vitest.config.ts`). Key settings:

- **Environment:** `jsdom` (simulates a browser DOM)
- **Setup file:** `src/vitest.setup.ts` — extends Vitest with `@testing-library/jest-dom` matchers and globally mocks `next/navigation`
- **Globals:** enabled (no explicit `import { describe, it, expect }` needed in test files)

```ts title="vitest.config.mts"
export default mergeConfig(baseConfig, defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    name: "webapp",
    environment: "jsdom",
    setupFiles: ["./src/vitest.setup.ts"],
  }
}));
```

### Running Tests

```bash
# Run all tests once
npm run test

# Run in watch mode
npm run test:watch
```

### Coverage

| Category | Files |
|---|---|
| **UI Components** | `ErrorAlert`, `NoResults`, `CircularProgress`, `Card` (incl. Header/Title/Subtitle/Body/Footer/HeaderActions), `ActionPaper`, `CloseIconButton`, `AddFab`, `Brand`, `Icon`, `ReadMoreText`, `ErrorBoundary`, `SnackbarProvider` / `useSnackbarContext`, `DeleteDialog`, `PasswordInput` |
| **Utilities** | `parseNumber`, `determineOS` / `isRunningOnIOs`, `CurrencyFormatter`, `DateFormatter`, `PercentageFormatter` |
| **Hooks** | `useKeyPress`, `useWindowDimensions` / `getBreakpoint`, `useScreenSize` |

### Conventions

- Test files sit **next to the source file** they test (e.g. `ErrorAlert.tsx` → `ErrorAlert.test.tsx`).
- Utility tests use `.spec.ts`, component tests use `.test.tsx`.
- MUI components that have environment issues (e.g. `Snackbar`) are isolated by testing **context/hook behaviour** rather than full rendering.
- `next/navigation` (`usePathname`, `useRouter`, `useSearchParams`) is globally mocked in `src/vitest.setup.ts` so components that use routing can be rendered without a Next.js runtime.
- Error Boundary tests suppress `console.error` via `vi.spyOn` to keep test output clean.

### Important Notes

!!! warning "Snackbar rendering"
    MUI's `Snackbar` component cannot be fully rendered in the jsdom environment (React 19 + MUI v7 compatibility). The `SnackbarProvider` tests therefore use `renderHook` to verify context behaviour instead of rendering the full provider tree.

!!! note "next/navigation mock"
    The global mock for `next/navigation` is applied in `src/vitest.setup.ts`. If a component requires specific router state (e.g. a particular pathname), override the mock locally with `vi.mocked(usePathname).mockReturnValue('/my-path')`.

## Deployment

The service is automatically deployed via a Railway CI/CD pipeline on every push to the `main` branch.

### Dependencies

The Webapp uses the following internal packages:

- [@tklein1801/logger.js](https://www.npmjs.com/package/@tklein1801/logger.js/v/0.0.1)
- [@budgetbuddyde/api](../packages/api.md)
- [@budgetbuddyde/db](../packages/db.md)

and requires the following internal services:

- [Auth-Service](../services/auth-service.md)
- [Backend](../services/backend.md)

### Railway

BudgetBuddyDE is designed to be easily deployable on [Railway](https://railway.app/).

[![Railway Logo](https://railway.com/button.svg)](https://railway.com/deploy/WjE5vD?referralCode=SD-6Xm&utm_medium=integration&utm_source=template&utm_campaign=generic)