# Current Webapp Functionality

## Purpose and Scope

This document is the initial functionality inventory for the new webapp. It is based on the currently implemented apps/webapp, its App Router pages, domain components, API client usage, and the existing webapp documentation.

The inventory records observed behavior and current product scope. It is not a claim that every behavior is complete or that every current implementation detail must be copied. The new app should preserve valuable user workflows while rebuilding them under apps/new-webapp with Next.js, ShadCN, and Base UI.

Status labels:

- Currently available: implemented and visible in the current webapp.
- Partial or constrained: implemented with limitations, incomplete coverage, or an explicitly constrained workflow.
- Future scope: documented or implied direction that is not fully represented by the current implementation.

## Route and Functional Overview

| Area                          | Current route or entry point | Status              |
| ----------------------------- | ---------------------------- | ------------------- |
| Sign in                       | /sign-in                     | Currently available |
| Sign up                       | /sign-up                     | Currently available |
| Password reset request        | /password/request-reset      | Currently available |
| Password reset                | /password/reset              | Currently available |
| Email changed confirmation    | /email/changed               | Currently available |
| Email verified confirmation   | /email/verified              | Currently available |
| Account deletion confirmation | /user/confirm-deletion       | Currently available |
| Main dashboard                | /dashboard                   | Currently available |
| Budget dashboard              | /dashboard/budget            | Currently available |
| Insights dashboard            | /dashboard/insights          | Currently available |
| Transactions                  | /transactions                | Currently available |
| Categories                    | /categories                  | Currently available |
| Payment methods               | /paymentMethods              | Currently available |
| Recurring payments            | /recurringPayments           | Currently available |
| Attachments                   | /attachments                 | Currently available |
| Profile settings              | /settings/profile            | Currently available |
| API keys                      | /settings/api-keys           | Currently available |
| Health endpoint               | /api/health                  | Currently available |
| Session endpoint              | /api/session                 | Currently available |

## Authentication and Account Access

### Currently Available

- Sign in with email and password.
- Sign up with first name, surname, email, and password.
- OAuth sign in for Google and GitHub.
- Password reset request and password reset flow.
- Email verification and confirmation pages.
- Email change confirmation.
- Authentication feedback through shared notifications.
- Redirect to the dashboard after successful sign in.
- Protected dashboard area with authenticated and unauthenticated layout boundaries.
- Account deletion confirmation flow.

### Partial or Constrained

- Authentication is delegated to the existing auth-service and auth client. The new app must preserve this service boundary rather than implementing a second authentication system.
- Error handling and form state are present but should be reviewed for consistent validation, accessibility, and loading behavior in the new app.

## Application Shell and Navigation

### Currently Available

- Authenticated application shell with app bar, navigation drawer, footer, and main content area.
- Responsive navigation behavior for desktop and mobile layouts.
- Active navigation state.
- Navigation entries for dashboard, transactions, recurring payments, payment methods, categories, and attachments.
- Settings area with profile and API key navigation.
- User profile area with sign out.
- Command palette with actions for opening the dashboard, settings, and API keys, and for logging out.
- Global loading, not-found, dashboard error, and global error handling.

### Reusable Patterns Observed

- Page header and content grid wrappers.
- Drawer and drawer context.
- App bar, footer, authenticated main area, and unauthenticated main area.
- Shared error alert, no-results, loading, snackbar, dialog, and transition components.
- Reusable table, toolbar, filter, form, dialog, and drawer patterns.

These patterns are candidates for generic components in the new app and must not be reimplemented independently for each domain.

## Dashboard

### Main Dashboard

The dashboard currently combines:

- Financial summary data, including budget-related estimates and key financial metrics.
- Upcoming recurring payments.
- Expense distribution by category.
- Budget distribution.
- Latest transactions.
- Upcoming transactions.
- Links from dashboard widgets to the relevant detailed views.
- Suspense-based loading and route-aware error boundaries around independently loaded areas.

### Budget Dashboard

The budget view currently combines:

- Budget list.
- Budget create, edit, and delete workflows.
- Spending goals radar chart.
- Recurring payment distribution chart.
- Category income distribution chart.
- Category expense distribution chart.
- Shared dashboard statistics.

### Insights Dashboard

The insights view currently provides:

- Historical balance line chart.
- Historical balance table.
- Historical balance grouped by category.
- Basic and category-grouped insight variants.

### Partial or Constrained

- The current documentation describes monthly reports and analytics as upcoming, while the current implementation already exposes budget charts and historical insights. The new functionality backlog must clarify which reports are required for the first release.
- Chart data, filter consistency, and empty states must be reviewed during the rebuild.

