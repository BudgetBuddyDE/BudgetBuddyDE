# Auth-Service

## Getting started

1. Clone the repository

   ```shell
   git clone git@github.com:budgetbuddyde/budgetbuddyde.git
   cd ./services/auth-service
   ```

2. Set all required environment-variables as defined in the `.env.example`
3. Install all required dependencies

   ```shell
   bun i
   ```

4. Start the application

   ```shell
   bun dev
   ```

### Commands

**Run the tests**

```bash
bun test:run
```

#### Database migration

> [!TIP]
> For more information about the schema generation and migration have a look into [the documentation](https://www.better-auth.com/docs/basic-usage#migrate-database).

**Generate the database schema**

```bash
npx @better-auth/cli generate
# or use
npm run generate
```

**Migrate the schema**

```bash
npx @better-auth/cli migrate
# or use
npm run migrate
```
