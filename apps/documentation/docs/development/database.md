---
title: Database
icon: lucide/database
tags: [development, database]
---

## Overview

For persistence, a PostgreSQL database is used along with a Redis instance for caching and persistence of short-lived records (e.g. session management, rate limiting, etc.).
The database is accessed via [Drizzle](https://orm.drizzle.team/) as an ORM to simplify interaction with the database and ensure type safety. The database schema (defined with DrizzleORM) is provided through the NPM package [`@budgetbuddyde/db`](../packages/db.md#about){data-preview}. This NPM package is [automatically deployed](../packages/db.md#deployment){data-preview} as soon as a change is pushed. If there are changes to the database schema (migrations added under `/drizzle`), these can be applied using a CI pipeline.

!!! important "Database Migrations"
    The step to apply migrations is currently not automated in order to prevent unintended changes to the database.

## Model

> Will be added soon