## Transactions

### Currently Available

- Transaction table at /transactions.
- Create transaction workflow.
- Edit transaction workflow.
- Delete transaction workflow with confirmation.
- Table pagination and sorting through shared table components.
- Filters for date range, transaction type, categories, payment methods, and search or keyword values.
- URL persistence for transaction filters so filtered views survive reloads and can be shared.
- Category, payment method, and receiver value help in transaction forms.
- Transaction type and amount handling.
- Transaction description and date fields.
- Attachment option and attachment count on transaction rows.
- Transaction-specific attachment dialog.
- Latest and upcoming transaction lists on the dashboard.

### Partial or Constrained

- Bulk selection is not a complete multi-action workflow in the current app; the new app must provide the multi-transaction dialog defined under New Functionality to Add.
- The new app should preserve URL filter serialization and keep filter state consistent between tables, dashboard links, and API requests.
- Monetary values, dates, time zones, and validation behavior require explicit contracts in the new implementation.

## Categories

### Currently Available

- Category table at /categories.
- Keyword filtering with URL initialization.
- Create category.
- Edit category.
- Delete category.
- Merge categories.
- Category value help for transaction and budget forms.
- Protection or inspection of related transactions before deletion.
- Category chips and category distribution charts.

### Partial or Constrained

- Merge and delete workflows should be reviewed for clearer impact previews and cache invalidation.
- Category colors/icons and budget relationships should be made explicit in the new domain model.

## Payment Methods

### Currently Available

- Payment method table at /paymentMethods.
- Keyword filtering with URL initialization.
- Create payment method.
- Edit payment method.
- Delete payment method.
- Merge payment methods.
- Payment method value help for transaction and recurring payment forms.
- Payment method status and historical display.
- Payment method chips in shared UI.

### Partial or Constrained

- The new app must define the lifecycle of inactive payment methods and how they remain selectable for historical data without being preferred for new transactions.

## Recurring Payments

### Currently Available

- Recurring payment table at /recurringPayments.
- Create recurring payment.
- Edit recurring payment.
- Delete recurring payment.
- Execute a recurring payment manually.
- Filter and sort recurring payments.
- URL persistence for recurring payment filters.
- Category, payment method, and receiver value help.
- Calculation and display of the next execution date.
- Upcoming recurring payment list on the dashboard.
- Recurring payment distribution chart in the budget view.

### Partial or Constrained

- The current interval and execution behavior must be confirmed against the backend contract before rebuilding.
- Automatic conversion into transactions and notification automation are future extensions unless explicitly confirmed as existing backend behavior.

## Budgets

### Currently Available

- Budget list in the budget dashboard.
- Create budget.
- Edit budget.
- Delete budget with related transaction inspection.
- Category selection for budgets.
- Estimated budget data in dashboard statistics.
- Budget pie chart.
- Spending goals radar chart.
- Budget-related income and expense visualizations.

### Partial or Constrained

- The exact period, warning threshold, and overspending semantics need to be defined as explicit product requirements.
- The new app should ensure that budget values, filtered transactions, and chart values share the same date-range and cache rules.

## Analytics and Visualizations

### Currently Available

- Category expense chart.
- Category income chart.
- Budget pie chart.
- Recurring payment pie chart.
- Spending goals radar chart.
- Historical balance line chart.
- Historical balance table.
- Historical category balance table.
- Responsive chart container and reusable chart components.

### Partial or Constrained

- The current chart set is implemented, but a complete reporting model and consistent cross-filtering are not yet established.
- Charts need defined loading, empty, error, tooltip, axis, accessibility, and performance requirements.

## Attachments and Receipts

### Transaction Attachments

- Upload attachments to a transaction.
- Drag-and-drop or file-picker upload.
- Supported image formats documented in the current app: PNG, JPG, JPEG, and WebP.
- Attachment thumbnail grid.
- View attachment in a lightbox.
- Download attachment.
- Delete attachment with confirmation.
- Incremental attachment loading in pages of 24 for a transaction.
- Signed URLs for attachment access.
- Attachment count and preview strip in transaction table rows.

### All Attachments Page

- Dedicated /attachments page.
- Server-loaded attachments sorted newest first.
- Responsive attachment grid.
- View, download, and delete actions.
- Initial display in batches of 20.
- Load more interaction.
- Empty state when no attachments exist.

### Partial or Constrained

- Signed URLs must be cached only within their validity period.
- Upload validation, access control, file size limits, and error behavior must be explicit in the new app.

