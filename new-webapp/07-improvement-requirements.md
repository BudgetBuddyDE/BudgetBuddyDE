# Improvement Requirements

## Purpose

This document defines the requested improvements for the new BudgetBuddyDE webapp. It complements the product scope in [01-product-requirements.md](./01-product-requirements.md) and refines the affected features in [03-feature-catalog.md](./03-feature-catalog.md).

All requirements in this document are planned unless their implementation has been verified. The priorities follow the definitions in the feature catalog:

- P0: required to remove broken, misleading, or release-blocking behavior.
- P1: required for a complete first release after the P0 interaction foundations are stable.

The technical and quality rules in [02-development-guidelines.md](./02-development-guidelines.md) remain mandatory. This document describes product behavior, not a competing architecture.

## Shared Definition of Done

Every improvement in this document must:

- use real application data and existing authentication, API, ownership, and cache boundaries;
- provide loading, empty, error, and success feedback where the interaction can enter those states;
- work with keyboard navigation, visible focus, meaningful accessible labels, and responsive layouts;
- reuse the shared table, filter, dialog, menu, upload, feedback, and formatting components instead of introducing domain-specific copies;
- keep shareable filters, sorting, pagination, and page size in URL state where applicable;
- include the component, interaction, and data-boundary tests required by [02-development-guidelines.md](./02-development-guidelines.md);
- avoid exposing hidden, internal, or security-sensitive fields in the UI or exported files.

Statistics and exports must use the complete data set matching the active filters, not only the rows loaded on the current page.

## P0: Authentication and Account Access

### IMP-AUTH-01: Theme Control on Sign-In

The sign-in page must provide an accessible light/dark theme control before authentication.

Acceptance criteria:

- The control switches the complete authentication view between light and dark mode without a reload.
- The initial mode follows the existing saved preference or, when no preference exists, the system preference.
- The selected mode remains active after sign-in and navigation into the authenticated app.
- The control exposes its current state and purpose to assistive technology.

### IMP-AUTH-02: Password Visibility Controls

The password fields on both the sign-in and sign-up pages must provide a show/hide control.

Acceptance criteria:

- Passwords are masked by default.
- Activating the control changes only the visual input type; it does not clear or modify the password.
- The control has an accessible label that reflects the action, such as "Show password" or "Hide password".
- Toggling visibility preserves keyboard focus and form validation state.

### IMP-AUTH-03: Consistent Sign-Out Entry Points

Sign-out must be available from both the authenticated sidebar and the user menu opened from the avatar in the top-right app bar.

Acceptance criteria:

- Both entry points execute the same shared sign-out workflow.
- The workflow prevents duplicate submissions, reports failures, invalidates the active client session, and redirects to the sign-in page after success.
- Sign-out remains reachable in desktop and mobile navigation.
- No entry point appears functional while invoking a different or incomplete logout path.

## P0: App Shell, Localization, and Feedback

### IMP-SHELL-01: Avatar Shape and User Menu

The avatar in the top-right app bar must be a rounded rectangle rather than a circular image and must remain the trigger for the user menu.

Acceptance criteria:

- The avatar uses the shared shape and size tokens and has a visible focus state.
- Images, initials, and fallback content use the same rounded-rectangle boundary.
- The user menu includes the sign-out action from IMP-AUTH-03.

### IMP-SHELL-02: Remove the Notification Control

The sidebar and app shell must not show a notification button while the product has no notification feature.

Acceptance criteria:

- No inactive notification icon, button, badge, menu item, or placeholder is rendered.
- Removing the control does not leave an unexplained gap in desktop or mobile navigation.
- A notification control may return only with a separately specified, functional notification feature.

### IMP-I18N-01: Internationalized User-Facing Text

All user-facing text must be provided through the application's i18n layer.

This includes page copy, field labels, validation messages, table controls, filters, dialogs, menus, toasts, empty and error states, export labels, and accessibility labels. English remains the default language as defined in the product requirements; additional locale catalogs must be addable without changing feature components.

Acceptance criteria:

- Feature components do not embed user-facing prose outside the translation layer.
- Missing translation keys use the centrally defined development and production fallback behavior.
- Currency, number, date, and percentage formatting follows the active locale without changing stored values.
- Dynamic messages use parameterized translation entries rather than concatenated fragments.
- Switching the active locale updates visible UI text and formatting consistently.

### IMP-FEEDBACK-01: Toast Placement

Global toasts must use one shared viewport and must not appear in the center of the content area.

Acceptance criteria:

