---
title: User Preferences
description: Per-user application preferences and upgrade requirements.
icon: SlidersHorizontal
---

> **Upgrade notice: Apply the regular database migrations before starting the updated backend.** For installations with existing users, we also recommend the [one-time SQL backfill](#existing-installations-recommended-one-time-sql-backfill) before restarting. Without the backfill, the backend creates missing preferences on the first request with onboarding already completed and logs a warning; it does not force existing users into onboarding. Back up the database before upgrading. New installations with no existing users do not need the backfill.

## Overview

Application preferences are stored per user in `budgetbuddy_backend.preference`. The table currently contains:

| Field                 | Default         | Purpose                                    |
| --------------------- | --------------- | ------------------------------------------ |
| `onboardingCompleted` | `false`         | Whether the user has completed onboarding. |
| `language`            | `en_US`         | Preferred language and region locale.      |
| `timeZone`            | `Europe/Berlin` | Preferred IANA time zone.                  |
| `currency`            | `EUR`           | Preferred ISO 4217 currency code.          |

Each user has at most one preference record. The user's ID is the record's primary key and references `budgetbuddy_auth.user`; deleting a user cascades to their preferences.

## Registration and missing records

When Better Auth creates a new user, the backend creates their preference record with `onboardingCompleted: false`. The remaining values come from the database defaults. Initialization is idempotent: retrying it does not replace existing preferences.

The registration hook awaits initialization, but logs failures without failing registration: the user may already have been committed to the database. User creation and preference initialization are not a single atomic transaction.

The authenticated `GET /api/preference` endpoint returns the current user's preferences. If no record exists, the backend logs a warning, creates one with defaults, and returns the persisted record. Missing records are treated as existing accounts to avoid unexpectedly prompting users to onboard, so the repair path sets `onboardingCompleted` to `true`. Database failures are returned as request failures rather than fabricated preference data.

This is a deliberate tradeoff: a missing record cannot distinguish an existing account from a new account whose registration hook failed. If initialization fails for a new user, a later successful preference request also repairs the record with `onboardingCompleted: true`, potentially skipping onboarding. Existing preferences are never overwritten by initialization or repair.

Authenticated `PUT /api/preference` requests partially update the current user's settings. At least one supported field must be supplied. `language` uses an underscore-separated locale such as `en_US` or `de_DE`; `timeZone` must be a valid IANA time zone, and `currency` must be a valid ISO 4217 code. User IDs and server-managed timestamps cannot be updated through the payload.

The API client is available as `apiClient.backend.preference`; use its `get()` and `update(payload)` methods to preserve the shared API response and error handling conventions.

## Existing installations: recommended one-time SQL backfill

**For instances with users created before user preferences were introduced, we recommend running the SQL below.** It pre-populates missing preferences and avoids repair warnings on those users' first requests. The backfill is optional: the backend repairs missing records with the same completed-onboarding status. The regular Drizzle schema migrations are required regardless of whether you run the backfill.

Back up the database first and stop all backend instances during the cutover so registrations or preference requests cannot race with the backfill. Apply the regular migrations before running the backfill, and start the updated backend only after these upgrade steps are complete:

```bash
pnpm --filter @budgetbuddyde/db run db:migrate
```

Run this SQL against the same database used by the backend:

```sql
INSERT INTO budgetbuddy_backend.preference (
  owner_id,
  onboarding_completed
)
SELECT id, true
FROM budgetbuddy_auth."user"
ON CONFLICT (owner_id) DO NOTHING;
```

This creates preferences for existing users that do not already have a record. Existing preference values are preserved. The language, time zone, and currency fields use their database defaults (`en_US`, `Europe/Berlin`, and `EUR`).

After the backfill completes, start the updated backend. New registrations are initialized with `onboardingCompleted: false`; the missing-record repair path conservatively uses `true` for accounts without a preference record, while the SQL above explicitly marks pre-existing accounts as completed. A brand-new instance with no pre-existing users does not need the backfill.

Within the stopped-backend upgrade window, the SQL is safe to re-run because of `ON CONFLICT DO NOTHING`. It only inserts preference records; it does not modify or delete user or financial data. Do not use it as a blanket repair after registrations resume: it would also mark newly registered users with missing preferences as having completed onboarding.
