---
title: Services and interfaces
description: Service boundaries, APIs, authentication, and integration contracts.
icon: lucide/plug
status: active
tags: [developer, services, api]
---

# Services and interfaces

The service layer contains deployable backend boundaries. Authentication and application APIs must be documented by their observable contracts rather than by private implementation details.

## Current service documentation

- [Authentication service](../services/auth-service.md)
- [Backend service](../services/backend.md)
- [API keys](../services/api-keys.md)
- [Model Context Protocol](../services/mcp.md)

## Contract requirements

Every public or service-to-service interface should document:

- Authentication and authorization requirements
- Request and response shapes
- Validation rules and error codes
- Versioning and compatibility expectations
- Required configuration and local setup
- A representative success and failure example

User-facing deployment steps belong in [Self-hosting](../user/self-hosting.md). Package-level API types are documented in the [package reference](../packages/api.md).
