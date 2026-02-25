---
title: "@budgetbuddyde/db"
icon: lucide/package
tags: [package, database]
---

## About

![CI Build Status](https://ci.tklein.it/api/v1/teams/budgetbuddyde/pipelines/db/jobs/build-db/badge?title=Build)
![NPM Version](https://img.shields.io/npm/v/%40budgetbuddyde%2Fdb?label=Version)
![NPM License](https://img.shields.io/npm/l/%40budgetbuddyde%2Fdb?label=License)
![NPM Last Update](https://img.shields.io/npm/last-update/%40budgetbuddyde%2Fdb?label=Last%20Update)

The `@budgetbuddyde/db` package is a shared database schema library that provides a centralized, type-safe database layer for all BudgetBuddy services. Built with Drizzle ORM, it defines the complete database structure including tables, relationships, types, and migration workflows for both the backend and authentication schemas.

**Key Features:**

- **Drizzle ORM Integration** - Modern TypeScript ORM with type-safe queries and excellent developer experience
- **Multi-Schema Architecture** - Separate schemas for backend business logic (`budgetbuddy_backend`) and authentication (`budgetbuddy_auth`)
- **Type Safety** - Fully typed database entities with automatic TypeScript type inference and Zod validation schemas
- **Better-Auth Integration** - Automated schema generation for Better-Auth authentication tables
- **Migration Management** - Complete migration workflow with Drizzle Kit for version-controlled schema changes
- **Shared Library** - Single source of truth for database structure across all services, eliminating duplication

## Getting Started

### Installation

Install the package using your preferred package manager:

```bash
npm install @budgetbuddyde/db
```

### Basic Usage

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { categories, transactions } from '@budgetbuddyde/db/backend';
import { user, session } from '@budgetbuddyde/db/auth';
import { eq } from 'drizzle-orm';

// Initialize database connection
const db = drizzle(process.env.DATABASE_URL);

// Query backend data
const userCategories = await db
  .select()
  .from(categories)
  .where(eq(categories.ownerId, userId));

// Query auth data
const userSession = await db
  .select()
  .from(session)
  .where(eq(session.userId, userId));
```

### Available Exports

The package provides three main entry points:

#### Default Export (`@budgetbuddyde/db`)
- Common utilities and types shared across schemas

#### Backend Schema (`@budgetbuddyde/db/backend`)
- **Tables**: `categories`, `paymentMethods`, `transactions`, `recurringPayments`, `budgets`
- **Relations**: Defined relationships between all backend tables
- **Types**: TypeScript types and Zod schemas for all entities
- **Views**: Predefined database views for complex queries
- **Schema Object**: `backendSchema` - PostgreSQL schema instance

#### Auth Schema (`@budgetbuddyde/db/auth`)
- **Tables**: `user`, `session`, `account`, `verification`
- **Types**: TypeScript types for authentication entities
- **Schema Object**: `authSchema` - PostgreSQL schema instance

### Start Development

To start developing this package locally:

```bash
# Navigate to the package directory
cd packages/db

# Install dependencies
npm install
```

### Build Package

To build the package for production:

```bash
# Build the package
npm run build
```

## Migration Workflows

### Prerequisites

Before running migrations, ensure your database connection is properly configured:

```bash
# Set the database URL environment variable
export DATABASE_URL="postgresql://user:password@localhost:5432/budgetbuddy"

# Or create a .env file in packages/db/
echo "DATABASE_URL=postgresql://user:password@localhost:5432/budgetbuddy" > .env
```

!!! warning
    Make sure that the `DATABASE_URL` environment variable points to the target database where the schema should be applied. If not set, migration commands will fail.

## Deployment

This package is automatically built, tested, and published through our [Concourse CI/CD](https://ci.tklein.it) pipeline. The deployment process includes automated migration validation and version management.

### CI/CD Pipeline

!!! note "CI/CD Pipeline"
    [Pipeline](https://ci.tklein.it/teams/budgetbuddyde/pipelines/db)


## Credits

Developed and maintained by the [BudgetBuddy team](https://github.com/orgs/BudgetBuddyDE/people).
