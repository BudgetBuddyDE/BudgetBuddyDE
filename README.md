# Webapp

## Getting started

1. Clone the repository

   ```bash
   git clone git@github.com:BudgetBuddyDE/Webapp.git
   ```

2. Set all required environment-variables as defined in the `.env.example` and them under `.env`
3. Install dependencies

   ```bash
   npm i
   ```

4. Run the application

   > [!WARNING]
   > In order for the application to be fully functional, the services and the database must be accessible. For more information on how to start the services, please refer to the [BudgetBuddyDE/Webapp](https://github.com/BudgetBuddyDE/Webapp.git) repository.

   ```bash
   npm run dev
   npm run dev --host # if you want to expose it to your network
   ```
