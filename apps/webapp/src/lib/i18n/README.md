# Webapp localization

Only `en-US` is enabled. URLs are unchanged. Public pages receive the root English
provider; authenticated pages additionally resolve their effective language from
preferences. Unsupported preferences fall back to English. Server request config
uses the same locale, messages and UTC time zone as the client.

Client components use `useAppTranslations` from `@/hooks/useAppTranslations`.
Server components await `getAppTranslations` from `@/lib/i18n/server`.
Both return `(source: string, values?: Record<string, string | number>) => string`.

```tsx
const t = useAppTranslations();
t('Save');
t('Delete {count} transactions?', {count: selected.length});
t('{count, plural, one {# transaction} other {# transactions}}', {count});
```

Use literal English ICU messages, not interpolated template strings. Apostrophes
follow ICU quoting rules. Translate labels, not user-entered content or API errors.
Do not use HTML/rich-text tags in this string-only helper.

Source text is mapped to collision-free, deterministic keys compatible with
next-intl. The fallback formats uncatalogued English messages with next-intl too,
allowing parallel migrations without shared catalog edits.

After migration, run from the repository root:

```sh
node apps/webapp/src/lib/i18n/generate-catalog.mjs
npx prettier --write --ignore-path /dev/null apps/webapp/src/lib/i18n/messages/en-US.json
node apps/webapp/src/lib/i18n/generate-catalog.mjs --check
```

The generator collects literal calls to `t` and variables initialized with the
translation helpers. It also extracts finite string-literal unions using the
TypeScript checker. `--check` fails on missing, stale, incorrectly encoded, or
unverifiable dynamic messages. Use literal calls or `as const` label collections
instead of arbitrary string keys. Do not construct translated sentences from
separately translated words. Keys are reversible with `getMessageSource`.
Standalone components (including root error UI) receive an English next-intl
translator through the app context default; no test-wide translation mock is needed.
Future languages need a translated catalog, supported-locale registration, and
request-time authenticated locale resolution before they can be enabled.
