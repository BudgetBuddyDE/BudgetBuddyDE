# Webapp

[[ToC]]

## Overview

> [!IMPORTANT]
> In order for the application to be fully operational, the following services must also be deployed: [Pocketbase](pocketbase.md), [Subscription Service](subscription-service.md).

## Getting started

1. Clone the repository

   ```bash
   git clone https://github.com/BudgetBuddyDE/Webapp.git
   # or via ssh
   git clone git@github.com:BudgetBuddyDE/Webapp.git
   ```

2. Install the dependencies

   ```bash
   npm install
   ```

3. Set all required environment variables as defined in the `.env.example`
4. Adjust the configuration file `src/app.config.ts`.
5. Start the application
   ```bash
   npm run start
   # or in developer mode
   npm run dev
   ```
