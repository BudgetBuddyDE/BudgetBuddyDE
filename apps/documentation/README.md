# Documentation

## Overview

This documentation is based on [VitePress](https://vitepress.dev/) and provides all the latest technical information about [Budget-Buddy](https://budget-buddy.de) and its associated services.

## Getting started

1. Clone this repository

   ```bash
   git clone git@github.com:BudgetBuddyDE/Documentation.git
   ```

2. Start an local dev instance

   ```bash
   npm run docs:dev
   ```

3. Start editing the docs...

## Deploy

```bash
# Build the docker image
docker build -t budget-buddy-docs .

# Start an container
docker run -d -p 80:80 budget-buddy-docs
```

## Contribution
