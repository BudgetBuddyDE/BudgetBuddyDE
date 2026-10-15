# Go-based AI Pull Request Review

## Goal

Add an extensible AI review to the Concourse pull-request pipeline without depending on GitHub Copilot. The review checks repository-defined criteria, accepts an optional custom prompt, publishes actionable inline feedback and a summary, and blocks merging when the review is negative or incomplete.

This is a design document only. It does not implement the runner or change the pipeline.

## Recommendation

Build a dedicated Go review runner, executed as a container task in Concourse. PR-Agent was a useful reference for the workflow, but it is Python-based and does not meet the Go requirement. The Go runner should be modular and own its GitHub publishing and policy evaluation.

The model reports findings; deterministic Go code evaluates the merge gate. The model must never be trusted to approve a PR or decide whether its own findings are blocking.

## Architecture

Use one Go binary with subcommands and run stages with separate permissions:

```text
prepare -> analyze -> evaluate -> publish
```

- `prepare`: fetch PR metadata, diff and required context; load trusted policy.
- `analyze`: call the configured LLM provider and produce structured findings.
- `evaluate`: validate output, completeness, locations and gate policy.
- `publish`: create/update review comments and report the final GitHub Check.

The model receives no GitHub credentials, shell, MCP tools or Concourse secrets. The publisher is the only stage that receives GitHub write access.

## Repository policy

Suggested structure:

```text
.ai-review/
  config.yaml
  instructions.md
  custom-prompt.md
  criteria/
    correctness.md
    security.md
    backend.md
    frontend.md
    database.md
```

`config.yaml` declares criteria, path scopes, severity thresholds, resource limits, and publishing settings. `instructions.md` defines the common review expectations. `custom-prompt.md` is optional. Criterion files contain focused domain-specific checks.

Example configuration (proposed schema):

```yaml
version: 1

review:
  language: de
  instructions: instructions.md
  customPrompt: custom-prompt.md

criteria:
  - id: correctness
    instructions: criteria/correctness.md
    paths: ['**']
    blockingFrom: high
  - id: owner-isolation
    instructions: criteria/security.md
    paths: ['services/backend/**', 'packages/db/**']
    blockingFrom: high
  - id: api-contracts
    instructions: criteria/backend.md
    paths: ['services/backend/**', 'packages/api/**']
    blockingFrom: high
  - id: frontend-behavior
    instructions: criteria/frontend.md
    paths: ['apps/webapp/**']
    blockingFrom: high

gate:
  onIncomplete: block
  onProviderError: block
  onInvalidResult: block

limits:
  timeout: 10m
  maxModelCalls: 20

publishing:
  maxInlineComments: 15
  suggestions: true
  updateSummary: true
```

The operator-controlled Concourse configuration owns provider credentials, allowed endpoints/model profiles, GitHub identity and hard cost limits. Repository configuration can choose among allowed profiles and tighten policy, but cannot set arbitrary endpoints, credentials or executable hooks.

Load review policy and prompts only from a pinned, maintainer-controlled target-branch commit, never from the PR head being reviewed. Treat PR changes to policy files as ordinary code changes, not as active policy for that PR. Protect policy files with CODEOWNERS and required human review. Apply the same rule to `AGENTS.md` if it is included as policy context.

## Prompt-injection and trust boundaries

Prompt injection cannot be guaranteed away at the language-model level. The design limits its impact by ensuring PR content cannot obtain permissions, change policy or trigger actions.

- Treat source code, comments, filenames, docs, PR title/body, discussions, and all model output as untrusted data.
- Do not include PR discussions in the first release. If title/body are later included, label and isolate them as untrusted context.
- Do not give the model shell, browser, MCP, arbitrary file access, secrets or GitHub credentials.
- The runner fetches context itself. If read tools are later introduced, restrict them to an immutable snapshot and validate paths, ranges, sizes and call budgets in Go.
- Do not execute code, configuration or hooks from the PR.
- Validate model output against a strict schema and allowlists. Verify criterion IDs, severity, file paths, line ranges and quoted evidence against the reviewed snapshot.
- Render comments from controlled templates. Bound and safely format model text; disallow arbitrary HTML, external images and unchecked links. Validate GitHub suggestion ranges and never apply suggestions automatically.
- Injection detectors may flag suspicious content but are not a security boundary. A second LLM is not a guarantee either.
- Pin the runner image, use resource/network limits, and restrict network egress to required services.

The policy loader, authorization and action logic remain ordinary trusted Go code; model output never controls them.

## Findings and merge gate

Each finding should have a stable criterion ID, severity, file and line range, title, explanation, evidence, and optional replacement suggestion. The model does not return an authoritative `approved` boolean.

| Severity   | Meaning                                                                 | Default gate  |
| ---------- | ----------------------------------------------------------------------- | ------------- |
| `critical` | Severe security issue or major data-loss risk                           | Block         |
| `high`     | Concrete functional defect, authorization failure or serious regression | Block         |
| `medium`   | Bounded issue or relevant edge case                                     | Informational |
| `low`      | Minor improvement                                                       | Informational |

The Go policy evaluator blocks on any configured blocking finding. It also blocks on provider errors, malformed output and incomplete planned analysis. A limit on inline comments affects presentation only: hidden or omitted findings must still appear in the report and affect the gate. Confidence scores from the model are not approval criteria.

