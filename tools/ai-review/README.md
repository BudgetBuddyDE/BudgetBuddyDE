# AI review runner

Standalone Go module, outside npm workspaces. Requires Go 1.25 or later.

## Commands

```sh
go run ./cmd/ai-review config validate ../../.ai-review
go run ./cmd/ai-review evaluate ../../.ai-review report.json
go run ./cmd/ai-review run
go run ./cmd/ai-review reconcile
go test -race ./...
go vet ./...
go build ./...
```

`evaluate` is a local policy diagnostic, not an authenticated code-safety attestation. `run` performs snapshot verification, analysis, S3 reuse and GitHub publication. `reconcile` scans open PRs against the configured base branch and runs reviews serially; it also catches target-branch changes. Run only one instance per repository, including manual invocations.

## Environment

| Variable                 | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `REVIEW_REPOSITORY`      | `owner/repo`                                                |
| `REVIEW_BASE_BRANCH`     | Allowed target branch, e.g. `main`                          |
| `REVIEW_PR`              | PR number (`run` only)                                      |
| `REVIEW_HEAD_SHA`        | Exact expected SHA (`run` only)                             |
| `GITHUB_APP_ID`          | Numeric App ID                                              |
| `GITHUB_INSTALLATION_ID` | Numeric installation ID                                     |
| `GITHUB_APP_PRIVATE_KEY` | PEM RSA key from the credential manager                     |
| `LITELLM_BASE_URL`       | HTTPS OpenAI-compatible base URL, including `/v1` if needed |
| `LITELLM_API_KEY`        | Dedicated virtual key                                       |
| `LITELLM_MODEL`          | Operator-approved model alias                               |
| `REVIEW_MAX_CALLS`       | Optional hard call limit, default 20, maximum 100           |
| `REVIEW_S3_BUCKET`       | Private durable report bucket                               |
| `AWS_REGION`             | Bucket region                                               |

AWS credentials use the SDK default credential chain, including workload roles, web identity, or environment credentials. LiteLLM must support JSON object response format and `max_tokens`. The runner does not set `temperature` or `reasoning_effort`, preserving model/provider defaults and compatibility with reasoning models. Configure model access, provider-side budgets and rate limits on the virtual key. No automatic model retries are performed.

## Behavior and boundaries

- Loads `.ai-review` from the exact target-branch SHA, never PR instructions. Git tree modes reject symlinks/submodules before the Contents API can dereference them.
- Path scopes support `**`, exact paths and directory prefixes ending in `/**`; unsupported syntax fails validation.
- Fetches full changed text files and patches at immutable references. Deleted files use merge-base content. No PR code or Git hooks execute.
- One model call per changed file, with all applicable criteria. Source is serialized as untrusted user data; only policy documents become instructions.
- Limits: 100 files, 128 KiB per file, 2 MiB total source/patch input, 180 KiB per model input, 8,192 maximum output tokens per call, at most 10 minutes analysis / 15 minutes per PR. Unsupported files, absent/truncated patches and exceeded limits block rather than silently skip.
- Exact source evidence and locations are revalidated, including cached reports. Only changed-line ranges receive inline comments. Other findings remain in the summary and affect the gate.
- Immutable S3 reports use conditional writes under `reviews/<owner>/<repo>/<pr>/<identity>.json`. Identity includes SHAs, policy, runner, endpoint and model. Retrying the same completed identity does not ask the model again. Do not grant untrusted actors write access to this prefix.
- Summary is updated only for the verified App bot. Inline fingerprints prevent duplicates. Publication errors do not grant success. Findings beyond the inline cap still affect policy.
- Required check is `ai-review/gate`. A negative review exits nonzero after publishing a failure. Provider/storage/validation errors also fail the check. Abrupt container termination can leave a pending check, which blocks until the next reconciliation.

## Deployment

Concourse builds this directory's Dockerfile from trusted `main` using the OCI build task and supplies its unpacked image directly to the review task. You do not need to publish a runner image or commit a binary image archive. The worker must support privileged image builds; the review task itself is not privileged. See `ci/README.md` for Vault variable mappings. Never build the operational runner from the PR being reviewed. The initial `.ai-review` policy must be merged through a maintainer-controlled bootstrap before making the check required.

The initial version deliberately uses a single trusted orchestrator process. Credentials are never put in model context, but prepare/analyze/publish are not separate OS security domains. Use dedicated isolated Concourse workers and network egress restrictions; process-separated credentials are a future hardening step. There are no model tools, shell commands or automatic suggestion commits.

Not implemented: merge queues, cross-file import traversal, distributed publisher locking, provider streaming, arbitrary glob syntax and hosted webhook reruns. PRs with unsupported contents fail closed. Prompt injection can still affect model judgment; this does not replace tests or human review. Local tests do not establish real GitHub ruleset enforcement; run the setup acceptance checks before production activation.

See `docs/ai-pr-review-concept.md` and `docs/ai-review-github-app-setup.md` at repository root.
