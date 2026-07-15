# Existing Webapp Structure Reference

## Purpose

The new application must be built under apps/new-webapp and should follow the structural conventions of the existing apps/webapp. This is a structural reference, not a requirement to copy the existing Material UI implementation. The new app uses ShadCN with Base UI as its UI layer while preserving the repository's established boundaries and workflows.

## Monorepo Placement

The repository is an npm workspace managed from the root. The relevant areas are:

- apps: user-facing applications, including the existing webapp and the new webapp.
- services: deployable backend and infrastructure services.
- packages: reusable internal and public libraries.
- Root package.json: workspace registration and shared scripts.
- Root package-lock.json: the only lockfile.
- turbo.json: shared task pipeline for build, lint, typecheck, test, and development tasks.

When implementation starts, apps/new-webapp must be added to the root workspace configuration and participate in the same Turborepo and CI commands as the existing app.

## Existing App Root

The existing apps/webapp contains the following app-level responsibilities:

- package.json: workspace metadata, scripts, dependencies, and quality commands.
- next.config.mjs: Next.js configuration.
- tsconfig.json: TypeScript configuration and path aliases.
- vitest.config.mts: app-specific test configuration extending the workspace base config.
- src/vitest.setup.ts: global test setup and browser/Next.js mocks.
- railway.json: deployment configuration.
- public: static assets and web manifest.
- src: application source code.

The new app should provide equivalent configuration boundaries while using its own package name, dependencies, and deployment settings.

## Source Directory Layout

The existing source tree is organized into these top-level areas:

### app

The Next.js App Router entry point:

- Route groups such as (auth) and (dashboard) separate URL concerns without changing public routes.
- page.tsx files define route screens.
- layout.tsx files define nested layouts and provider boundaries.
- loading.tsx files define route-level loading UI.
- error.tsx and global-error.tsx define route and application error handling.
- not-found.tsx defines missing-resource handling.
- app/api contains app-owned API route handlers such as health and session endpoints.

The new app must keep route composition and route-level states in app.

### components

Reusable UI and domain compositions are grouped by responsibility and domain. Existing examples include:

- User, Category, PaymentMethod, Transaction, Budget, and Attachments for domain areas.
- Table, Form, Filter, Dialog, Drawer, Layout, Loading, ErrorAlert, Snackbar, and similar shared UI concerns.
- Charts and Analytics for data presentation.
- Small shared components such as Button, Card, Icon, Image, Brand, and AppLogo.

The new app should use the same principle: domain components stay close to their domain, while genuinely reusable primitives and wrappers live in shared component folders. ShadCN/Base UI primitives should have a dedicated UI area and should be composed into domain components rather than placed directly in route pages.

### hooks

Reusable client-side hooks are organized one folder per hook. The existing convention commonly includes:

- The hook implementation.
- An index.ts barrel export.
- A colocated .test.ts or .test.tsx file when behavior requires testing.

The new app should preserve this convention for navigation, responsive behavior, keyboard interaction, data access, and UI state hooks.

### lib

Application infrastructure and shared state live in lib. The existing app uses:

- A Redux store and StoreProvider.
- Domain feature slices for transactions, categories, budgets, payment methods, and recurring payments.
- Shared slice and entity helpers.
- Header and request helpers.

The new app may use the state technology that best fits the data flow, but state, API adapters, cache policies, request helpers, and other infrastructure should remain in lib rather than being embedded in route pages or presentational components.

### theme

The existing app keeps theme integration and design tokens in theme, including:

- App-level theme construction.
- General tokens such as typography, spacing, shape, shadows, transitions, breakpoints, z-index, and component overrides.
- Separate light and dark theme definitions.

The new app should keep ShadCN design tokens, Base UI integration, color modes, typography, spacing, breakpoints, and accessibility-related theme decisions in theme or the repository's equivalent dedicated design-system area.

### types

Shared app-local TypeScript types are kept in types. Types that are reused across applications or services must remain in the appropriate packages workspace instead of being copied into this directory.

### utils

Pure, reusable functions are organized by concern, commonly with:

- One folder per utility.
- An implementation file.
- An index.ts barrel export.
- A colocated .spec.ts or .test.ts file.

Examples include number parsing, currency/date/percentage formatting, OS detection, and download helpers. Keep formatters, parsers, serializers, and cache-key builders pure and directly testable.

### App-Wide Integration Modules

The existing app keeps cross-cutting app integration modules at the src root:

- apiClient.ts for backend access.
- authClient.ts for authentication access and session revalidation.
- appConfig.ts for app configuration.
- middleware.ts for request-level routing or protection.
- logger.ts for structured logging.

The new app should preserve this boundary for equivalent concerns and keep domain-specific API logic behind reusable adapters in lib or domain modules.

## Provider and Layout Composition

The existing app has explicit provider boundaries:

- The root layout composes the StoreProvider and the application layout wrapper.
- The layout wrapper composes the Next.js/MUI cache provider, theme provider, baseline styles, and snackbar provider.
- The dashboard layout adds navigation drawer and command palette providers around dashboard routes.
- Route groups provide separate authentication and dashboard layouts.

The new app should preserve this composition model:

- Root layout for global HTML, metadata, and app-wide providers.
- A dedicated layout wrapper for ShadCN/Base UI setup, theme mode, global styles, and shared feedback providers.
- Dashboard layout for navigation, command actions, and authenticated application context.
- Auth layout for unauthenticated flows.
- Route-level loading, empty, success, and error boundaries close to the relevant route.

Provider wrappers must have dedicated tests for composition and context behavior.

## Data Flow and State Boundaries

The existing app follows these boundaries:

- App Router pages and layouts compose screens and server/client boundaries.
- apiClient and authClient isolate service calls.
- Domain components render and mutate domain data.
- Redux feature slices hold shared client state where needed.
- URL parameters hold shareable table filters and sorting state.
- Utilities and formatters remain pure and independent from React.

The new app should add an explicit cache boundary:

- Server data access and cache policies belong in reusable data-access modules.
- Client cache state supports interactivity but does not replace the server as the source of truth.
- Mutations define cache invalidation or update behavior next to the affected data-access operation.
- Cache keys and invalidation rules are tested.

## Test Organization

The existing app uses Vitest with Testing Library and keeps tests next to the implementation:

- Components use colocated .test.tsx files.
- Utilities use colocated .spec.ts or .test.ts files.
- Shared test setup configures DOM behavior and mocks Next.js modules such as next/navigation and next/image.
- Tests cover shared UI components, domain components, wrappers, hooks, utilities, tables, filters, and error boundaries.

The new app must retain this standard and require tests for every custom component and wrapper. A feature is complete only when its implementation and relevant test coverage are both present.

## New App Mapping

Use this mapping when creating apps/new-webapp:

- app: routes, route groups, layouts, loading, error, and not-found states.
- components/ui: ShadCN and Base UI primitives plus their direct tests.
- components: shared and domain-specific compositions.
- hooks: reusable client hooks and their tests.
- lib: API adapters, server data access, cache policies, client state, and request helpers.
- theme: ShadCN tokens, Base UI setup, color modes, and global design integration.
- types: app-local types only.
- utils: pure formatters, parsers, serializers, and cache-key utilities.
- src root modules: app-wide API client, auth client, configuration, middleware, logger, and test setup.

Do not place business logic directly in page files when it can be expressed as a reusable, testable module. Do not create parallel copies of existing shared packages or service contracts.
