# BudgetBuddyDE

> [!WARNING]
> The project is currently undergoing restructuring. Therefore, not all services are currently available in this repository, and the documentation has not yet been fully updated. The goal is to increase development speed, making it easier to ship features and improvements with better quality. Ultimately, this aims to enhance several aspects of the user experience (UX).

BudgetBuddy is a modern ReactJS-based web application designed to help you manage your finances and optimize your monthly budget.

## Features

- **Stock Portfolio Tracking:** Keep track of your investments and monitor the performance of your portfolio.
- **Stock Newsletter:** Subscribe to personalized updates to stay informed about the latest changes in your portfolio.
- **Financial Reports:** Generate weekly and monthly reports to visualize your spending and identify trends.
- **Income and Expense Analysis:** Gain insights into your financial situation and discover opportunities to save.

## Getting started

1. Clone this repository

   ```bash
   git clone git@github.com:BudgetBuddyDE/BudgetBuddyDE.git
   ```

2. Setup GIT hooks

   ```bash
   pnpm i # will install husky
   ```

## Folder structure

```
.github/
  ├── workflows/         # GitHub Actions workflows
  └── ISSUE_TEMPLATE/    # Templates for GitHub issues
ci/
  ├── pipelines/         # Concourse workflows
  └── secrets/           # Secrets for workflows
docs/                    # Main documentation for the project
apps/
  ├── webapp/            # Main frontend application
  ├── website/           # Public-facing website
  └── documentation/     # Uses files from <root_dir>/docs
services/
  ├── core-service/      # Core backend service for managing data
  ├── auth-service/      # Auth service
  ├── pocketbase/        # Core backend service
  ├── stock-service/     # Service for managing stock
  └── mail-service/      # Service for email functionality
packages/
  ├── types/             # Type definitions and interfaces
  └── utils/             # Reusable utility functions and libraries
config/
  ├── docker/            # Docker configuration files
  ├── compose/           # docker-compose.yml and related files
  └── env/               # Environment configuration files (.env)
LICENSE                  # Project license
README.md                # Project overview and instructions
```
