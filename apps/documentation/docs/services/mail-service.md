# Mail-Service

[[ToC]]

## Overview

The Mail-Service is based on [React-Email](https://react.email) and [Resend](https://resend.com), and uses [Bun](https://bun.sh) as the underlying framework. In the future, the service will be rebuilt as a native solution without relying on an external SaaS, in order to prevent dependency on external providers and to avoid sharing data with Resend.

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

## Flows

### Opt-in

```mermaid
flowchart TD
   A{{User requests to join the mailing list}} --> B[Mail service checks if the newsletter exists]
   B --> C((X))
   C --> D{{Newsletter doesn't exist}} --> E((End))
   C --> F{{Newsletter exists}}
   F --> G[Check if newsletter is active]
   G --> H((X))
   H --> I{{Newsletter is inactive}} --> J((End))
   H --> K{{Newsletter is active}}
   K --> L[Send confirmation email]
   L --> N{{User ignores mail}} --> O((X))
   O -->|Yes| P((End))
   O -->|No| Q{{User didn't ignore email}}
   Q --> AA[User clicks 'subscribe' in the email]
   AA --> AB{{User gets redirected to the mail service endpoitn}}
   AB --> AC[Add user to mailing list]
   AC --> AD{{User was added to mailing list}}
   AD --> AE((End))
```
