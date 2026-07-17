# Feature Catalog

Priorities:

- P0: Blocks the MVP.
- P1: Important for a complete first release.
- P2: Useful extension after the MVP.

## P0: Authentication

### Requirements

- Registration with email and password.
- Sign in and sign out.
- Forgot-password and password-reset flows.
- Email verification.
- OAuth sign-in for Google and GitHub, if available through the authentication service.
- Session list with the active session and the ability to revoke sessions.

### Acceptance Criteria

- Unauthenticated users are directed to authentication pages.
- Protected pages are inaccessible without a valid session.
- Error messages distinguish between user input and technical errors.
- After sign-in, the user lands on the dashboard.

## P0: App Shell and Navigation

### Requirements

- Responsive layout with side navigation, app bar, and main content area.
- Mobile navigation through a drawer or comparable pattern.
- Visible active navigation item.
- Global search or command palette as an extensible entry point for central actions.

### Acceptance Criteria

- All MVP pages are reachable through navigation.
- The layout does not visibly jump between loading and error states.
- Keyboard interaction works for navigation and menus.

## P0: Dashboard

### Requirements

- Overview of income, expenses, balance, and budget status.
- List of recent transactions.
- List of upcoming recurring payments.
- Warnings for budget overruns or uncategorized transactions.

### Acceptance Criteria

- The dashboard loads real API data.
- Every summary area has loading, empty, and error states.
- Users can navigate directly from dashboard elements to detail pages.

## P0: Transactions

### Requirements

- Create, edit, and delete transactions.
- Required fields: amount, type, date, category or uncategorized state; description is optional.
- Filter by date range, type, category, payment method, and search text.
- Sort by date, amount, and category.
- Pagination or incremental loading.
- Allow multiple transactions to be created together and multiple existing transactions to be edited together within a single dialog.
- The multi-transaction dialog may be desktop-only and unavailable on smaller devices; the single-transaction create and edit workflows must remain available on every supported device.

### Acceptance Criteria

- A new transaction appears after saving without a full page reload.
- Filters are represented in the URL.
- Invalid amounts and dates are prevented.
- On supported desktop viewports, users can add or edit multiple transactions in one dialog and save their changes without opening a separate dialog for each transaction.
- On smaller viewports, the multi-transaction entry point may be omitted without affecting the standard single-transaction workflows.
- Deletion requires confirmation.

## P0: Categories

### Requirements

- Create, edit, delete, and merge categories.
- A category has a name, type, color/icon, and optional budget target.
- Default categories may be offered during initial setup.
- Categories with existing transactions must not be deleted without controlled handling.

### Acceptance Criteria

- Category changes are visible in transaction lists.
- Merging preserves existing assignments.
- Deletion transparently shows affected data.

## P0: Payment Methods

### Requirements

- Create, edit, delete, and merge payment methods.
- A payment method has a name, type, and status.
- Inactive payment methods remain visible in historical data but are not prominent for new transactions.

### Acceptance Criteria

- Payment methods can be selected in transaction forms.
- Merging updates affected transactions.
- Inactive payment methods display a recognizable status.

## P0: Recurring Payments

### Requirements

- Create, edit, pause, and delete recurring payments.
- Supported intervals: monthly, quarterly, and yearly; extensible later.
- Show the next execution date.
- Display upcoming payments on the dashboard.

### Acceptance Criteria

- Due payments are sorted in an understandable way.
- Paused payments are not shown as urgently due.
- Changes are immediately visible in the dashboard and list.

## P0: Budgets

### Requirements

- Create and edit monthly budgets per category.
- Show budget status as spend, remaining amount, and percentage.
- Warning thresholds for nearly exhausted or exceeded budgets.
- Budget overview by period.

### Acceptance Criteria

- Budget values match filtered transactions for the selected period.
- Overruns are recognizable through both text and visual treatment.
- A category without a budget is clearly distinguished from a budget with a value of EUR 0.

## P1: Analytics and Reporting

### Requirements

- Income and expenses over time.
- Category distribution as a chart.
- Historical balance.
- Comparison of the current month with the previous month.

### Acceptance Criteria

- Charts have meaningful axes, tooltips, and empty states.
- Reports follow the same filter and date-range rules as tables.
- Numbers use consistent formatting.

## P1: Attachments

### Requirements

- Upload attachments to transactions.
- Preview image files.
- Download and delete each attachment.
- Dedicated attachments page with a chronological view.

### Acceptance Criteria

- Uploads validate file type and size.
- Users can only see their own attachments.
- Large numbers of attachments are paginated or loaded incrementally.

## P1: Import and Export

### Requirements

- CSV import for transactions with a mapping step.
- JSON export for user data.
- CSV export for table views.
- Import preview with validation errors.

### Acceptance Criteria

- Invalid import rows do not necessarily block valid rows.
- Users can confirm the mapping before importing.
- Export respects the current filters when started from a table.

## P1: Settings

### Requirements

- Edit profile information.
- Choose the theme mode.
- View or configure the default currency and locale.
- Manage API keys if supported by the authentication service.
- Delete the account with security confirmation.

