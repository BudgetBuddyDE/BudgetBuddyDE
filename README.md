# BudgetBuddyDE

> [!WARNING]
> The project is currently undergoing restructuring. Therefore, not all services are currently available in this repository, and the documentation has not yet been fully updated. The goal is to increase development speed, making it easier to ship features and improvements with better quality. Ultimately, this aims to enhance several aspects of the user experience (UX).

## Getting started

1. Clone this repository

   ```bash
   git clone git@github.com:BudgetBuddyDE/BudgetBuddyDE.git
   ```

## Folder structure

```
.github/
  ├── workflows/         # GitHub Actions workflows
  └── ISSUE_TEMPLATE/    # Templates for GitHub issues
ci/                      # Concourse workflows
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
LICENSE.md               # Project license
README.md                # Project overview and instructions
```
