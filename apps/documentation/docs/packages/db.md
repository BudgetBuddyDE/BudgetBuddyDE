# @budgetbuddyde/db

## About

![CI Build Status](https://ci.tklein.it/api/v1/teams/budgetbuddyde/pipelines/db/jobs/build-db/badge?title=Build)
![NPM Version](https://img.shields.io/npm/v/%40budgetbuddyde%2Fdb?label=Version)
![NPM License](https://img.shields.io/npm/l/%40budgetbuddyde%2Fdb?label=License)
![NPM Last Update](https://img.shields.io/npm/last-update/%40budgetbuddyde%2Fdb?label=Last%20Update)

Brief description of what this package does and its purpose within the BudgetBuddy ecosystem.

**Key Features:**

- Feature 1
- Feature 2
- Feature 3

## Getting Started

### Installation

Install the package using your preferred package manager:

```bash
npm install @budgetbuddy/db
```

### Start Development

To start developing this package locally:

```bash
# Navigate to the package directory
cd packages/db

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Build Package

To build the package for production:

```bash
# Build the package
npm run build

# Run tests
npm run test
```

## Deployment

This package is automatically built, tested, and published through our [Concourse CI/CD](https://ci.tklein.it) pipeline.

```mermaid
graph LR
    A[Push to main] --> B[build-package Job]
    B --> C[Install Dependencies]
    C --> D[Run Tests]
    D --> E[Build Package]
    E --> F[Dry-Run Publish]
    F --> G[Bump RC]
    G --> H{Manual Release Trigger}
    H -->|Patch| I[release-patch]
    H -->|Minor| J[release-minor]
    H -->|Major| K[release-major]
    I --> L[Install & Test & Build]
    J --> L
    K --> L
    L --> M[Bump Version]
    M --> N[Commit & Tag]
    N --> O[Publish to npm]
    
    style H fill:#ff9800,stroke:#333,stroke-width:2px
    style B fill:#4caf50,stroke:#333,stroke-width:2px
    style I fill:#2196f3,stroke:#333,stroke-width:2px
    style J fill:#2196f3,stroke:#333,stroke-width:2px
    style K fill:#2196f3,stroke:#333,stroke-width:2px
```

## Credits

Developed and maintained by the [BudgetBuddy team](https://github.com/orgs/BudgetBuddyDE/people).