### Acceptance Criteria

- Critical actions require explicit confirmation.
- Newly created API keys are shown in full only once.
- Session and account changes provide clear feedback.

## P1: Reporting

### Requirements

- Provide a dedicated reporting area for the current month.
- Allow the user to select any month by date.
- Allow the user to select a complete year.
- Use the current month as the default reporting period.
- Show income, expenses, net balance, and the period's savings result.
- Show category-based income and expense breakdowns.
- Show budget consumption and budget overruns for the selected period where budget data is available.
- Show recurring payments and their impact on the selected period.
- Provide both visual reporting and accessible tabular data.
- Keep reporting filters, period selection, and relevant view state shareable through URL parameters.
- Use the same transaction, category, payment method, and budget definitions as the rest of the application.
- Provide a clear period label and a way to move to the previous or next month or year.
- Prepare the reporting model for later export and comparison features.

### Acceptance Criteria

- The current month is selected by default using the configured locale and time zone.
- A user can select a month by choosing a date and can select a complete year.
- Income, expenses, net balance, and category totals are calculated from the same source data as the transaction views.
- Reporting values remain consistent with the active period and filters.
- Charts and tables have loading, empty, error, and accessibility states.
- The selected reporting period is reflected in the URL and survives reloads.
- A report does not silently mix data from different periods or currencies.
- Large reporting data sets remain responsive through server-side aggregation, pagination, or incremental loading where appropriate.

## P1: Intent-Based Navigation

### Requirements

- Provide a typed intent registry for navigation and application actions.
- Support intents that open a page without an object action.
- Support intents that open the create workflow for a new object.
- Support intents that open the edit workflow for an existing object.
- Support core object types such as transactions, categories, payment methods, recurring payments, budgets, and attachments.
- Resolve existing objects through stable identifiers, searchable labels, or a controlled disambiguation step.
- Carry the resolved intent into the target page, drawer, dialog, or form so the requested action starts immediately.
- Keep route navigation and object actions explicit and inspectable rather than relying on hidden side effects.
- Respect authentication, authorization, ownership, and household context before executing an intent.
- Support keyboard navigation and accessible focus transfer after an intent is executed.
- Provide clear feedback when an intent is incomplete, ambiguous, unauthorized, or refers to a missing object.
- Keep intents shareable and reproducible through typed command definitions and stable URL state where applicable.

### Acceptance Criteria

- A user can navigate to a target page from a registered intent.
- A user can start creating a new supported object from an intent.
- A user can resolve and edit an existing supported object from an intent.
- Ambiguous object matches require an explicit selection before editing or deleting.
- Unauthorized, invalid, and missing-object intents fail safely with understandable feedback.
- Executing an intent places focus in the relevant page, drawer, dialog, or form.
- Intent execution is covered by unit, component, and integration tests at the appropriate boundary.
- Adding a new intent does not require duplicating page-specific navigation logic.

## P1: Command Palette Expansion

### Requirements

- Expand the existing command palette into the primary entry point for Intent-Based Navigation.
- Group commands into navigation, create, edit, reporting, settings, and account actions.
- Support commands for opening core pages.
- Support commands for starting creation workflows for core objects.
- Support commands for editing an existing object after search or selection.
- Add reporting commands for opening the current month, a selected month, and a selected year.
- Support keyboard-first operation, visible focus, command filtering, and accessible labels.
- Use a shared command registry so commands can be added without modifying the palette's rendering logic.
- Show command availability based on authentication, permissions, current route, and available object context.
- Provide disambiguation UI for multiple matching objects.
- Return users to the originating context where appropriate after completing or cancelling an action.
- Require confirmation for destructive commands and never execute destructive actions from an ambiguous command.
- Track command execution errors and provide actionable user feedback without exposing sensitive data.
- Keep command definitions, intent resolution, and command UI separately testable.

### Acceptance Criteria

- The command palette can open existing pages and execute registered create, edit, reporting, settings, and account commands.
- Users can search commands by label, object, and intent.
- Create commands open the relevant empty form or drawer.
- Edit commands resolve the selected object and open the relevant populated form or drawer.
- Reporting commands open the requested reporting period.
- Commands unavailable to the current user or route are hidden or clearly disabled.
- The command palette works with keyboard navigation and screen readers.
- Every command has a test for availability, execution, success feedback, and failure behavior.
- Adding a command requires only a registry entry and its intent handler, not a rewrite of the palette component.

## P2: Collaboration and Households

### Requirements

- Create a household and invite members.
- Roles for owner, editor, and viewer.
- Filter data by household.

### Acceptance Criteria

- Permissions are enforced server-side.
- Users can identify the active household at all times.
- Invitations can expire or be revoked.

## P2: Automation

### Requirements

- Rules for automatic categorization.
- Automatically convert recurring payments into transactions.
- Notifications for budget overruns.

### Acceptance Criteria

- Automated actions are traceable and reversible.
- Users can disable rules.
- No automation changes data without a visible history.
