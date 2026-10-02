# BudgetBuddyDE Webapp v2

Minimal Next.js App Router starter with TypeScript and Mantine. The only page displays the project heading.
No backend, authentication service, or environment variables are required.

## Requirements

- Node.js 24.21.0 or later
- npm 11.x (repository package manager: npm 11.4.2)

Run all commands from the repository root. Dependencies use the shared root lockfile.

```bash
npm ci
npx turbo run dev --filter=@budgetbuddyde/webapp-v2
```

Open <http://localhost:3001>. The development server uses Turbopack.
Mantine follows the system light or dark color scheme.

## Production and checks

```bash
npx turbo run build --filter=@budgetbuddyde/webapp-v2
npx turbo run start --filter=@budgetbuddyde/webapp-v2
npx turbo run format:check lint:check typecheck --filter=@budgetbuddyde/webapp-v2
```

The production server also uses port 3001. Stop the development server before starting it.

Application routes live in `src/app`. The `@/*` import alias resolves to `src/*`.
