# Mail-Service

The Mail-Service is based on [React-Email](https://react.email) and [Resend](https://resend.com), and uses [Bun](https://bun.sh) as the underlying framework. In the future, the service will be rebuilt as a native solution without relying on an external SaaS, in order to prevent dependency on external providers and to avoid sharing data with Resend.

## Todo

- Workflow for deployment
- Re-strucure code and make it a bit "better"
- Providing tests for reporting and opt-in and opt-out
- Send logs to baselime
- Add routers for code splitting

## Getting started

1. Clone the repo

   ```bash
   git clone git@github.com:BudgetBuddyDE/Mail-Service.git
   ```

2. Install required dependencies

   ```bash
   bun install
   ```

3. Set all required environment variables as defined in the `.env.example`
4. Start the application

   ```bash
   bun run dev
   ```

5. _(Optional)_ Execute an compiled binary

   ```bash
   # Compile to binary
   bun build ./src/server.ts --compile --outfile cli
   # Execute binary
   ./cli
   ```

## Templating

1. Start the react-email server with

   ```bash
   bun run email:dev
   ```

2. Edit the templates in the `transactional/email` folder
