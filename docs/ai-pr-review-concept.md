# AI Code Buddy reviews in Concourse

BudgetBuddyDE consumes the reusable Python PR-Agent adapter from [AI Code Buddy](https://github.com/tklein1801/ai-code-buddy). The Provider owns the runtime, locked dependencies, tests, shared task definitions and GHCR publication. This repository owns `.pr_agent.toml`, service credentials, model settings and explicit release pins.

## Trusted source and runtime

The serial `pull-request-ai-review` job uses `cfcommunity/github-pr-resource:0.26.0`, targeting `main`, with one-minute polling, `version: every`, CI-skip disabled and `integration_tool: checkout`. It runs independently of normal PR verification.

`ai-code-buddy-settings.revision` pins the Provider task-source commit; `.digest` pins the matching public image under `ghcr.io/tklein1801/ai-code-buddy`. A secret-free release task compares the actual source checkout to embedded image metadata before preparation. Both resources are fetched without triggering builds. Provider changes alone never upgrade the Consumer or rerun unchanged PR heads.

The private task-source resource uses a separate read-only Deploy Key. The runtime image needs no registry credentials and is not rebuilt here. Other CI jobs continue loading this repository's task definitions through `ci-source` from `main`.

## Review lifecycle

Preparation verifies the current open PR, head, target and base before constructing immutable diffs and contents from head/base/merge-base revisions. It reads `.pr_agent.toml` only from the fixed target commit and checks S3 for a complete reusable result. PR code is not executed and cannot replace review instructions or operator settings.

Analysis alone receives the LiteLLM key and runs native PR-Agent `review` and `improve` through the registered snapshot provider. It checkpoints private results after each tool. Coverage, structured outputs and suggestions are validated; source exclusion rules are applied once during snapshot creation and listed transparently. Both tools allow at most three chunks, analysis is limited to ten minutes, and the lifecycle to fifteen minutes.

Publication rechecks the snapshot, stores a complete result in S3, updates the App-owned summary and publishes at most fifteen validated inline findings or applicable suggestions. Overflow remains visible in the summary. Stable markers prevent duplicates. Suggestions are never applied automatically.

Failure/error/abort hooks use the shared `finalize` task and available artifacts. Technical failures publish independently valid partial findings under “Analyse unvollständig”, including tool statuses, coverage gaps and fixed diagnostic categories. Missing recommendations are not invented. Partial analyses are never cached. Superseded or aborted runs post no new comments.

## Merge decisions

| Result                           | GitHub `ai-review/gate`   | Concourse   |
| -------------------------------- | ------------------------- | ----------- |
| Complete `no_concerns_found`     | `success`                 | Success     |
| Complete `needs_review`          | `success`, visible notice | Success     |
| Complete `changes_required`      | `failure`                 | Success     |
| Technical or incomplete analysis | `failure`                 | Failure     |
| Timeout                          | `timed_out`               | Failure     |
| Aborted or superseded            | `cancelled`               | No approval |

The exact-head App check enforces merges. A complete blocking recommendation is a valid technical result and exits 0 after publication. Missing, pending and canceled checks do not approve a newer commit. Require the App-bound check alongside existing CI and up-to-date branches after live acceptance.

## Configuration and reuse

BudgetBuddy instructions cover concrete regressions, owner isolation, API contracts, cache invalidation, recurring payments and frontend state. Workspace exclusions remain local in `.pr_agent.toml`; the Provider contains no BudgetBuddy-specific paths. Static model settings stay under `ai-review-settings`, separate from `ai-review` App secrets. The configured LiteLLM alias receives no explicit temperature or fallback; reasoning defaults are managed at the proxy.

S3 retains versioned complete positive and negative analyses under `pr-agent/v1/`. Identity includes repository/PR and immutable revisions, trusted configuration, model profile, Provider implementation and pinned PR-Agent revision. Publication retries reuse analyses without model calls. Increase the model-profile revision after routing changes. Historical Go data is retained and not imported.

## Updates and rollback

Publish and verify the Provider first, then update its commit and image digest together here. Provider CI performs Python checks, image smoke tests and publication; Consumer `npm run test:ci-contracts` verifies integration contracts without Python. Local validation does not prove a deployed pipeline or enforced merge gate.

Later rollback selects a previously accepted commit/digest pair. For this initial extraction, `db13f13c` is the last working Consumer commit with its local runtime. Retain GitHub App, Vault secrets, S3 data and normal CI requirements. Merge queues, automatic changes and manual approval commands remain outside this integration.

See [setup and live acceptance](ai-review-github-app-setup.md), [CI operations](../ci/README.md), and the [central implementation documentation](https://github.com/tklein1801/ai-code-buddy/tree/main/docs).
