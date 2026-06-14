# Projektstruktur und Monorepo-Konventionen

## Root

Der Root enthält die zentrale npm Workspace- und Turborepo-Konfiguration:

- `package.json`: Workspaces, Root-Scripts und gemeinsame Dev-Dependencies
- `package-lock.json`: einziger Lockfile des Monorepos
- `turbo.json`: globale Task-Pipeline
- `.github/workflows/ci.yml`: CI für Formatting, Linting, Typecheck, Tests und Build
- `.github/workflows/publish-packages.yml`: Publish-Pipeline für öffentliche Packages

## Workspaces

```text
apps/       Benutzeroberflächen, z. B. Next.js Webapp
services/   deploybare Backend-Services
packages/   wiederverwendbare interne und öffentliche Libraries
```

Alle drei Bereiche sind npm Workspaces. Ein lokales Package darf von Apps, Services oder anderen Packages über den Package-Namen importiert werden, z. B. `@budgetbuddyde/types`.

## Öffentliche Packages

Nur diese Packages bleiben für externe Entwickler publishbar:

- `@budgetbuddyde/api`
- `@budgetbuddyde/db`
- `@budgetbuddyde/types`

Alle anderen Packages unter `packages/*` sind lokale Monorepo-Bausteine und sind mit `private: true` markiert.

## Turborepo Pipeline

Die Root-Pipeline nutzt `dependsOn: ["^build"]` für build-relevante Tasks. Dadurch baut Turborepo zuerst abhängige Packages, bevor eine App oder ein Service gebaut, getestet, gelintet oder typegecheckt wird.

Relevante Outputs:

- Packages: `lib/**`
- Services: `build/**`
- Next.js Webapp: `.next/**` ohne `.next/cache/**`

## Lockfile-Regel

Es gibt nur einen Lockfile im Root. Package-spezifische Lockfiles dürfen nicht angelegt werden, weil sie die Workspace-Auflösung und reproduzierbare CI-Installationen erschweren.
