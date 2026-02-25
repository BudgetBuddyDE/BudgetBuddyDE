---
title: Start Development
icon: lucide/terminal
tags: [development]
---

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (Latest LTS version recommended)
- [npm](https://www.npmjs.com/) (Comes with Node.js)
- [Git](https://git-scm.com/)

## Getting Started

Follow these steps to set up the project locally:

1. Clone the repository
   ```bash
   git clone git@github.com/BudgetBuddyDE/BudgetBuddyDE.git
   cd BudgetBuddyDE
   ```
2. Install the dependencies
    ```bash
    # As workspaces are used, you only need to run the install command once at the root of the project.
    npm install
    ```
3. Build apps, services and packages
   ```bash
   # You need to build the packages first, as the apps and services depend on them. If you want to build everything at once, you can simply run `npm run build` and it will take care of the correct order for you.
   npm run build-packages
   
   npm run build # Builds all apps, services and packages in the monorepo. You can also build individual apps, services or packages if you only want to work on a specific part of the project.
   
   # Build individual apps, services and packages
   npm run build-apps
   npm run build-services
   npm run build-packages
   ```
4. Start database
   ```bash
    # Both the Auth Service and the Backend require a database. You can use Docker to start the databases locally.
    docker compose up -d
   ```
5. Start the apps and services
   ```bash
   # This will start all apps and services in development mode. You can also start individual apps and services if you only want to work on a specific part of the project.
   npm run dev
   ```

## Additional scripts

```bash
npm run format # Formats the code using biome.js

npm run check # Checks the code for formatting issues, linting errors and type errors.
npm run check:write # Checks the code and automatically fixes formatting issues and linting errors.
```