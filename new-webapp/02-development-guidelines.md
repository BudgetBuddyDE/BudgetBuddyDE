# Development Guidelines

## Codex Workflow

- Plan larger features before implementing them.
- Every task references the affected requirements and ends with clear verification steps.
- Existing repository conventions take precedence over new patterns.
- Keep changes small: one feature, one technical topic, or one clearly bounded slice per task.
- Before larger refactorings, explain why they are necessary for the feature.

## Repository and Workspace Rules

- The new webapp should be integrable as an npm workspace, expected to be located at apps/new-webapp.
- The root lockfile remains the only lockfile.
- Use internal packages through their existing package names; do not duplicate them.
- Shared types, API clients, and schemas belong in packages/\*, not in app-local copies.
- App-specific UI components remain in the app until genuine reuse emerges.

## Technology Baseline

- Framework: Next.js with the App Router.
- Language: TypeScript with strict types.
- UI: Material UI unless a deliberate new design decision is made.
- Forms: React Hook Form plus Zod or existing schema patterns.
- State: component-local state, URL state, or Redux/Zustand depending on scope; global state is only for genuinely shared app state.
- Charts: reuse existing MUI X/chart components or established wrappers from the repository.

## Architecture

- Separate server and client components intentionally.
- Encapsulate API access through existing clients and services.
- Keep domain logic out of UI components.
- Use URL parameters for shareable filter and sort states.
- Centralize error handling while showing local user feedback within the relevant workflow.
- Do not create hidden side effects in render paths.

## UI and UX Guidelines

- The webapp is a work tool, not a landing page.
- The post-login start view is a compact dashboard with immediately useful financial information.
- Tables, filters, dialogs, and drawers must be dense, calm, and easy to scan.
- Primary actions are clearly visible; destructive actions require confirmation.
- Use icons in buttons when an established symbol exists.
- Use cards only for individual repeated items or clearly framed content, not for every section.
- Mobile views must be fully functional and not merely scaled-down desktop layouts.
- Every page needs loading, empty, error, and success feedback states.

## Design System

- Respect existing theme tokens for colors, spacing, typography, shape, and breakpoints.
- Do not introduce a new color palette before product and accessibility foundations are clarified.
- Components should define stable dimensions for toolbars, table rows, icon buttons, and cards.
- Text must not overflow in buttons, table headers, or cards.
- Status indicators use a combination of text, color, and icon.

## Data and Validation

- Validate inputs client-side for UX and server-side for security.
- Never pass monetary values as unchecked floating-point strings.
- Handle dates, time zones, and recurring intervals explicitly.
- Keep filters, sorting, and pagination compatible with backend contracts.
- Uploads need allowed file types, size limits, and clear error messages.

## Testing

- Components with user interaction receive component tests.
- Utility functions and formatters receive unit tests.
- Critical workflows receive at least integration tests or well-bounded component tests.
- Tests live next to the code they test.
- New features must test relevant error, loading, and empty states.

## Quality Gates

Before completing a Codex implementation task:

- Check formatting.
- Run lint.
- Run typecheck.
- Run relevant tests.
- For UI work, verify the presentation at desktop and mobile widths.
- Review the diff against the requirements.

## Do-Not Rules

- Do not introduce a second data source for the same domain objects.
- Do not add package lockfiles in subdirectories.
- Do not put secrets in the client bundle or in Markdown documentation.
- Do not ship UI without understandable error and loading states.
- Do not perform broad refactorings as a side effect of a feature.
- Do not add new external dependencies without clear value and a brief justification.

## Mandatory Technical Requirements

### Application Location and Framework

- Build the new application under apps/new-webapp.
- Use Next.js with the App Router and TypeScript.
- Register the application as an npm workspace through the root package.json when implementation begins.
- Keep the root package-lock.json as the only lockfile.
- Keep the app compatible with the existing Turborepo pipeline, CI, and deployment conventions.