- On desktop widths, toasts are stacked at the bottom-right of the viewport.
- On narrow mobile widths, toasts are centered above the bottom safe area so they remain readable without overflowing.
- Multiple toasts stack predictably and do not cover persistent navigation or primary actions.
- Placement, dismissal, timing, focus, and screen-reader behavior are consistent across features.

## P0: Shared Table and Filter Behavior

The following requirements apply to every applicable table through reusable table infrastructure. Domain pages must not implement separate variants of the same behavior.

### IMP-TABLE-01: Multi-Select Quick Filters

The transaction and recurring-payment quick filters for category and payment method must allow multiple values to be selected.

Acceptance criteria:

- Users can select and remove multiple categories and multiple payment methods independently.
- Values within one filter dimension use OR semantics; different dimensions use AND semantics.
- Selected values are visible, keyboard-operable, and individually removable.
- All selected identifiers are serialized in the URL, restored after reload, and mapped consistently to API queries and cache keys.
- Clearing a filter removes only that filter dimension and resets pagination to the first page.

### IMP-TABLE-02: Functional Row Action Menus

Every ellipsis button in a table row must open a functional action menu. If a row has no actions, the button must not be rendered.

Acceptance criteria:

- Menus contain only actions that are available for the row and current user.
- Actions such as edit, delete, view details, or manage attachments open the established workflow.
- Destructive actions require confirmation.
- Disabled, empty, or click-only placeholder menus are not permitted.
- Opening a row menu does not toggle row selection or trigger row drill-down.

### IMP-TABLE-03: Configurable Page Size

Every paginated table must offer page sizes of 10, 25, 50, and 100 rows.

Acceptance criteria:

- The current page size is visible and represented in URL state.
- Changing the page size resets pagination to the first page and requests the corresponding server-side page size.
- An unsupported URL value falls back to the shared default without breaking the table.
- Page-size controls work at desktop and mobile widths and have accessible labels.

### IMP-TABLE-04: Bulk Actions for Selected Rows

When users select rows through checkboxes, a bulk-action toolbar must offer Delete and Export.

Acceptance criteria:

- The toolbar appears only while at least one row is selected and shows the selection count.
- Delete clearly names the number and entity type of affected rows and requires confirmation.
- Bulk deletion is offered only for entity types that support deletion and uses their existing ownership and relationship checks.
- After successful deletion, affected data and statistics are refreshed and the selection is cleared.
- Failed or partially failed operations identify the affected rows without falsely reporting complete success.
- Export applies to the selected rows and offers both CSV and JSON.

### IMP-TABLE-05: CSV and JSON Export

Every data table must provide table-level export in both CSV and JSON formats.

Acceptance criteria:

- Without a row selection, export includes the complete data set matching the active filters and sort order, not only the current page.
- With selected rows, the bulk export behavior from IMP-TABLE-04 takes precedence.
- CSV output is UTF-8, has stable headers, and escapes delimiters, quotes, and line breaks correctly.
- JSON output has a documented, stable structure and uses the same field meanings as CSV.
- Dates, amounts, and identifiers are unambiguous and machine-readable; localized display labels may be included only where they do not replace canonical values.
- Files have meaningful names that identify the entity and export date.

## P1: Domain Workflows and Statistics

### IMP-TRANSACTION-01: Direct Attachment Upload

Users must be able to attach files directly to an existing transaction from its transaction workflow.

Acceptance criteria:

- The transaction create/edit or detail workflow exposes both drag-and-drop and file-picker input.
- An upload begins only after a persisted transaction exists and is associated with that transaction.
- Allowed file types and size limits are shown and validated before upload.
- Upload progress, success, validation errors, and retryable failures are visible per file.
- Successful uploads immediately appear in the transaction attachment list and count.
- Preview, download, and delete continue to follow the attachment behavior and signed-URL constraints documented in [06-current-webapp-functionality.md](./06-current-webapp-functionality.md).

### IMP-CATEGORY-01: Category Transaction Drill-Down

Users must be able to open the transactions belonging to a category directly from the category page.

Acceptance criteria:

- Activating a category's drill-down opens the shared transaction dialog filtered to that category.
- The dialog shows the active category context and uses the same transaction definitions, formatting, pagination, and permissions as the transaction page.
- Loading, empty, error, and populated states are handled inside the dialog.
- Row selection and row action controls do not accidentally open the drill-down.

### IMP-BUDGET-01: Budget Transaction Drill-Down

Users must be able to open the transactions included in a budget directly from the budget page.

Acceptance criteria:

- Activating a budget's drill-down opens the shared transaction dialog.
- The transaction query includes all categories assigned to the budget and the budget's active reporting period.
- The dialog clearly shows the budget and period context.
- Totals in the dialog use the same query scope as the budget calculations.
- Loading, empty, error, and populated states are handled inside the dialog.

