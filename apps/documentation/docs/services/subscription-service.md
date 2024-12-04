# Subscription-Service

[[ToC]]

## Overview

The Subscription Service seamlessly manages recurring payments for users within the app. It automatically executes the stored payments and generates transactions that users can view within the app.

## Getting started

> [!TIP]
> The Docker image is available under `ghcr.io/budgetbuddyde/subscription-service`

1. Clone the repository

   ```bash
   git clone https://github.com/BudgetBuddyDE/Subscription-Service.git
   # or via ssh
   git clone git@github.com:BudgetBuddyDE/Subscription-Service.git
   ```

2. Install the dependencies

   ```bash
   npm install
   ```

3. Set all required environment variables as defined in the `.env.example`
4. Start the application
   ```bash
   npm run start
   # or in developer mode
   npm run dev
   ```
