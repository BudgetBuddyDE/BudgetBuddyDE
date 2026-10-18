---
title: User Preferences
description: Per-user preferences, localization, currency formatting, and upgrade requirements.
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

## Supported presentation settings

The API stores preferences independently of what the webapp currently supports:

| Setting   | Supported in the webapp             | Effective default |
| --------- | ----------------------------------- | ----------------- |
| Language  | English (`en_US`), German (`de_DE`) | `en_US`           |
| Currency  | `EUR`, `USD`                        | `EUR`             |
| Time zone | `Europe/Berlin`                     | `Europe/Berlin`   |

Stored language identifiers use underscores: map `en_US` to the BCP 47 locale `en-US` and `de_DE` to `de-DE` for `Intl` APIs. Do not pass the underscore-separated database value directly to `Intl.NumberFormat`. Selecting German immediately updates client translations and number formatting; server-rendered translations resolve the same authenticated preference.

Unsupported stored values remain intact. The webapp derives effective preferences for rendering instead of rewriting the raw preference record. An unsupported language, currency, or time zone falls back to the corresponding default above. Saving another setting must not silently replace unsupported values with those effective defaults.

Currency is a **display preference only**. Switching between EUR and USD changes formatting, not transaction amounts, budget limits, stored data, or exchange rates. BudgetBuddy does not convert money or provide multi-currency accounting.

## Reading preferences in the webapp

Use `usePreferences()` in client components under the preferences provider. It exposes preference state and the shared reload/update flow; avoid fetching a separate copy in each component. Use the effective values for presentation and retain the raw values when editing or persisting settings.

In server components, use `getPreferences()` from `@/lib/preferences/getPreferences`. It forwards the authenticated request headers and reads the existing preference API with `cache: 'no-store'`. React's `cache()` deduplicates calls within the server render request; it is not a persistent or cross-user preference cache. Handle the existing `[result, error]` tuple rather than treating the return value as a preference record.

Do not replace this flow with a shared server-side cache: preferences are user-specific and must reflect saved changes.

## Translation contract

The webapp uses `next-intl` with English and German catalogs. Routes do not receive a locale prefix: translations do not introduce paths such as `/en/dashboard`.

Client components call `useAppTranslations()` to obtain a typed translation function, then pass a semantic dot-separated catalog key and optional interpolation values:

```tsx
const t = useAppTranslations();

return <span>{t('account.profile.yourNameHasBeenUpdatedToValue1', {value1: user.name})}</span>;
```

Server components use the corresponding asynchronous helper:

```tsx
const t = await getAppTranslations();

return <span>{t('account.profile.yourNameHasBeenUpdatedToValue1', {value1: user.name})}</span>;
```

The returned `t(key, values?)` function accepts a typed semantic catalog path, not an English source sentence. Add or update messages in the matching domain fragment under `apps/webapp/src/i18n/messages/en-US/` and `apps/webapp/src/i18n/messages/de-DE/`. Keep the key and ICU placeholder names aligned across both locales. Keep user-authored content, API identifiers, and persisted values out of translation catalogs.

Additional languages require translated catalogs and registration in the supported-language configuration before users can select them. A stored language value alone does not enable a language. Keep catalog organization and source-key registration aligned with the translation helpers rather than introducing a parallel lookup mechanism.

Server request configuration resolves the authenticated language and supplies its matching catalog. Server and client translations, the HTML language, and MUI locale mappings follow the effective language, with English as the default.

After adding or changing a translation, edit the matching English and German domain fragments directly, then run the check-only validator:

```bash
npm run i18n:check --workspace @budgetbuddyde/webapp
```

The validator does not generate or rewrite catalog content. It checks both locale fragment trees for matching key coverage, nonempty messages, ICU syntax, and interpolation placeholders, and checks typed translator calls in production sources. The normal webapp `check` also verifies the catalogs. Prefer literal ICU messages or finite literal unions; interpolated values belong in the second argument, not in dynamically constructed message keys.

## Currency formatting

Client components should use `useCurrencyFormatter()` so rendered amounts follow the effective currency and locale:

```tsx
const {formatBalance, shortenBalance} = useCurrencyFormatter();

return <span title={formatBalance(balance)}>{shortenBalance(balance)}</span>;
```

Server components and pure utilities must use the pure formatter with explicit effective values rather than calling a React hook or relying on implicit defaults:

```ts
import {createCurrencyFormatter} from '@/utils/Formatter/CurrencyFormatter';

// locale is the BCP 47 locale mapped from the effective language.
const formatter = createCurrencyFormatter(locale, effectivePreferences.currency);
const label = formatter.formatBalance(balance);
```

The formatter only produces display strings. Keep calculations and API payloads numeric; never parse formatted currency strings back into stored amounts.

## Existing installations: recommended one-time SQL backfill

**For instances with users created before user preferences were introduced, we recommend running the SQL below.** It pre-populates missing preferences and avoids repair warnings on those users' first requests. The backfill is optional: the backend repairs missing records with the same completed-onboarding status. The regular Drizzle schema migrations are required regardless of whether you run the backfill.

Back up the database first and stop all backend instances during the cutover so registrations or preference requests cannot race with the backfill. Apply the regular migrations before running the backfill, and start the updated backend only after these upgrade steps are complete:

```bash
npm run db:migrate --workspace @budgetbuddyde/db
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
