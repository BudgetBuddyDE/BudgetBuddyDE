---
title: Intent-Based Navigation
icon: lucide/route
status: new
tags: [development, components, navigation]
---

## Overview

Intent-Based Navigation (IBN) lets a caller describe **what should happen** instead of coupling the caller to the target page's UI. The webapp serializes that intent into URL query parameters. The destination page consumes the parameters, opens or executes the matching action, and removes the intent from the URL.

IBN was introduced in commit `2716eb5888fa8a28edde8addd5bf96b2c25d2673`.

The implementation lives in `apps/webapp/src/lib/ibn` and exposes the following building blocks:

- `Intent`: type-safe description of an entity action.
- `buildIntentHref`: creates a shareable URL for an intent.
- `IntentButton`: link-style UI for an intent.
- `useIntentNavigation`: imperative navigation and URL generation.
- `useConsumeIntent`: destination-side intent handling.
- `RegisterIntentCommands`: command-palette integration.

## Intent model

An intent contains an `entity`, an `action`, and, for existing records, an `id`.

| Entity             | Route                | Supported actions          |
| ------------------ | -------------------- | -------------------------- |
| `transaction`      | `/transactions`      | `create`, `edit`, `delete` |
| `recurringPayment` | `/recurringPayments` | `create`, `edit`, `delete` |
| `paymentMethod`    | `/paymentMethods`    | `create`, `edit`, `delete` |
| `category`         | `/categories`        | `create`, `edit`, `delete` |
| `budget`           | `/dashboard/budget`  | `create`, `edit`, `delete` |
| `attachment`       | `/attachments`       | `create`, `delete`         |
| `apiKey`           | `/settings/api-keys` | `create`, `delete`         |

Attachment creation is the special case: the target page is `/transactions`, because the attachment dialog belongs to a transaction. It therefore requires the transaction as a parent.

```ts
import type {Intent} from '@/lib/ibn';

const createTransaction: Intent = {
  entity: 'transaction',
  action: 'create',
};

const editTransaction: Intent = {
  entity: 'transaction',
  action: 'edit',
  id: transaction.id,
};

const createAttachment: Intent = {
  entity: 'attachment',
  action: 'create',
  parentEntity: 'transaction',
  parentId: transaction.id,
};
```

TypeScript rejects unsupported combinations, such as creating an attachment without a parent or editing an API key.

## URL format

`buildIntentHref` serializes the intent using these query parameters:

| Parameter         | Meaning                                                    |
| ----------------- | ---------------------------------------------------------- |
| `ibnEntity`       | Entity to address                                          |
| `ibnAction`       | `create`, `edit`, or `delete`                              |
| `ibnId`           | ID of an existing entity; required for `edit` and `delete` |
| `ibnParentEntity` | Parent entity for nested actions                           |
| `ibnParentId`     | Parent ID for nested actions                               |

Examples:

```text
/transactions?ibnEntity=transaction&ibnAction=create
/transactions?ibnEntity=transaction&ibnAction=edit&ibnId=transaction-id
/settings/api-keys?ibnEntity=apiKey&ibnAction=delete&ibnId=key-id
/transactions?ibnEntity=attachment&ibnAction=create&ibnParentEntity=transaction&ibnParentId=transaction-id
```

The query parameters can be combined with ordinary page parameters. When an intent is consumed, only the IBN parameters are removed; unrelated parameters are preserved.

## Navigation methods

### 1. Declarative links with `IntentButton`

Use `IntentButton` when the user should follow a normal link. It renders an MUI `Button` backed by `next/link`, so it works with keyboard navigation, browser history, opening in a new tab, and link previews.

```tsx
import {IntentButton} from '@/components/IBN';

<IntentButton variant="contained" intent={{entity: 'transaction', action: 'create'}}>
  Create transaction
</IntentButton>;
```

For an existing record, include its ID:

```tsx
<IntentButton intent={{entity: 'transaction', action: 'edit', id: transaction.id}}>Edit transaction</IntentButton>
```

Use this option for buttons, menus, cards, and other UI where navigation is the result of a user click and no additional work is needed before routing.

### 2. Imperative navigation with `useIntentNavigation`

Use the hook when navigation is triggered by code, for example after selecting an item in a command palette or another interaction that is not represented by a link.

```tsx
'use client';

import {useIntentNavigation} from '@/lib/ibn';

function CreateActions() {
  const {navigateIntent, hrefForIntent} = useIntentNavigation();

  const openCreateDialog = () => {
    navigateIntent({entity: 'budget', action: 'create'});
  };

  const previewHref = hrefForIntent({
    entity: 'transaction',
    action: 'edit',
    id: transaction.id,
  });

  return <button onClick={openCreateDialog}>Create budget</button>;
}
```