### IMP-BUDGET-02: Budget KPIs

The budget page must summarize budget status, utilization, and overrun for the active period.

Required metrics:

- budget status using the shared warning-threshold rules;
- allocated amount and spent amount;
- utilization percentage, calculated as spent divided by allocated amount;
- remaining amount while within budget;
- overrun amount, calculated as the positive amount by which spend exceeds the allocation.

Acceptance criteria:

- Zero-value and missing budgets are distinguished explicitly and never produce an invalid percentage.
- Status uses text and visual treatment; color alone is insufficient.
- KPI values use the same period, categories, filters, currency, and transaction scope as the budget drill-down.
- Aggregation covers the complete matching data set and is not calculated from the current table page.

### IMP-RECURRING-01: Recurring-Payment KPIs

The recurring-payment page must show the number of active, inactive, and expired recurring payments.

Acceptance criteria:

- Status definitions come from the backend/domain contract and are shared with row status labels.
- An expired item is distinguished from an item that was manually paused or deactivated.
- Counts respond to the page's applicable filters without being limited to the current page.
- Loading, empty, and error states do not display stale or invented counts.

### IMP-TRANSACTION-02: Transaction KPIs

The transaction page must provide statistics for the active filter and reporting scope.

Required metrics:

- number of transactions;
- total transaction amount using the same signed amount convention as the transaction table;
- average transaction amount;
- transaction count and amount grouped by category;
- transaction count and amount grouped by payment method.

Acceptance criteria:

- The UI labels make the sign convention and reporting period clear.
- Uncategorized transactions and transactions without a payment method remain visible as explicit groups.
- KPI values update with filters and use the complete matching data set.
- Empty data produces meaningful zero or empty states rather than invalid averages.
- Currency and number formatting follows IMP-I18N-01.

## P1: Branding

### IMP-BRAND-01: BudgetBuddyDE Logo

Create a recognizable logo for BudgetBuddyDE that works in the authentication views, app shell, favicon, and compact mobile navigation.

Required deliverables:

- a scalable primary logo and compact mark;
- variants that remain legible in light and dark themes;
- an application icon or favicon derived from the compact mark;
- source assets suitable for lossless reuse, preferably SVG.

Acceptance criteria:

- The logo remains recognizable at both app-bar and favicon sizes.
- Light and dark variants maintain accessible contrast without changing brand identity.
- Logo assets do not embed unlicensed third-party artwork or fonts.
- Decorative usage has appropriate alternative-text behavior; meaningful usage exposes the product name.
- The assets use stable paths and do not cause layout shifts while loading.

## Recommended Delivery Slices

Implement these improvements as separate, verifiable tasks in this order:

1. Authentication and app-shell controls: IMP-AUTH-01 through IMP-AUTH-03, IMP-SHELL-01, and IMP-SHELL-02.
2. Localization and feedback foundations: IMP-I18N-01 and IMP-FEEDBACK-01.
3. Shared table foundation: IMP-TABLE-01 through IMP-TABLE-05, adopted by one table first and then migrated across all applicable tables.
4. Transaction and drill-down workflows: IMP-TRANSACTION-01, IMP-CATEGORY-01, and IMP-BUDGET-01.
5. Statistics: IMP-BUDGET-02, IMP-RECURRING-01, and IMP-TRANSACTION-02.
6. Branding assets and integration: IMP-BRAND-01.

Each implementation task must reference its requirement IDs and define the relevant smoke test, automated tests, and affected routes. A slice is complete only after every applicable table or entry point has migrated; parallel legacy behavior is not a completed implementation.

## Traceability to the Existing Catalog

| Improvement area                                                | Refines or extends                                                          |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Authentication controls and sign-out                            | P0 Authentication, P1 Settings                                              |
| Avatar and navigation cleanup                                   | P0 App Shell and Navigation                                                 |
| Internationalized text and formatting                           | Product Requirements: Internationalization                                  |
| Toast behavior                                                  | Development Guidelines: UI and UX Guidelines                                |
| Multi-select filters, row actions, pagination, and bulk actions | P0 Transactions, P0 Recurring Payments                                      |
| CSV and JSON table exports                                      | P1 Import and Export                                                        |
| Transaction attachment upload                                   | P1 Attachments                                                              |
| Category and budget transaction drill-down                      | P0 Categories, P0 Budgets                                                   |
| Budget, recurring-payment, and transaction KPIs                 | P0 Dashboard, P0 Budgets, P0 Recurring Payments, P1 Analytics and Reporting |
| Logo and application icon                                       | P0 App Shell and Navigation                                                 |
