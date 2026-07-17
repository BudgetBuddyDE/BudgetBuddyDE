# Delivery Plan

## Phase 0: Clarification and Setup

Goal: Establish the development foundation before writing UI code.

- Decide whether the new app will be created in parallel as apps/new-webapp or gradually replace the existing apps/webapp.
- Define the package name, route base, deployment target, and CI integration.
- Confirm the internal packages to use: @budgetbuddyde/api, @budgetbuddyde/types, and, where applicable, @budgetbuddyde/db.
- Define the design foundation: adopt the existing MUI theme or deliberately create a new theme.
- Confirm the MVP scope from 03-feature-catalog.md.

Done when:

- The app workspace can be installed, built, linted, and typechecked.
- Navigation, the auth gate, and empty page shells exist.

## Phase 1: Foundation

Goal: Make the app usable without implementing domain depth yet.

- App shell with responsive navigation.
- Connect authentication flows.
- Integrate the API client and error handling.
- Define shared loading, empty, and error components.
- Create the base layout for the dashboard, tables, and forms.

Done when:

- A user can sign in and reach protected pages.
- Unauthenticated users are redirected correctly.
- Initial smoke tests for the layout and auth gate exist.

## Phase 2: Finance Data MVP

Goal: Create and display the core domain objects.

- Transaction list and transaction form.
- Category management.
- Payment method management.
- Recurring payments.
- Budget management.

Done when:

- All P0 domain objects have create/edit/delete workflows.
- Tables support filtering, sorting, and pagination where provided by the API.
- Critical forms have validation and tests.

## Phase 3: Dashboard and Reporting

Goal: Make the financial situation visible at a glance.

- Dashboard metrics.
- Recent transactions.
- Upcoming recurring payments.
- Budget status.
- Initial analytics charts.
- Reporting for the current month, a selected month, and a selected year.
- Intent registry and command palette expansion for navigation, create, and edit actions.

Done when:

- The dashboard is the central post-login start page.
- All dashboard areas have real data, loading, empty, and error states.
- Reporting periods produce consistent, shareable results.
- Registered intents can open pages and start create or edit workflows.
- Numbers use consistent formatting.

## Phase 4: File and Data Management

Goal: Let users take their data with them and manage receipts.

- Attachment upload and preview.
- Attachments page.
- CSV/JSON export.
- CSV import with mapping.

Done when:

- Uploads are validated and protected.
- Exported data has a traceable structure.
- Import errors are shown per row.

## Phase 5: Polishing and Release

Goal: Stabilize the first production release.

- Accessibility review.
- Mobile review.
- Performance review for tables, charts, and the dashboard.
- Refine error copy and empty states.
- Verify CI, deployment, and monitoring.

Done when:

- Format, lint, typecheck, tests, and build complete successfully.
- Known MVP acceptance criteria are checked off.
- Remaining P1/P2 topics are documented as issues or backlog items.

## Codex Task Sizing

Good Codex tasks:

- "Implement the app shell and navigation"
- "Implement the transaction list with URL filters"
- "Build the category form with validation"
- "Add budget status to the dashboard"
- "Write tests for the transaction form"

Poor Codex tasks:

- "Build the entire app"
- "Make the design prettier"
- "Refactor everything"
- "Implement all features at once"

Each task should contain at most one domain slice and the technical changes required for that slice.

## Technical Foundation Gate

Before implementing P0 features, confirm:

- apps/new-webapp is registered as a root npm workspace and works with the existing Turborepo pipeline.
- Next.js App Router and TypeScript are configured.
- ShadCN with Base UI is integrated into the existing monorepo setup.
- The application directory structure follows 05-current-webapp-structure.md.
- The Vitest and Testing Library setup can test every custom component and wrapper.
- A cache policy exists for every initial API data source, including invalidation after mutations.
- CI, typecheck, lint, format, test, and build commands are available for the new workspace.