## Profile, Sessions, Linked Accounts, and API Keys

### Profile Settings

- Edit user name.
- Change email address.
- Send or resend verification email.
- Delete the user account.
- Account deletion confirmation and processing feedback.
- App information and version information.

### Linked Accounts

- List linked authentication accounts.
- Unlink a linked account.
- Revalidate the session after account changes.

### Sessions

- List active and existing sessions.
- Identify the current session.
- Revoke an individual session.
- Revoke other sessions or all sessions through a dedicated action.
- Revalidate the session after revocation.

### API Keys

- List API keys.
- Create API keys.
- Delete API keys.
- Show the newly created key in a dedicated dialog.
- Treat the full key as a one-time display value.

### Partial or Constrained

- Session and account changes are security-sensitive and should remain fresh rather than being broadly cached.
- API key creation, deletion, and one-time display require dedicated tests and careful client-side handling.

## Filtering, URLs, and Tables

### Currently Available

- Shared filter components for transactions and recurring payments.
- Keyword filters for categories and payment methods.
- URL serialization and parsing for shareable filter state.
- Filter button state indicates active filters.
- Shared table implementations for basic tables, data grids, entity tables, pagination, row menus, and table toolbars.
- Server page components parse incoming search parameters before rendering domain components.

### New App Requirement

- Keep URL state as the source of truth for shareable table filters and sorting.
- Keep query parsing, serialization, cache-key construction, and API mapping in reusable, tested modules.
- Use generic table, filter, pagination, and action-menu components across domains.

## Cross-Cutting Quality and UX Behavior

The current app provides the following cross-cutting behavior that must be preserved or improved:

- Loading states at application and route level.
- Suspense fallbacks for independently loaded dashboard areas.
- Error boundaries at global and dashboard scope.
- Empty states for lists and attachments.
- Confirmation dialogs for destructive actions.
- Snackbar or notification feedback after mutations.
- Responsive desktop and mobile layouts.
- Keyboard and navigation support through shared UI components.
- Test coverage for many shared components, wrappers, hooks, utilities, tables, filters, and error boundaries.
- Co-located tests next to the implementation.

## Functional Gaps to Clarify for the New App

The current app inspection leaves these topics for explicit product decisions:

- Whether the new app must preserve all current routes and URL paths exactly.
- The final dashboard metric definitions and period selection behavior.
- The complete budget period and warning model.
- The supported recurring payment intervals and automatic execution semantics.
- Whether monthly reports and advanced analytics are first-release features.
- Whether account households, collaboration, bank synchronization, multi-currency support, and automated categorization remain out of scope.
- The exact cache technology and cache lifetime per API resource.
- The minimum required component and wrapper test coverage threshold.

## New Functionality to Add

The following capabilities extend the current app inventory and are required for the new webapp.

### Multi-Transaction Create and Edit

The new app must let users create multiple transactions and edit multiple existing transactions within a single dialog. This feature may be limited to desktop viewports and may be unavailable on smaller devices. The standard single-transaction create and edit workflows must remain available on every supported device.

### Comprehensive Reporting

The new app must provide a dedicated reporting experience with:

- Current-month reporting as the default.
- Month selection based on a chosen date.
- Complete-year reporting.
- Income, expenses, net balance, savings result, category breakdowns, budget consumption, and recurring-payment impact.
- Consistent period handling across charts, tables, filters, URLs, and cache keys.
- Accessible visual and tabular representations.
- Loading, empty, error, and large-data states.

### Intent-Based Navigation

The current app already contains navigation and a command palette. The new app should extend this into a typed intent system that can:

- Open a target page.
- Start creation of a new transaction, category, payment method, recurring payment, budget, or attachment.
- Resolve an existing object and open its edit workflow.
- Ask the user to disambiguate multiple matches.
- Respect authentication, permissions, ownership, and household context.
- Move focus to the resulting page, drawer, dialog, or form.
- Report invalid, missing, ambiguous, or unauthorized intents clearly.

### Command Palette Expansion

The command palette should become the user-facing entry point for the intent system. It should offer:

- Page navigation commands.
- Create commands for core domain objects.
- Search-and-edit commands for existing objects.
- Reporting commands for the current month, a selected month, and a selected year.
- Settings and account commands.
- Keyboard navigation, accessible focus, command groups, filtering, and contextual availability.
- A shared command registry so new commands do not require changes to the palette rendering component.
- Explicit confirmation for destructive actions.

These capabilities should be implemented with reusable command, intent, object-search, and action-launcher components instead of feature-specific copies.
