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
    <a href="https://docs.budget-buddy.de">Documentation</a>
    ·
    <a href="https://github.com/BudgetBuddyDE/BudgetBuddyDE/issues">Issues</a>
  </p>
</p>

<p align="center">
  <strong>Deploy BudgetBuddy on Railway with just one click!<br/></strong>
  <a href="https://railway.com/deploy/WjE5vD?referralCode=SD-6Xm&utm_medium=integration&utm_source=template&utm_campaign=generic">
    <img src="https://railway.com/button.svg" alt="Deploy on Railway" />
  </a>
</p>

BudgetBuddy is a modern ReactJS-based web application designed to help you manage your finances and optimize your monthly budget.

## Project Structure

This project is organized as a monorepo using [Turbo](https://turbo.build/).

### Apps

- **[Webapp](apps/webapp):** The main application for managing your budget.
- **[Website](apps/website):** The landing page and documentation.

### Services

- **[Auth Service](services/auth-service):** Handles user authentication and authorization.
- **[Backend](services/backend):** The main backend service providing the API.

### Packages

- **[Logger](packages/logger):** Shared logging utility.
- **[Types](packages/types):** Shared TypeScript types and schemas.
- **[Utils](packages/utils):** Shared utility functions.

## Features

> [!TIP]
> BudgetBuddy is continuously evolving, and new features are regularly added. Stay tuned for updates!

- **Dashboard:** Get a comprehensive overview of your financial health with real-time statistics, upcoming recurring payments, and recent transactions.
- **Transaction Management:** Easily record and categorize your income and expenses to keep your records up to date.
- **Recurring Payments:** Never miss a bill again by tracking your subscriptions and regular payments.
- **Budgeting & Analytics:** Visualize your spending habits with interactive charts and monitor your budget adherence.
- **Category & Payment Method Management:** Customize your financial tracking by managing your own categories and payment methods.
- **Dark Mode:** Fully supported dark mode for a comfortable user experience in any environment.

## Getting started

> [!TIP]
> For a complete guide on how to set up the project locally or in production, it's recommended to check [the documentation](apps/website/content/docs/index.mdx).

1. Clone this repository

   ```bash
   git clone git@github.com:BudgetBuddyDE/BudgetBuddyDE.git
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Build packages

   ```bash
   npm run build-packages
   ```
