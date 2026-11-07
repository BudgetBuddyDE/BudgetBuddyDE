# Railway Infrastructure as Code

`railway.ts` is a starting point for migrating the former service-level Railway configuration. Railway stops reading
`railway.json` and `railway.toml` on December 1, 2026. Committing this file does not change a Railway environment:
the Railway CLI must apply it separately to each environment. CI does not apply it automatically.

The `webapp`, `backend`, and `website` names are placeholders. The file only describes settings previously kept in
this repository, not a complete Railway project. Do not apply it unchanged to an existing environment: a whole-project
plan can delete omitted resources or variables. Keep secrets in Railway, not in this repository.

## Migration for operators

1. Install the current [Railway CLI](https://docs.railway.com/cli), run `pnpm install --frozen-lockfile`, and link
   the intended project and environment with `railway login` and `railway link`.
2. Back up the current configuration and inspect `railway config migrate` as a preview. Use
   `railway config pull` to import the target environment into a separate working copy; this writes the local IaC file.
   Do not pass `--include-variables`, which can write unsealed secrets to disk. Compare actual service names, sources,
   root directories, domains, variables, databases, volumes, buckets and all other resources against the starting file.
   Merge the former build and deployment settings into the imported configuration and retain all required resources.
3. Coordinate the cutover with the repository deployment. Follow Railway's
   [migration instructions](https://docs.railway.com/infrastructure-as-code#migrating-from-config-as-code): legacy
   configuration and IaC cannot manage the same service simultaneously. Clear any custom Railway Config File paths
   as part of that transition. `railway config migrate --apply` changes Railway settings; it is not a preview.
4. Run `railway config plan` against the intended environment and review every change. Stop if it proposes unexpected
   service, variable, domain, volume or bucket deletions, or unrelated changes. After resolving discrepancies, apply
   the reviewed plan with `railway config apply`, then run a fresh plan to check for drift.
5. Trigger a deployment and verify builds, startup, healthchecks and application access. Repeat the import, comparison,
   plan, apply and deployment verification for each environment and update any separately maintained Railway template.

Keep the prior deployment and settings available for rollback. A successful repository check cannot validate the live
project, its variables or its deployment behavior.
