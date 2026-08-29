---
title: Security
description: Security requirements for development and operations.
icon: lucide/lock-keyhole
---

BudgetBuddy processes highly sensitive financial data. Security is therefore a domain requirement, not an optional operational feature.

## Requirements

- Run all production connections over TLS.
- Provide secrets only through secure secret stores or environment variables.
- Never commit `AUTH_SECRET`, OAuth secrets, database passwords, or S3 keys.
- Restrict CORS to known origins.
- Enable rate limiting in production.
- Restrict every entity query and mutation to the owner.
- Limit upload size, file type, and access to attachments.
- Treat generated data exports as sensitive downloads: scope them to the authenticated owner, disable caching, and never include credentials or tokens.
- Review logs for personal and financial content.
- Regularly update dependencies and security advisories.

Do not report security vulnerabilities publicly in issues; use the security contact specified in the repository.