`navigateIntent` calls `router.push`, while `hrefForIntent` only returns the generated URL. Prefer `hrefForIntent` when a component needs to render or pass the URL without navigating immediately.

### 3. Command-palette navigation

The command palette is the application-wide discovery mechanism for IBN. `RegisterIntentCommands` is mounted in the dashboard layout and registers commands for:

- creating transactions, recurring payments, payment methods, categories, budgets, and API keys;
- creating an attachment after searching for its transaction;
- editing supported entities after searching for a record;
- deleting supported entities after searching for a record.

The palette resolves edit/delete targets with `searchIntentTargets`, creates a typed `Intent`, and navigates through `useIntentNavigation`. New commands should follow this pattern instead of assembling query strings manually:

```tsx
onSelect: () =>
  navigateIntent({
    entity: 'transaction',
    action: 'edit',
    id: option.id,
  });
```

The resolver is asynchronous because target search loads matching records from the API. Search failures are shown through the snackbar and produce no navigation.

## Consuming an intent

Each destination feature calls `useConsumeIntent` with the entity it owns and handlers for the actions it can perform. The hook reads the current URL, validates it, and invokes the matching handler once.

```tsx
import {useConsumeIntent} from '@/lib/ibn';

function TransactionTable() {
  const openCreate = () => setCreateDrawerOpen(true);
  const openEdit = (id: string) => setEditTransactionId(id);
  const deleteTransaction = (id: string) => setDeleteTransactionId(id);

  useConsumeIntent('transaction', {
    onCreate: openCreate,
    onEdit: openEdit,
    onDelete: deleteTransaction,
    onInvalid: message => showSnackbar({message}),
  });

  // ...table UI
}
```

Available handlers:

| Handler              | Called for                                  | Argument                      |
| -------------------- | ------------------------------------------- | ----------------------------- |
| `onCreate`           | `action=create`                             | none                          |
| `onEdit`             | `action=edit`                               | entity ID                     |
| `onDelete`           | `action=delete`                             | entity ID                     |
| `onAttachmentCreate` | attachment creation targeting a transaction | `{entity: 'transaction', id}` |
| `onInvalid`          | malformed or failed intents                 | error message                 |

Attachment creation is consumed by the transaction feature even though its entity is `attachment`:

```tsx
useConsumeIntent('transaction', {
  onAttachmentCreate: ({id}) => openAttachmentDialog(id),
  onInvalid: message => showSnackbar({message}),
});
```

The hook also handles the lifecycle after consumption:

1. It parses and validates the IBN parameters.
2. It ignores intents belonging to another feature.
3. It invokes the matching handler.
4. It removes only the IBN parameters with `router.replace`.
5. It reports malformed intents or handler failures through `onInvalid` and cleans the URL.

The destination must provide the actual UI operation. IBN only transports the request; it does not create, edit, or delete records itself.

## Adding a new intent target

When adding a new entity or action, update the complete contract rather than adding a one-off URL:

1. Add the entity/action to `src/lib/ibn/types.ts` and extend the `Intent` union with the required fields.
2. Add its route, labels, and supported actions to `src/lib/ibn/targets.ts`.
3. Extend parsing and serialization cases in `src/lib/ibn/url.ts`.
4. Add a `useConsumeIntent` call to the owning feature and connect handlers to its existing create/edit/delete UI.
5. Add command-palette entries in `registerIntentCommands.tsx` when the action should be discoverable globally.
6. Use `IntentButton` or `useIntentNavigation` at callers; do not duplicate query-key strings.
7. Add tests for URL round-tripping, invalid combinations, and consumption behaviour.

The target configuration is the source of truth for route and action validation. `parseIntentFromSearchParams` rejects unknown entities, unknown actions, missing IDs, unsupported actions, and invalid attachment parents before a handler is called.

## Design rules and troubleshooting

- **Use typed intents, not hand-built URLs.** This keeps routes, actions, and required IDs consistent.
- **Keep handlers idempotent.** The hook guards against consuming the same intent more than once during a render lifecycle, and then strips it from the URL.
- **Do not consume another feature's intent.** Pass the owning `IntentEntity` to `useConsumeIntent`; attachment creation is the only intentional cross-feature exception.
- **Preserve unrelated query parameters.** Always use `stripIntentSearchParams` through the hook instead of replacing the complete query string.
- **Handle failures with `onInvalid`.** Invalid input and rejected handler promises are reported there, and the stale intent is removed.
- **Check authentication and permissions at the destination.** An IBN URL is a navigation request, not an authorization mechanism.

Relevant tests are next to the implementation in `src/lib/ibn` and `src/components/IBN`. Run the webapp test suite after changing the IBN contract:

```bash
npm run test --workspace apps/webapp
```
