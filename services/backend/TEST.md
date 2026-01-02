# Backend Testing Documentation

This document describes the testing strategy, infrastructure, and procedures for the BudgetBuddyDE backend service.

## Overview

The backend service uses [Vitest](https://vitest.dev/) as the primary testing framework to ensure code quality, validate business logic, and verify security constraints. The test suite includes both unit and integration tests that validate:

- Authentication and authorization flows
- User data isolation and access control
- Business logic for KPI aggregation
- CRUD operations for all entities
- Data integrity and foreign key constraints

## Test Architecture

### Test Types

#### Unit Tests
Located in `src/__tests__/unit/`, these tests validate individual components in isolation:
- API response model builders
- Authentication context helpers
- HTTP status code handling
- User isolation primitives

#### Integration Tests
Located in `src/__tests__/integration/`, these tests validate complete request-response flows:
- Category router endpoints
- Transaction router endpoints
- Payment method router endpoints
- End-to-end authorization enforcement

### Test Infrastructure

#### Test Helpers (`src/__tests__/helpers/`)

**Database Helpers (`db.helper.ts`)**
- `createTestFixtures(userId)`: Creates a complete set of test data (categories, payment methods, transactions, budgets) for a given user
- `cleanupTestData(userId)`: Removes all test data for a user in the correct order to respect foreign key constraints

**Authentication Helpers (`auth.helper.ts`)**
- `createMockContext(userId)`: Creates a mock authentication context for testing
- `mockAuthMiddleware(userId)`: Express middleware that bypasses the auth service for isolated testing
- `generateTestUserId(suffix)`: Generates unique user IDs for test isolation

#### Technical Decisions

**Sequential Test Execution**
Tests are configured to run sequentially (not in parallel) to avoid database conflicts between test files. This is configured in `vitest.config.ts`:
```typescript
fileParallelism: false,
pool: 'forks',
poolOptions: {
  forks: { singleFork: true }
}
```

**Mock Authentication**
Tests bypass the actual authentication service using mock middleware. This provides:
- Faster test execution
- Better test isolation
- No dependency on external auth service
- Full control over user context

**Fixture Management**
Test fixtures are created and cleaned up in a specific order to respect database foreign key constraints:
1. Delete: transactions → recurring payments → budgets → categories → payment methods
2. Create: categories → payment methods → transactions → budgets → budget-category links

## Prerequisites

### Required Services

Before running tests, ensure the following services are available:

1. **PostgreSQL Database**
   - Default connection: `postgresql://myuser:mypassword@localhost:5433/mydatabase`
   - Can be started via Docker Compose: `docker compose up -d backend_db`

2. **Redis Cache**
   - Default connection: `redis://:mycachepassword@localhost:6379`
   - Can be started via Docker Compose: `docker compose up -d cache`

### Environment Setup

1. **Create Test Environment File**
   
   Copy the test environment template:
   ```bash
   cp .env.example .env.test
   ```

   The `.env.test` file should contain:
   ```env
   AUTH_SERVICE_HOST=http://localhost:8080
   DATABASE_URL=postgresql://myuser:mypassword@localhost:5433/mydatabase
   REDIS_URL=redis://:mycachepassword@localhost:6379
   REDIS_DB=1
   TRUSTED_ORIGINS=http://localhost:3000
   LOG_LEVEL=error
   LOG_HIDE_META=true
   TIMEZONE=Europe/Berlin
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Database Migrations**
   ```bash
   npm run db:migrate
   ```

4. **Build Required Packages**
   
   The backend depends on internal packages that must be built:
   ```bash
   cd ../../packages/logger && npm run build
   cd ../../packages/utils && npm run build
   ```

## Running Tests

### Run All Tests
```bash
npm run test
```

### Run Specific Test Files
```bash
npm run test -- src/__tests__/unit/
npm run test -- src/__tests__/integration/
npm run test -- src/__tests__/integration/category.test.ts
```

### Run Tests with Coverage
```bash
npm run test -- --coverage
```

### Run Tests in Watch Mode (Development)
```bash
npm run test -- --watch
```

### Run Tests with Specific Pattern
```bash
npm run test -- -t "should return all categories"
```

## Test Coverage

### Current Test Statistics

- **Total Tests**: 69
- **Unit Tests**: 13
- **Integration Tests**: 56

### Coverage by Router

| Router | Tests | Coverage Areas |
|--------|-------|----------------|
| Category | 19 | CRUD, merge operations, statistics aggregation, authorization |
| Transaction | 20 | CRUD, date filtering, income/expense calculations, receiver aggregation |
| Payment Method | 17 | CRUD, merge operations, authorization |

### Key Test Scenarios

#### Authentication & Authorization
- ✅ Users can only access their own data
- ✅ Cross-user access attempts are properly rejected (401/404)
- ✅ Unauthorized requests without valid session are blocked
- ✅ Data isolation between users is enforced

#### Business Logic Validation
- ✅ Category statistics correctly aggregate income/expense by category
- ✅ Date range filtering works across all endpoints
- ✅ Income/expense calculations handle positive/negative amounts correctly
- ✅ Merge operations migrate related data before deletion

#### Data Integrity
- ✅ Foreign key constraints are respected
- ✅ Cascade deletes work as expected
- ✅ Transaction data properly linked to categories and payment methods
- ✅ Budget categories correctly reference both budgets and categories

## Writing New Tests

### Unit Test Example

```typescript
import {describe, expect, it} from 'vitest';
import {ApiResponse, HTTPStatusCode} from '../../models';

describe('ApiResponse Model', () => {
  it('should build a successful response with data', () => {
    const response = ApiResponse.builder<{name: string}>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Success')
      .withData({name: 'Test'})
      .build();

    expect(response.status).toBe(HTTPStatusCode.OK);
    expect(response.message).toBe('Success');
    expect(response.data).toEqual({name: 'Test'});
  });
});
```

### Integration Test Example

```typescript
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import {cleanupTestData, createTestFixtures, generateTestUserId, mockAuthMiddleware} from '../helpers';
import {categoryRouter} from '../../router/category.router';
import {HTTPStatusCode} from '../../models';

describe('Category Router Integration Tests', () => {
  let app: express.Application;
  let testUserId: string;
  let testFixtures: Awaited<ReturnType<typeof createTestFixtures>>;

  beforeEach(async () => {
    testUserId = generateTestUserId('main');
    testFixtures = await createTestFixtures(testUserId);

    app = express();
    app.use(bodyParser.json());
    app.use(mockAuthMiddleware(testUserId));
    app.use('/api/category', categoryRouter);
  });

  afterEach(async () => {
    await cleanupTestData(testUserId);
  });

  it('should return all categories for the authenticated user', async () => {
    const response = await request(app).get('/api/category');

    expect(response.status).toBe(HTTPStatusCode.OK);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.totalCount).toBe(2);
  });
});
```

### Best Practices

1. **Use Unique User IDs**: Always use `generateTestUserId()` with a descriptive suffix to avoid conflicts
2. **Clean Up Test Data**: Always use `afterEach` hook to clean up test data
3. **Test User Isolation**: Include tests that verify users cannot access other users' data
4. **Use Type-Safe Fixtures**: Leverage TypeScript's type inference with test fixtures
5. **Test Both Success and Failure Cases**: Include tests for invalid inputs and unauthorized access
6. **Keep Tests Focused**: Each test should validate one specific behavior

## Troubleshooting

### Common Issues

**Problem**: Tests fail with foreign key constraint violations
- **Solution**: Ensure `cleanupTestData()` is called in `afterEach` and test fixtures are created in the correct order

**Problem**: Database connection errors
- **Solution**: Verify PostgreSQL is running (`docker compose ps`) and migrations are applied (`npm run db:migrate`)

**Problem**: Tests pass individually but fail when run together
- **Solution**: Check for data cleanup issues or shared state between tests. Ensure `afterEach` properly cleans up test data.

**Problem**: Module resolution errors for `@budgetbuddyde/logger` or `@budgetbuddyde/utils`
- **Solution**: Build the internal packages: `cd ../../packages/logger && npm run build && cd ../../packages/utils && npm run build`

### Debugging Tests

**Enable Debug Logging**
Set `LOG_LEVEL=debug` in `.env.test` to see detailed database queries and application logs.

**Run Single Test**
Use the `-t` flag to run a specific test:
```bash
npm run test -- -t "should create a new category"
```

**Inspect Database State**
During test development, comment out the `afterEach` cleanup to inspect database state after test execution.

## Continuous Integration

Tests are automatically run in CI/CD pipelines before merging pull requests. The CI environment:

1. Starts PostgreSQL and Redis containers
2. Runs database migrations
3. Executes all tests sequentially
4. Generates coverage reports
5. Runs linting and security checks

All tests must pass before code can be merged to the main branch.

## Future Enhancements

Potential areas for test expansion:

- [ ] Budget router integration tests
- [ ] Recurring payment router integration tests  
- [ ] Budget estimation calculations
- [ ] Performance/load testing
- [ ] End-to-end tests with real auth service
- [ ] API contract testing
- [ ] Mutation testing for test quality validation
