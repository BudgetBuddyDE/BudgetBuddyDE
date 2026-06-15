---
title: Start Development
icon: lucide/terminal
tags: [development, guide]
---

BudgetBuddyDE is an npm-based monorepo. All apps, services, and packages are linked from the repository through npm workspaces. Local builds therefore always use the local package version and do not require publishing to npm first.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) 22 or newer
- [npm](https://www.npmjs.com/) 11.x matching the version declared in `package.json`
- [Git](https://git-scm.com/)
- Access to the required `.env` files for the webapp and services

## Getting Started

Follow these steps to set up the project locally:

1.  Clone the repository

    ```bash
    git clone git@github.com/BudgetBuddyDE/BudgetBuddyDE.git
    cd BudgetBuddyDE
    ```

2.  Install the dependencies

    ```bash
    # As workspaces are used, you only need to run the install command once at the root of the project.
    npm install
    ```

    npm creates symlinks for all workspaces in `node_modules/@budgetbuddyde/*`.

3.  Build packages

    ```bash
    # You need to build the packages first, as the apps and services depend on them.
    npm run build-packages

    # Builds all apps, services and packages in the monorepo. Turborepo handles the correct order.
    npm run build

    # Build individual workspace groups
    npm run build-apps
    npm run build-services
    ```

4.  Start the database

    ```bash
    # Both the Auth Service and the Backend require a database. Use Docker to start them locally.
    docker compose up -d
    ```

5.  Configure environment variables

    ```bash
    # Most services require an .env file. Copy from the example in each directory.
    cp .env.example .env
    ```

6.  Start the apps and services

    ```bash
    # Starts all dev tasks through Turborepo
    npm run dev

    # Starts services only
    npm run dev-services
    ```

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

## Additional scripts

```bash
npm run format       # Formats the code using Prettier
npm run check        # Checks formatting, linting and types
npm run check:write  # Checks and automatically fixes formatting and linting issues
```

## Local package resolution

Internal dependencies are declared with the local package versions. As long as the workspace name and version match the dependency declaration, npm links the local package instead of installing it from the registry. This is important because this environment does not accept the `workspace:*` protocol.

!!! warning "Version changes"
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

## Troubleshooting

- **Node Version**: Ensure you're using Node.js v22+ for compatibility with all features.
- **Turbo Cache**: If you encounter unexpected build issues, try clearing the cache: `rm -rf .turbo`.
- **Database Connection**: Verify that Docker is running and the database ports are not occupied.
