---
title: Website
icon: lucide/globe
---

## Overview

![version](https://img.shields.io/github/v/tag/budgetbuddyde/budgetbuddyde?filter=website*&cacheSeconds=3600)

A simple, static marketing/landing page for [BudgetBuddy](https://budget-buddy.de), served via NGINX in a Docker container.

## Stack

- Plain HTML + CSS (no framework, no build step)
- [NGINX 1.27 Alpine](https://hub.docker.com/_/nginx) as the web server

## Development

Open `public/index.html` directly in a browser, or spin up the container:

```bash
docker build -t ghcr.io/budgetbuddyde/website .
docker run -p 8080:80 ghcr.io/budgetbuddyde/website
```

Then visit <http://localhost:8080>.

## Structure

```
website-static/
├── public/
│   ├── index.html   # Single-page website
│   ├── styles.css   # All styles
│   └── logo.png     # App logo
├── nginx.conf       # NGINX server config
├── Dockerfile
└── README.md
```

## Deployment

Build and push the Docker image, then run it on any container host:

```bash
docker build -t ghcr.io/budgetbuddyde/website:latest .
docker push ghcr.io/budgetbuddyde/website:latest
```

The container listens on port **80**. Map it to whatever host port you need.

## Deployment

The service is automatically deployed via a Railway CI/CD pipeline on every push to the `main` branch.

### Railway

BudgetBuddyDE is designed to be easily deployable on [Railway](https://railway.app/).

[![Railway Logo](https://railway.com/button.svg)](https://railway.com/deploy/WjE5vD?referralCode=SD-6Xm&utm_medium=integration&utm_source=template&utm_campaign=generic)