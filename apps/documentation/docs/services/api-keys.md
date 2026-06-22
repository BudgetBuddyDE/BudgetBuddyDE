---
title: API Keys
icon: lucide/key-round
tags:
    - service
    - auth
    - api
---

## Overview

BudgetBuddyDE supports user-managed API keys for programmatic access to the application. API keys are implemented with the [Better Auth API Key plugin](https://better-auth.com/docs/plugins/api-key), which provides API key creation, listing, deletion, verification, expiration, rate limiting, and optional session creation from API keys.

In BudgetBuddyDE, an API key acts on behalf of the user who created it. It must therefore be treated like a password: store it in a secret manager, never commit it to source control, and delete it immediately if it may have been exposed.

## Implementation

API keys are configured in the Auth Service via `@better-auth/api-key`.

The current Auth Service configuration enables:

- a `bb-` key prefix
- required key names
- API-key-backed sessions via `enableSessionForAPIKeys`
- rate limiting based on the Auth Service rate-limit configuration
- Better Auth's database-backed API key storage

The Webapp registers the Better Auth API key client plugin and exposes a settings page where users can create, list, and delete keys. The full secret value is only shown once directly after creation. Later list responses only expose key metadata such as name, status, creation date, expiration date, usage counters, rate limit metadata, and the stored starting characters.

## Service Interaction

### Auth Service

The Auth Service is the source of truth for API keys. It owns the Better Auth configuration, stores API key records, hashes key values, validates incoming keys, and creates a Better Auth session context when a valid key is provided.

By default, the Better Auth API key plugin reads keys from the `x-api-key` header. Because BudgetBuddyDE enables `enableSessionForAPIKeys`, a valid API key can produce a session for the owning user.

### Backend

The Backend forwards incoming request headers to `authClient.getSession()` in `setRequestContext`. This means requests authenticated through a valid API key receive the same user-scoped request context as normal session-cookie requests.

All protected backend routes continue to operate through the existing `req.context.user` and `req.context.session` flow. The backend does not need to know whether the session originated from a browser cookie or an API key.

### Webapp

The Webapp uses `authClient.apiKey` from the Better Auth client plugin. It provides the user-facing management UI under settings:

- list keys with pagination
- create a named key with an optional expiration date
- show the full key exactly once after creation
- delete keys after confirmation

The Webapp never attempts to retrieve the full secret value again, because Better Auth list/get responses intentionally omit the key value.

## Example: Custom User Integration

A user can build a small automation that reads data from the Backend with their API key. The API key is passed to the backend in the `x-api-key` header.

```bash
curl "https://backend.service/api/transaction?from=0&to=25" \
  -H "x-api-key: $BUDGETBUDDY_API_KEY" \
  -H "Accept: application/json"
```

A TypeScript example:

```ts
const apiKey = process.env.BUDGETBUDDY_API_KEY;

if (!apiKey) {
  throw new Error('BUDGETBUDDY_API_KEY is required');
}

const response = await fetch('https://backend.service/api/category?from=0&to=25', {
  headers: {
    'x-api-key': apiKey,
    Accept: 'application/json',
  },
});

if (!response.ok) {
  throw new Error(`BudgetBuddyDE request failed: ${response.status}`);
}

const categories = await response.json();
console.log(categories);
```

## Use Cases

API keys are useful for trusted, user-owned integrations that need to access BudgetBuddyDE without an interactive browser session.

Typical examples:

- personal scripts for exporting transactions or categories
- scheduled imports from another finance tool
- small dashboards or reporting jobs
- local automations that create or reconcile transactions
- future integrations such as MCP tools or AI assistants acting on explicit user-owned credentials

API keys should not be embedded in frontend code, mobile apps without secure storage, browser snippets, or public repositories.

## Better Auth Resources

Useful Better Auth documentation:

- [API Key plugin](https://better-auth.com/docs/plugins/api-key)
- [Create an API key](https://better-auth.com/docs/plugins/api-key#create-an-api-key)
- [Verify an API key](https://better-auth.com/docs/plugins/api-key#verify-an-api-key)
- [List API keys](https://better-auth.com/docs/plugins/api-key#list-api-keys)
- [Delete an API key](https://better-auth.com/docs/plugins/api-key#delete-an-api-key)
- [API Key plugin reference](https://better-auth.com/docs/plugins/api-key#next-steps)

## Future Outlook

### Permission-driven API keys

API keys currently act as the full user. The next security step should be permission-driven API keys: each key should receive an explicit scope, and backend endpoints should check that scope before executing the request.

Examples:

- `transactions:read`
- `transactions:create`
- `categories:read`
- `budgets:read`
- `attachments:read`

Better Auth already supports permissions on API keys and permission checks during verification. BudgetBuddyDE can build on this by adding permission selection to the Webapp, storing permissions on creation, and enforcing them in backend middleware or route-level guards.

This would make API keys safer because a key used for reporting would not automatically be able to create, modify, or delete user data.
