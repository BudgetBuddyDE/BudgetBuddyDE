# Initial setup guide

BudgetBuddyDE is an npm-based monorepo. All apps, services, and packages are linked from the repository through npm workspaces. Local builds therefore always use the local package version and do not require publishing to npm first.

## Prerequisites

- Node.js 22 or newer
- npm 11.x matching the version declared in `package.json`
- Access to the required `.env` files for the webapp and services

## Installation

```bash
npm install
```

Run the installation from the repository root. npm creates symlinks for all workspaces in `node_modules/@budgetbuddyde/*`.

## Important commands

```bash
npm run dev              # starts all dev tasks through Turborepo
npm run dev-services     # starts services only
npm run format:check     # checks formatting
npm run lint:check       # checks linting without auto-fixes
npm run typecheck        # runs TypeScript checks
npm test                 # runs tests
npm run build            # builds all packages, services, and apps in dependency order
npm run build-packages   # builds packages/* only
npm run build-services   # builds services/* only
npm run build-apps       # builds apps/* only
```

## Local package resolution

Internal dependencies are declared with the local package versions. As long as the workspace name and version match the dependency declaration, npm links the local package instead of installing it from the registry. This is important because this environment does not accept the `workspace:*` protocol.

When you change the version of an internal package, also update all internal consumers and then run:

```bash
npm install --package-lock-only --ignore-scripts
```

## Run CI locally

```bash
npm ci
npm run format:check
npm run lint:check
npm run typecheck
npm test
npm run build
```