“Complete” means all analysis units planned by the runner finished successfully; it does not mean the model found every possible defect. AI review supplements, rather than replaces, deterministic CI and human review.

| Outcome                            | Check conclusion        | Merge                          |
| ---------------------------------- | ----------------------- | ------------------------------ |
| Complete; no blocking findings     | `success`               | Allowed by this gate           |
| Blocking finding                   | `failure`               | Blocked                        |
| Invalid or incomplete result       | `failure`               | Blocked                        |
| Provider error or budget exhausted | `failure` / `timed_out` | Blocked                        |
| Cancelled or stale run             | `cancelled`             | No approval for current commit |

Do not use `neutral` or `skipped` as fallback conclusions for this required check, because GitHub may treat them as passing.

## GitHub integration and required protection

Create a dedicated GitHub App with minimum permissions:

- `Contents: read`
- `Pull requests: write`
- `Checks: write`
- No repository-content write permission.

The runner publishes a check with a stable name such as `ai-review/gate`. Configure the `main` branch ruleset to require that check and select the dedicated GitHub App as its expected source. Keep the existing CI checks required too; restrict bypass permissions and require changes to go through PRs.

A failed Concourse job or a negative PR comment alone does not prevent merging. The required GitHub check is the enforcement mechanism. Repository administrators who can change rulesets or trusted runner configuration remain outside the PR-level security boundary.

## Snapshot, freshness and idempotency

Identify each run by repository, PR number, head SHA, base SHA, policy hash and runner version. Build an immutable snapshot containing the PR head, target-branch revision, merge-base diff and explicitly selected context.

The existing GitHub PR resource performs a merge checkout by default; do not use that checkout uncritically for PR diff line positions. Before publishing, re-check the PR head. If the PR changed, do not publish stale findings as current. Bind the check to the exact reviewed commit.

- Update a single summary comment per PR using a bot marker.
- Fingerprint findings to avoid duplicate inline comments.
- Reuse completed results for technical retries of the same run identity.
- Serialize concurrent runs for the same identity.
- Never retry model calls until a favorable answer appears.
- Require the PR branch to be current with `main` initially; target-branch changes must also trigger reevaluation.
- Treat merge-queue temporary SHAs as a later feature requiring explicit support.

## Review presentation

Generate a deterministic summary from the validated report: gate result, exact reviewed SHA, policy version, finding counts, blocking findings and analysis coverage. An optional AI-written change overview may supplement it but must not determine counts or gate status.

Inline comments should include severity, criterion ID, concrete impact and an optional GitHub `suggestion` block. Only publish inline locations that match the reviewed diff and current commit. Put findings without valid inline locations in the summary; they still affect the gate. Suggestions are proposals only and are never committed automatically.

## Go project layout

Suggested standalone module, outside npm workspaces:

```text
tools/ai-review/
  go.mod
  go.sum
  cmd/ai-review/
  internal/
    config/
    snapshot/
    diff/
    context/
    provider/
    reviewer/
    validation/
    policy/
    reporting/
    github/
  testdata/
  Dockerfile
```

Core extension points: `ModelProvider`, `Analyzer`, `ContextResolver`, `PolicyEvaluator` and `Publisher`. Keep the first release statically composed; a dynamic plugin system adds attack surface and maintenance overhead without immediate benefit.

## Concourse integration

Add a `pull-request-ai-review` job parallel to the existing PR verification job. The review task definition and executable must come from trusted pipeline configuration or a pinned image, not from the PR checkout. This is a security-sensitive distinction from the current verification task, which is loaded from the PR input.

Execution sequence:

1. Detect PR version and create/update the check as `in_progress`.
2. Resolve trusted policy and create the immutable snapshot.
3. Analyze with fixed timeout, token/call and cost budgets.
4. Validate results and compute the gate.
5. Publish summary/inline comments.
6. Complete the check; only report success after successful publication.

An interrupted run must never create a success result. The required check remains pending until resolved; failure handlers should report an explicit failure when possible.

## Delivery stages and acceptance criteria

1. **Trusted Go core:** CLI, config schema, snapshot/diff mapping, GitHub App and required check. Initially test with fixed findings. Verify on GitHub that a failed, absent or stale check prevents merge.
2. **LLM analysis:** One provider, criteria/custom prompt, strict structured output, completeness tracking and bounded costs. Verify provider errors, malformed responses and incomplete analysis cannot pass.
3. **Publishing/retries:** Inline suggestions, updated summary, fingerprints and safe retries. Verify pushes, force-pushes and retries do not misattribute comments or produce stale approvals.
4. **Adversarial tests:** Malicious code comments, PR descriptions, prompt-file changes, paths, and model outputs; also renamed/deleted files, diff mapping, API errors and concurrent runs. Verify PR content cannot control policy, network targets, credentials or publisher actions. Measure remaining model-quality risk with a fixed review corpus.

## Repository-specific initial criteria

- Correctness, edge cases and error handling.
- Owner isolation and authorization across REST and MCP.
- Data integrity, transactions, recurring payments and idempotency.
- API/Zod contracts, `TResult` conventions and cache invalidation.
- Frontend state refresh, intent navigation and relevant test coverage.

## References

- [GitHub required status checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [Building CI checks with a GitHub App](https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/building-ci-checks-with-a-github-app)
- [GitHub pull request reviews API](https://docs.github.com/en/rest/pulls/reviews#create-a-review-for-a-pull-request)
- [OWASP LLM Prompt Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)
