# Stock-Service

## ToC

- [Stock-Service](#stock-service)
  - [ToC](#toc)
  - [Installation](#installation)
    - [Development / Manual](#development--manual)
    - [Docker](#docker)

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
    docker pull ghcr.io/budgetbuddyde/latest
    ```

2.  Start an container
    ```bash
    # will expose the server on port 80 on your local machine
    docker run -p 80:7080 --env-file .env ghcr.io/budgetbuddyde/stock-service
    ```
