---
title: Documentation structure proposal
description: Proposed structure for user, hosting, and developer documentation.
icon: lucide/layout-list
status: draft
tags: [guide, documentation, structure]
---

# Proposal for the new documentation structure

> **Status:** Draft — this document describes the planned structure only. The existing navigation and content have not been changed by this proposal.

## Goals

The documentation will be divided into two clearly separated areas:

1. **User** — the default entry point for app users and people who want to host and operate their own BudgetBuddy instance.
2. **Developer** — technical information for developing, extending, and maintaining the project.

The separation is based on the reader's task rather than the internal repository structure. This allows readers to find instructions for their problem without knowing which service or package is responsible for it.

## Planned top-level navigation

```text
Home
├── User                         (shown initially)
│   ├── Overview
│   ├── Getting started
│   ├── Using the app
│   ├── Self-hosting
│   ├── Operations and maintenance
│   └── Help and troubleshooting
└── Developer
    ├── Overview
    ├── Development environment
    ├── Architecture
    ├── Components and packages
    ├── Services and interfaces
    ├── Data management
    ├── Quality and automation
    ├── Observability and operations
    └── Contributions and standards
```

### Visibility and entry point

- **User** is the primary area and the initial entry point.
- **Developer** is available through its own top-level navigation and targets people working on the source code.
- The home page briefly explains both audiences and links directly to both areas.
- Each page contains a short description of its audience, expected outcome, and prerequisites.
- Content is not maintained twice. Shared fundamentals receive their own reference page and are linked from both areas.

---

# Area 1: User

This area answers: **What can I do with BudgetBuddy, how do I set it up, and how do I operate my own instance?**

## 1. Overview

```text
User/
├── index.md                         # Entry point, audience, and content overview
├── features.md                      # Feature overview and current status
├── requirements.md                  # Supported browsers, resources, and prerequisites
└── glossary.md                      # Terms for users and operators
```

**Content:** A short product description, feature scope, current-version limitations, and basic terminology. Unfinished or planned features are clearly marked as such.

## 2. Getting started

```text
User/getting-started/
├── index.md                         # Recommended path from first visit to first use
├── account.md                       # Account, sign-in, and sign-out
├── first-configuration.md           # Initial settings, categories, and payment methods
└── first-budget.md                  # First budget and first transaction
```

**Content:** Task-oriented guides with prerequisites, numbered steps, and an expected result.

## 3. Using the app

```text
User/using-the-app/
├── index.md
├── dashboard.md                     # Dashboard and key figures
├── transactions.md                  # Managing income and expenses
├── recurring-payments.md            # Recurring payments
├── budgets.md                       # Creating and monitoring budgets
├── categories-and-payment-methods.md
├── filters-and-search.md             # Filters, URL filters, and persisted state
├── attachments.md                   # Receipts and other attachments, when available
└── reports-and-insights.md           # Reports and analysis, when available
```

**Content:** User tasks and UI behavior. No internal module names, database schemas, or implementation details.

## 4. Self-hosting

This section intentionally belongs in the primary area: operators are not necessarily developers, but they still need complete and reliable operating instructions.

```text
User/self-hosting/
├── index.md                         # Deployment options and decision guide
├── prerequisites.md                 # Domain, runtime, resources, and dependencies
├── installation.md                  # Installing a new instance
├── configuration.md                 # Environment variables and configuration
├── reverse-proxy.md                 # Reverse proxy, TLS, and public access
├── storage-and-backups.md            # Persistent storage, backups, and restoration
├── updates.md                        # Version updates and migration notes
└── uninstall.md                      # Complete uninstallation and data deletion
```

**Content:** Copyable, version-specific operating instructions. Each guide should include security and data-loss warnings, required variables, verification commands, and a rollback or recovery procedure.

## 5. Operations and maintenance

```text
User/operations/
├── index.md
├── health-checks.md                  # Availability and basic functional checks
├── logs.md                           # Reading and sharing relevant logs
├── monitoring.md                     # Available metrics and alerts
├── security.md                       # Secure configuration, secrets, and access control
├── privacy-and-data.md               # Data processing, export, and deletion
└── upgrade-checklist.md              # Checklist before and after an update
```

**Content:** Recurring operator tasks. Technical background is explained only as far as necessary for safe operation; links to developer details are allowed.

## 6. Help and troubleshooting

```text
User/support/
├── index.md
├── common-issues.md                  # Common problems and direct solutions
├── login-and-access.md
├── data-and-sync.md
├── self-hosting-troubleshooting.md
├── faq.md
└── getting-help.md                   # Information needed when reporting a problem
```

**Content:** Symptom → possible cause → solution → escalation. Do not tell an operator to “check the code” when a concrete log or configuration step can be provided instead.

---

# Area 2: Developer

This area answers: **How is the project structured, how can I change it safely, and how do I bring a change into production?**

## 1. Overview

```text
Developer/
├── index.md                         # Prerequisites, reading path, and conventions
├── architecture.md                  # System boundaries and dependencies
├── project-structure.md              # Repository structure and responsibilities
└── decisions/                        # Architecture decision records (ADRs), if introduced
```

**Content:** Technical orientation before the first local start. The `project-structure.md` page describes the repository, not the user navigation.

## 2. Development environment

