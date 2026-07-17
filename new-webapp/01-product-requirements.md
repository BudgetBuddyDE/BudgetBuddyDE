# Product Requirements

## Product Vision

BudgetBuddyDE is a personal finance app for users who want to manage income, expenses, budgets, recurring payments, and financial progress in one place. The new webapp should make everyday financial maintenance faster while providing better analysis.

## Target Groups

- Individuals who want to record and organize monthly income and expenses.
- Households or couples who want to maintain shared categories, budgets, and payment accounts.
- Advanced users who need CSV/JSON export, API access, and traceable analysis.
- Self-hosting users who operate and maintain BudgetBuddyDE independently.

## Product Goals

- Make the financial status visible at a glance.
- Provide comprehensive reporting for the current month, any selected month, and complete years.
- Let users navigate and initiate create or edit workflows through typed intents and an enriched command palette.
- Make recording a new transaction possible within a few seconds.
- Plan recurring payments reliably and include them automatically.
- Present budgets and categories so that overspending is identified early.
- Provide secure and traceable data import, export, and attachments.
- Deliver a consistent, responsive, and accessible experience on desktop and mobile.

## MVP Scope

The MVP is complete when an authenticated user can reliably perform the following tasks:

- Create an account, sign in, reset a password, and verify an email address.
- View a dashboard with balance, income, expenses, budgets, and upcoming payments.
- Create, edit, delete, filter, and categorize transactions.
- Manage categories and payment methods.
- Create recurring payments and view upcoming due payments.
- Manage category budgets and understand their current status.
- Manage the profile, sessions, and basic app settings.

## Out of Scope for the MVP

- Bank account synchronization through PSD2/Open Banking.
- Shared households with a role model.
- Native mobile apps.
- AI-based automatic categorization.
- A complete admin console.
- Multi-currency accounting with historical exchange rates.

These items remain valid future extensions but must not block the MVP.

## Core Domain Objects

- User: owns data, settings, sessions, and optional API keys.
- Transaction: amount, type, date, category, payment method, description, and attachments.
- Category: name, type, color/icon, and optional budget.
- Payment method: name, type, status, and optional description.
- Recurring payment: amount, category, interval, next execution date, and status.
- Budget: period, category, target value, actual spend, and warning thresholds.
- Attachment: file, preview, download, and association with transactions.

## Non-Functional Requirements

### Security and Privacy

- Authentication and session management use the existing authentication service.
- Users may only view and change their own data.
- Sensitive data must not be exposed in logs, URLs, or client-side errors.
- Delete functions require confirmation and must clearly describe irreversible actions.
- Uploads must validate file type, size, and access protection.

### Performance

- The first usable view should load quickly; unnecessary data should load on demand.
- Tables and lists must support server-side pagination or incremental loading.
- Charts must not block rendering when handling large data sets.
- Mobile usage must not depend on desktop-only interactions.

### Accessibility

- All interactive elements need keyboard support, visible focus, and meaningful labels.
- Color-coded statuses must never be the only source of information.
- Dialogs, drawers, and menus must manage focus correctly.
- Contrast and font sizes must support extended use.

### Internationalization

- The primary language is English.
- Numbers, currencies, and dates are formatted according to the active locale.
- Text must be structured so that additional languages can be added later.

### Operations

- The webapp must remain integrable with the monorepo's existing services and packages.
- Health checks, build, typecheck, lint, and tests must run in CI.
- Deployment should remain compatible with the existing Railway/CI structure.

## Success Criteria

- Users can maintain the most important financial data without instructions.
- Recurring tasks require fewer interactions than in the existing app.
- Critical workflows are covered by tests.
- No new feature is released without loading, error, and empty states.
- The new webapp can be developed incrementally alongside the existing webapp.

## Technical Requirements

- The new webapp must be built under apps/new-webapp.
- The framework is Next.js with the App Router and TypeScript.
- The UI layer uses ShadCN components implemented with Base UI and must integrate with the existing monorepo conventions.
- The new app must reuse existing internal packages, services, authentication boundaries, CI conventions, and the root lockfile.
- Every custom component and wrapper must have automated test coverage, including relevant states, interactions, and provider behavior.
- Data access must use a deliberate caching strategy that maximizes safe reuse without exposing private data between users.
