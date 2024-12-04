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

### Docker-Compose

> [!NOTE]  
> You can find an pre-defined `compose.yml` in the [Setup-Repository](https://github.com/BudgetBuddyDE/setup.git) which also contains the instructions for the setup-process

## Structure

```txt
src/
   __tests__/
   components/ # contains atomic general use components
   features/ # contains feature specific files like components, hooks, services, tests...
   routes/ # contains routes
   services/ # contains general use components
   hooks/ # contains general use hooks
   theme/
      style/
   types/ # contains general use types
```
