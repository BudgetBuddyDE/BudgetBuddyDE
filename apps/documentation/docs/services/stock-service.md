# Stock-Service

[[ToC]]

## Overview

The Stock Service is responsible for retrieving current prices of securities and providing detailed information about assets. Users can search for specific assets through the service and then access detailed information about the asset. Additionally, registered users of the app can create a watchlist through the service and manage positions of specific securities to stay informed about the current market value of their positions. Users are also able to view future dividends of a specific asset.

> [!IMPORTANT]
> The Docker image and repository are not publicly available at this moment.

## Features

::: details Manage Stock Positions
Users can create a watchlist to track current price information for selected securities.
:::

::: details Retrieve quotes
Get the latest security prices for assets listed on different exchanges.
:::

::: details Real-time Price Updates
Stay updated with real-time price changes by subscribing to a websocket endpoint for specific securities. Users can subscribe and unsubscribe from live price updates and receive updates for the securities they have subscribed to.
:::

::: details Dividends
View upcoming dividend payouts for owned positions.
:::

::: details Watchlist
Create a personalized watchlist to easily monitor the prices of selected assets.
:::

::: details Metal Quotes
Retrieve current daily prices for gold, platinum, and silver using the [metalpriceapi](https://metalpriceapi.com/).
:::

::: details Caching with Redis
Caching the metal prices to transmit them faster to the client and reduce the costs of using external APIs.
:::

## Getting started

1. Clone the repository

   ```bash
   git clone https://github.com/BudgetBuddyDE/Stock-Service.git
   # or via ssh
   git clone git@github.com:BudgetBuddyDE/Stock-Service.git
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
