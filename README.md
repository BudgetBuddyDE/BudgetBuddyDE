# Stock-Service

The Stock-Service is based on [ExpressJS](https://expressjs.com/de/) and [NodeJS](https://nodejs.org/en) as a runtime environment (possibly [Bun](https://bun.sh) in the future). The service manages access to the user's documented securities positions and retrieves current metal prices using the [Metalprice API](https://metalpriceapi.com/), which offers a generous free tier that is sufficient for caching the most important metal prices in the application using a Redis instance. The securities data is real-time and updated every 60 seconds through the service. As the data source is not aware that we are accessing and tapping into their interface, it is not made public.

## ToC

- [Stock-Service](#stock-service)
  - [ToC](#toc)
  - [Features](#features)
  - [Installation](#installation)
    - [Development / Manual](#development--manual)
    - [Docker](#docker)

## Features

<details>
<summary>
<strong>Manage your "BudgetBuddy stock positions*"</strong>
</summary>
<small>*In the form of a watchlist that allows you to track current price information for selected securities</small>
</details>

<details>
<summary>
<strong>Get the latest stock prices</strong>
</summary>
Retrieve the latest security prices
</details>

<details>
<summary>
<strong>Subscribe to a specific security for real-time stock price updates</strong>
</summary>
Stay updated with real-time price changes by subscribing to a websocket endpoint for a specific security.

**Subscribe to Security Price Updates**

> By emitting the `stock:subscribe` event to the socket, you will add securities (provided in the payload) to your personal live update subscriptions.

**Unsubscribe from Security Price Updates**

> By emitting the `stock:unsubscribe` event to the socket, you will unsubscribe from all live price updates.

**Receive Security Price Updates**

> By listening to the `stock:update:<CLIENT_ID>` event, you will receive updates for the securities you have subscribed to.

</details>

<details>
<summary>
<strong>Retrieve historical and future dividend information</strong>
</summary>
</details>

<details>
<summary>
<strong>Retrieve quotes for Gold, Platinum and Silver</strong>
</summary>
</details>

## Installation

### Development / Manual

1.  Clone the repository

    ```bash
    git clone git@github.com:budgetbuddyde/stock-service.git
    ```

2.  Install requried dependencies

    ```bash
    npm install
    ```

3.  Setup environment-variables as defined in the `.env.example`
4.  Start your application

    ```bash
    npm run dev
    # or run the finished build
    npm run start
    ```

### Docker

> [!NOTE]
> You may need to sign into the Github Image Registry by using `echo <GH_PAT> | docker login ghcr.io -u <GH_USERNAME> --password-stdin`

1.  Pull the image

    ```bash
    docker pull ghcr.io/budgetbuddyde/stock-service/latest
    ```

2.  Start an container
    ```bash
    # will expose the server on port 80 on your local machine
    docker run -p 80:7080 --env-file .env ghcr.io/budgetbuddyde/stock-service
    ```
