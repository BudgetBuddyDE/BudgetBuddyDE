---
title: Filter
icon: lucide/filter
tags: [development, components]
---

## Overview

The Filter system provides a consistent, reusable way to add filter dialogs to any table in the application.
It is built around two layers:

| Layer          | Component                        | Use case                                                  |
|----------------|----------------------------------|-----------------------------------------------------------|
| **High-level** | `FilterWrapper`                  | Drop-in filter button + dialog with full state management |
| **Low-level**  | `FilterDialog` + `FilterReducer` | Manual control over open state and filter state           |

All filter state is local to the component. Applying filters calls the `onApply` callback, which the parent (usually a Redux slice) uses to update the URL / store.

---

## `<FilterWrapper />`

The recommended way to add filters to a table. Renders a `FilterButton` and manages the dialog open state, options loading, and state initialisation from `currentFilters` internally.

```tsx
import {FilterWrapper} from '@/components/Filter';

<FilterWrapper
  availableSections={['dateRange', 'categories', 'paymentMethods']}
  currentFilters={filters}
  onApply={handleFilterApply}
/>
```

### Props

| Prop                | Type                                        | Description                                                                           |
|---------------------|---------------------------------------------|---------------------------------------------------------------------------------------|
| `availableSections` | `FilterSection[]`                           | Which filter sections to display                                                      |
| `currentFilters`    | `Partial<EntityFilters>`                    | Currently active filters (from Redux / URL) — used to pre-populate the dialog on open |
| `onApply`           | `(filters: Partial<EntityFilters>) => void` | Called when the user clicks *Apply* or *Reset*                                        |

### Behaviour

- On open, simple fields (`dateFrom`, `dateTo`, `executeFrom`, `executeTo`) are seeded from `currentFilters`.
- Category and payment method options are fetched from the API on first open; matched objects are pre-selected based on the IDs in `currentFilters`.
- The dialog is remounted on every open (via a `key` bump) so uncontrolled inputs like `DateRangePicker` always re-read the current values.

---

## `<FilterDialog />`

Presentational dialog component. Renders the filter sections based on the `with*` props.
Use this when you need manual control over open state (e.g. inside `FilterWrapper`).

```tsx
import {FilterDialog, type FilterDialogProps} from '@/components/Filter';

<FilterDialog
  open={open}
  onClose={() => setOpen(false)}
  onReset={handleReset}
  onApply={handleApply}
  withDateRange
  withCategories
  withPaymentMethods
  state={state}
  dispatch={dispatch}
  categoryOptions={categoryOptions}
  paymentMethodOptions={paymentMethodOptions}
/>
```

### Props

| Prop                   | Type                           | Description                                       |
|------------------------|--------------------------------|---------------------------------------------------|
| `open`                 | `boolean`                      | Controls dialog visibility                        |
| `onClose`              | `() => void`                   | Called when the dialog is closed without applying |
| `onReset`              | `() => void`                   | Called when the *Reset* button is clicked         |
| `onApply`              | `() => void`                   | Called when the *Apply* button is clicked         |
| `withDateRange`        | `boolean?`                     | Show the date range section                       |
| `withExecuteDay`       | `boolean?`                     | Show the execute day (1–31) section               |
| `withCategories`       | `boolean?`                     | Show the categories section                       |
| `withPaymentMethods`   | `boolean?`                     | Show the payment methods section                  |
| `state`                | `FilterState`                  | Current local filter state                        |
| `dispatch`             | `React.Dispatch<FilterAction>` | Dispatcher from `useReducer(FilterReducer, ...)`  |
| `categoryOptions`      | `TCategoryVH[]`                | Available category options                        |
| `paymentMethodOptions` | `TPaymentMethodVH[]`           | Available payment method options                  |

---

## `<FilterButton />`

Standalone icon button that indicates whether any filters are currently active.

```tsx
import {FilterButton} from '@/components/Filter';

<FilterButton isActive={hasActiveFilters} onClick={() => setOpen(true)} />
```

### Props

| Prop       | Type                 | Description                                                |
|------------|----------------------|------------------------------------------------------------|
| `isActive` | `boolean?`           | When `true`, the icon is highlighted in the primary colour |
| `onClick`  | `MouseEventHandler?` | Click handler                                              |

---

## `FilterReducer` & `FilterState`

Local state management used internally by `FilterWrapper` and available for custom implementations.

```tsx
import {FilterReducer, getInitialFilterState} from '@/components/Filter';

const [state, dispatch] = React.useReducer(FilterReducer, getInitialFilterState());
```

### `FilterState`

```ts
type FilterState = {
  hasActiveFilters: boolean;
  keywords: string | null;
  dateRange: { startDate: Date | null; endDate: Date | null };
  executeFrom: string;
  executeTo: string;
  categories: TCategoryVH[];
  paymentMethods: TPaymentMethodVH[];
};
```

### `FilterAction`

| Action                | Payload                              | Description                       |
|-----------------------|--------------------------------------|-----------------------------------|
| `SET_KEYWORDS`        | `keywords: string`                   | Update keyword search             |
| `SET_DATE_RANGE`      | `startDate`, `endDate`               | Set both date range bounds        |
| `SET_START_DATE`      | `startDate`                          | Set start date only               |
| `SET_END_DATE`        | `endDate`                            | Set end date only                 |
| `SET_EXECUTE_FROM`    | `executeFrom: string`                | Set execute-day lower bound       |
| `SET_EXECUTE_TO`      | `executeTo: string`                  | Set execute-day upper bound       |
| `SET_CATEGORIES`      | `categories: TCategoryVH[]`          | Replace selected categories       |
| `SET_PAYMENT_METHODS` | `paymentMethods: TPaymentMethodVH[]` | Replace selected payment methods  |
| `RESET_ALL`           | —                                    | Reset all fields to initial state |

`hasActiveFilters` is recalculated automatically after every action.

---

## `FilterSection`

The union type that controls which sections appear in the dialog.

```ts
type FilterSection = 'dateRange' | 'executeDay' | 'categories' | 'paymentMethods';
```

| Value            | UI Section                | Relevant `EntityFilters` fields |
|------------------|---------------------------|---------------------------------|
| `dateRange`      | Date range picker         | `dateFrom`, `dateTo`            |
| `executeDay`     | Two number inputs (1–31)  | `executeFrom`, `executeTo`      |
| `categories`     | Multi-select autocomplete | `categories` (array of IDs)     |
| `paymentMethods` | Multi-select autocomplete | `paymentMethods` (array of IDs) |

---

## Integration with `EntityTable`

Pass `FilterWrapper` as `toolbar.children` — it renders inside the toolbar alongside the search input and action buttons.

```tsx
<EntityTable
  slice={slice}
  columns={columns}
  toolbar={{
    title: 'Transactions',
    showSearch: true,
    onSearch: handleSearch,
    actions: [...],
    children: (
      <FilterWrapper
        availableSections={['dateRange', 'categories', 'paymentMethods']}
        currentFilters={filters}
        onApply={handleFilterApply}
      />
    ),
  }}
/>
```
