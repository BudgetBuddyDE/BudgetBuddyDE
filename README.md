<p align="center">
  <h1 align="center">
    BudgetBuddyDE
  </h1>

  <p align="center">
    <img src="https://img.shields.io/github/license/BudgetBuddyDE/BudgetBuddyDE?label=License" alt="GitHub License" />
    <img src="https://img.shields.io/github/issues/BudgetBuddyDE/BudgetBuddyDE?label=Issues" alt="GitHub Open Issues" />
    <img src="https://img.shields.io/github/issues-pr/BudgetBuddyDE/BudgetBuddyDE?label=Pull%20Requests" alt="GitHub Open Pull Requets" />
    <img src="https://img.shields.io/github/repo-size/BudgetBuddyDE/BudgetBuddyDE?label=Repo%20Size" alt="GitHub Repo Size" />
  </p>

  <p align="center">
    <a href="https://budget-buddy.de">Website</a>
    ·
    <a href="https://app.budget-buddy.de">App</a>
    ·
    <a href="https://docs.budget-buddy.de">Docs</a>
    ·
    <a href="https://github.com/BudgetBuddyDE/BudgetBuddyDE/issues">Issues</a>
  </p>
</p>

A modern, open-source personal finance manager built with React. Track transactions, manage recurring payments, and visualize your budget all in one place.

<p align="center">
  <strong>One-click deploy on Railway:</strong><br/>
  <a href="https://railway.com/deploy/WjE5vD?referralCode=SD-6Xm&utm_medium=integration&utm_source=template&utm_campaign=generic">
    <img src="https://railway.com/button.svg" alt="Deploy on Railway" />
  </a>
</p>

## Features

- **Dashboard** — Real-time overview of your financial health, upcoming payments, and recent transactions
- **Transactions** — Record and categorize income & expenses
- **Recurring Payments** — Track subscriptions and regular bills so you never miss one
- **Analytics** — Interactive charts and budget monitoring
- **Customization** — Manage your own categories and payment methods

## Project Structure

Monorepo powered by [Turbo](https://turbo.build/).

### Apps

- **[Webapp](apps/webapp):** The main application for managing your budget.
- **[Website](apps/website):** The landing page.`
- **[Documentation](apps/documentation):** The documentation.`

### Services

- **[Auth Service](./apps/documentation/docs/services/auth-service.md):** Handles user authentication and authorization.
- **[Backend](./apps/documentation/docs/services/backend.md):** The main backend service providing the API.

### Packages

- **[Database](./apps/documentation/docs/packages/db.md):** DrizzleORM database schema definitions.
- **[Api](./apps/documentation/docs/packages/api.md):** Type-safe API client for backend communication.`
- **[Logger](./apps/documentation/docs/packages/logger.md):** (Deprecated) Shared logging utility.
- **[Utils](./apps/documentation/docs/packages/utils.md):** Shared utility functions.
- **[Types](./apps/documentation/docs/packages/types.md):** Shared TypeScript types and schemas.

## Getting Started

> [!TIP]
> For a full setup guide (local & production), see the [documentation](https://docs.budget-buddy.de).

```bash
git clone git@github.com:BudgetBuddyDE/BudgetBuddyDE.git
cd BudgetBuddyDE
npm install
npm run build-packages
```
