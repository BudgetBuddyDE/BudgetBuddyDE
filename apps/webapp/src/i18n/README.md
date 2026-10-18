# Webapp localization

Auth routes select a supported browser language from the request's `Accept-Language`
header, respecting quality weights and regional variants (`de-AT` uses `de-DE`,
`en-GB` uses `en-US`). Unsupported or missing preferences fall back to English.
Dashboard routes use saved account preferences instead. Browser detection never
updates account preferences. Other public pages retain the English default.
The proxy overwrites internal route markers; auth localization does not require
session or preference API requests. The root passes browser locale separately so
client navigation from a dashboard cannot carry its account language into auth UI.

Application translations use semantic, typed dot-separated catalog keys such
as `common.save` and `transactions.deleteConfirmation`. The English fragments
in `messages/en-US/<domain>.json` define the key union and are assembled into
the English fallback. `useAppTranslations()` is used in client components;
server components await `getAppTranslations()` from `@/i18n/server`. Both return
a typed `t(key, values?)` translator. Pass a semantic catalog path, never the
English source sentence or a generated encoding.

```tsx
const t = useAppTranslations();
t('common.save');
t('transactions.deleteConfirmation', {count: selected.length});
```

Message values use ICU syntax. Keep the interpolation argument names aligned
between English and German. Do not translate user-entered content, API errors,
or compose complete sentences from translated word fragments.

English and German catalogs are split into domain fragments under
`messages/en-US/<domain>.json` and `messages/de-DE/<domain>.json`. Find or add a
message in the matching domain fragment for each locale, and keep the semantic
key and ICU placeholders aligned. The checker
recursively validates catalog leaf parity, nonempty values, ICU syntax and
placeholder names, and translator calls in production TypeScript sources. It
is check-only: it never generates or rewrites catalog content.

Run `npm run i18n:check --workspace @budgetbuddyde/webapp` after changing a
translation call or catalog fragment. This workflow is check-only; update the
English and German fragment files directly rather than invoking a generator.
