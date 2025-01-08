# Auth-Service

## Getting started

1. Clone the repository

   ```shell
   git clone git@github.com:BudgetBuddyDE/Auth-Service.git
   ```

2. Set all required environment-variables as defined in the `.env.example`
3. Install all required dependencies

   ```shell
   npm install
   ```

4. Start the application

   ```shell
   npm run dev
   ```

### Other commands

- Migrate your database

  ```shell
  npx better-auth migrate
  ```

- Run unit-tests

  ```shell
  npm run test:run
  ```

- Build an cli

  ```shell
  bun build ./src/server.ts --compile --outfile auth-service
  ```