```text
Developer/development/
├── index.md
├── prerequisites.md
├── setup.md                          # Local installation and environment variables
├── run-locally.md                    # Development server and dependent services
├── git-hooks.md
├── database.md                       # Local database and migrations
└── debugging.md
```

**Content:** Reproducible setup, supported versions, local configuration, common development commands, and debugging.

## 3. Architecture

```text
Developer/architecture/
├── index.md
├── system-overview.md                # Web app, backend, services, and data flows
├── authentication.md
├── authorization.md
├── api-boundaries.md
├── events-and-background-work.md
└── error-handling.md
```

**Content:** Responsibilities, data flows, contracts, and important technical decisions. Diagrams should explain boundaries and dependencies rather than duplicate the source code.

## 4. Components and packages

```text
Developer/components-and-packages/
├── index.md
├── api.md
├── db.md
├── types.md
├── utils.md
├── logger.md
├── components.md
├── tables.md
├── filter.md
└── attachments.md
```

**Content:** Public interfaces, responsibilities, dependencies, extension points, and relevant examples. The documentation follows the actual code structure without representing every internal file as a separate page.

## 5. Services and interfaces

```text
Developer/services/
├── index.md
├── backend.md
├── auth-service.md
├── api-keys.md
├── mcp.md
├── api-reference.md
└── contracts.md                      # Shared request, response, and error contracts
```

**Content:** Service boundaries, API contracts, authentication, versioning, error codes, and local integration. User-oriented API usage belongs here only when it requires developer knowledge.

## 6. Data management

```text
Developer/data/
├── index.md
├── data-model.md
├── migrations.md
├── seed-data.md
├── consistency-and-transactions.md
└── backup-restore-internals.md
```

**Content:** Data model, migrations, integrity rules, and technical restore procedures. Application-level export and deletion instructions remain in the User area.

## 7. Quality and automation

```text
Developer/quality-and-automation/
├── index.md
├── testing.md
├── linting-and-formatting.md
├── ci-cd.md
├── release-process.md
└── dependency-management.md
```

**Content:** Test strategy, quality gates, pipelines, releases, dependencies, and checks required before a merge.

## 8. Observability and operations

```text
Developer/observability/
├── index.md
├── open-telemetry.md
├── grafana.md
├── metrics.md
├── logging.md
└── incident-response.md
```

**Content:** Instrumentation, metrics, technical dashboards, and diagnosis. Usable operator instructions are linked but not duplicated.

## 9. Contributions and standards

```text
Developer/contributing/
├── index.md
├── workflow.md
├── coding-guidelines.md
├── documentation-guidelines.md
├── pull-requests.md
├── issue-reporting.md
└── security-reporting.md
```

**Content:** Branching, commit and pull request rules, code and documentation standards, and responsible security reporting.

---

# Rules for the later implementation

## Audience rule

- **User:** describes goals, usage, installation, configuration, and operation from the perspective of someone using or hosting the app.
- **Developer:** describes code, architecture, contracts, local development, tests, and release processes.
- When a page is relevant to both audiences, place the generally usable content in User and link to the technical background in Developer.

## Page template

Each future page should begin with the following metadata:

```yaml
---
title: Descriptive page title
description: One sentence describing the value of the page.
icon: lucide/book-open
status: draft # draft, active, or deprecated
tags: [audience, topic]
---
```

The page should then follow this order:

1. Purpose and audience
2. Prerequisites
3. Guide or technical explanation
4. Verification of the result
5. Troubleshooting or known limitations
6. Further reading

## Writing and linking rules

- Each page covers exactly one recognizable task or one related technical topic.
- Terms and product names are used consistently; new technical terms are explained in the glossary.
- Commands, paths, environment variables, and API names use code formatting.
- Version-sensitive information is labeled with the affected version.
- Internal implementation details do not belong in user guides.
- Every self-hosting guide must make risks involving secrets and persistent data visible.
- Outdated content is not silently retained; mark it as `deprecated` and link to its replacement.
- Links between the two areas are allowed; parallel copies of the same content should be avoided.

# Mapping of existing pages

The existing documentation can initially be classified as follows during the later migration:

| Existing page      | New area                                         | Migration goal                                              |
| ------------------ | ------------------------------------------------ | ----------------------------------------------------------- |
| `index.md`         | User → Overview                                  | Product and feature overview as a user-oriented entry point |
| `deployment.md`    | User → Self-hosting                              | Operator guide; move technical details to Developer         |
| `ci-cd.md`         | Developer → Quality and automation               | Pipeline and release process                                |
| `contributing.md`  | Developer → Contributions and standards          | Contribution and review process                             |
| `services/*`       | Developer → Services and interfaces              | Service and API documentation                               |
| `packages/*`       | Developer → Components and packages              | Package responsibilities and interfaces                     |
| `development/*`    | Developer → Development environment / Components | Local development and technical components                  |
| `monitoring/*`     | Shared                                           | Operator usage in User, implementation in Developer         |
| `apps/*`           | Shared                                           | App usage in User, technical integration in Developer       |
| `documentation.md` | Developer → Contributions and standards          | Documentation maintenance, structure, and tooling           |

This mapping is a migration proposal. It changes neither files nor navigation and serves as the basis for the later, incremental documentation update.