### UI Layer: ShadCN with Base UI

- Use ShadCN as the component and styling approach.
- Implement the ShadCN setup with Base UI primitives in the monorepo.
- Integrate the new UI layer into the current repository setup instead of creating an isolated design system.
- Follow the existing application structure described in 05-current-webapp-structure.md.
- Keep reusable primitives in a dedicated UI area and keep domain-specific compositions in their domain folders.
- Do not introduce Material UI into the new app unless a documented migration or compatibility requirement makes it necessary.
- Preserve accessibility, keyboard behavior, focus management, responsive behavior, and stable dimensions when composing Base UI primitives.
- Use the repository's existing linting, formatting, TypeScript, and package conventions.

### Testing of Components and Wrappers

- Every custom component and wrapper must have automated tests.
- Test files live next to the implementation, following the existing repository convention.
- Component tests must cover the public contract, meaningful variants, user interactions, and relevant loading, empty, error, and success states.
- Provider and wrapper tests must verify context behavior, composition, state propagation, and failure behavior where applicable.
- Test shared UI primitives, domain components, form wrappers, layout wrappers, data-table wrappers, and feedback wrappers.
- Use the existing Vitest and Testing Library setup as the default testing approach.
- A component is not considered complete when its implementation exists but its required tests are missing.
- New testable abstractions must not be hidden inside page files; extract them into components, hooks, utilities, or library modules so they can be tested directly.

### Data Fetching and Caching

- Prefer server-first data access with Next.js server components and server-side data fetching where the interaction model allows it.
- Cache data wherever it is safe and useful, especially stable reference data such as categories, payment methods, and configuration.
- Define a cache policy for every data source: cache key, freshness window, invalidation trigger, and privacy scope.
- Cache keys must include all relevant identity and query dimensions, such as user, household, date range, filters, sorting, and pagination.
- Never allow private user or household data to be reused across users, sessions, or tenants.
- Mutations must invalidate or update all affected server and client caches. Use route or tag revalidation patterns where they fit the existing Next.js architecture.
- Use client-side caching only where it improves interactive workflows, repeated navigation, or optimistic updates. It must not become a second source of truth.
- Deduplicate requests during a render or navigation where possible.
- Avoid caching short-lived signed attachment URLs beyond their validity period.
- Large lists and charts must combine pagination or incremental loading with appropriate caching.
- Document exceptions where data must always be fresh, such as session state, permission changes, destructive-action confirmation, or security-sensitive account information.
- Add tests for cache-key construction, invalidation behavior, and stale or error states when caching is part of a component or data-access wrapper.

### Structural Compatibility

- Follow the reference structure in 05-current-webapp-structure.md.
- Keep route composition in the App Router app directory.
- Keep reusable UI and domain compositions in components.
- Keep reusable client hooks in hooks.
- Keep state, API adapters, cache policies, and other application infrastructure in lib.
- Keep design tokens and theme integration in theme.
- Keep shared app types in types.
- Keep pure formatters and parsers in utils.
- Keep authentication, API client, middleware, logging, and other root integration modules at the app source root when they are app-wide concerns.

## Reusable Component Principle

- Build and use generic, reusable components whenever the same interaction, layout, state, or visual pattern appears in more than one feature.
- Identify reusable patterns before implementing a feature-specific component.
- Keep generic UI primitives and wrappers independent from domain models. Compose them into domain components instead of duplicating markup or behavior.
- Reuse the same tested components for tables, forms, dialogs, drawers, filters, pagination, loading states, error states, empty states, notifications, and responsive layouts.
- Extend a generic component through typed props, slots, composition, or variants before creating a near-duplicate.
- Keep domain-specific logic outside generic primitives.
- Every reusable component and wrapper must have its own tests and must be used by at least one real feature before being treated as part of the shared component library.
- Do not create abstractions solely to avoid a small amount of duplication. A component should have a clear reusable contract and reduce meaningful complexity.
