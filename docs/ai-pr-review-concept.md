# PR-Agent reviews in Concourse

PR-Agent replaces the previous Go review engine. Concourse reviews newly opened pull requests targeting `main` and every detected new PR commit. Findings and applicable suggestions are published to GitHub; suggestions are never applied automatically. The App check `ai-review/gate` records the decision for the reviewed head commit.

## Trusted preparation and immutable snapshots

The serial `pull-request-ai-review` job consumes `cfcommunity/github-pr-resource:0.26.0`, the image maintained by [cloudfoundry-community/github-pr-resource](https://github.com/cloudfoundry-community/github-pr-resource). The resource checks every minute, processes every version and ignores `[skip ci]`. Its review checkout uses `integration_tool: checkout` so merge conflicts do not prevent a review.

The operational container and task definitions come from a separate trusted `main` checkout. Concourse builds `tools/ai-review/Dockerfile` with `concourse/oci-build-task` and passes its unpacked image directly to subsequent tasks. No image registry publication is needed. The worker must permit the privileged image build; review tasks are not privileged.

Preparation validates the resource PR number and expected head against the current GitHub PR. Closed PRs, changed target branches and superseded heads do not consume model calls. The adapter fixes the head, base and merge-base revisions, loads `.pr_agent.toml` from that base commit and prepares file contents and diffs from immutable revisions. PR-owned instructions, configuration and executable files cannot configure the operational runner. PR text is review input and must be treated as untrusted content.

## PR-Agent integration and credentials

The Python 3.12 adapter pins upstream PR-Agent to commit `95a3cd0dacfbab14803eacc7cdac68c82d8d0af9`. Updates must pass the adapter contract tests before changing the pin. `SnapshotGitProvider` is registered through PR-Agent's external-provider interface. Native `review` and `improve` perform the model analysis; the provider captures their structured results and publication requests locally. There is no PR-Agent fork or separate custom review prompt engine.

The tasks have separate credentials:

| Task     | Inputs                                         | Credentials              | Output                                                           |
| -------- | ---------------------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| Prepare  | PR resource metadata                           | GitHub App and S3        | Immutable snapshot, configuration and cached result if available |
| Analyze  | Prepared snapshot                              | LiteLLM virtual key only | Structured review, suggestions, coverage and usage               |
| Publish  | Prepared snapshot and analysis                 | GitHub App and S3        | Cached result, GitHub comments and final check                   |
| Finalize | Prepared check identity and available analysis | GitHub App               | Validated partial findings and failed or canceled check          |

The endpoint, model alias, context window and model-profile revision are operator-controlled. The default alias is `code-review`, passed to LiteLLM as `openai/code-review`; fallback models are disabled. `contextWindow: 32000` is the initial conservative setting and must not exceed the real context window exposed by the alias. Increment `profileRevision` whenever routing or model capabilities behind the alias change. A dedicated LiteLLM virtual key limits allowed models, spend and request rates.

Analysis is limited to ten minutes and three chunks per tool; preparation through publication is limited to fifteen minutes, excluding the container build. Internal analysis deadlines allow a structured timeout result before Concourse terminates the task. Deliberate exclusions such as generated content, lockfiles and binary files are reported. Deleted files are still fully reviewed through the compatibility provider's old-content diff; `improve` records them as not applicable because there is no remaining file to replace. All other required files must be covered by both tools. Missing required files, failed chunks and truncated analyses cannot produce a successful gate.

## Cache and publication

S3 stores a versioned result envelope keyed by repository, PR, head/base/merge-base revisions, trusted configuration hash, PR metadata hash, model-profile revision, upstream PR-Agent revision, adapter version and a hash of adapter source plus the dependency lock. Both positive and negative completed analyses are reusable. Publication retries use that result without another model call. Previous Go artifacts remain in storage but are not read as PR-Agent results. No GitHub or S3 credentials appear in prepared snapshots or model context.

A marked summary comment is updated in place. At most fifteen validated inline comments or suggestions are published; additional findings remain in the summary. Stable markers prevent duplicate publication on retries. Inline paths and ranges are checked against the immutable diff before publication. Head, base, target branch and PR state are checked again before publication and before granting success; superseded results cannot approve a newer commit.

| Result                                                                                   | Check conclusion                  |
| ---------------------------------------------------------------------------------------- | --------------------------------- |
| Complete `no_concerns_found`                                                             | `success`                         |
| Complete `needs_review`                                                                  | `success`, with a visible warning |
| `changes_required`                                                                       | `failure`                         |
| Invalid/missing result, incomplete required coverage, provider/storage/publication error | `failure`                         |
| Analysis deadline exceeded                                                               | `timed_out`                       |
| Aborted or superseded run                                                                | `cancelled`                       |

Both tool outputs and their coverage metadata must validate before a complete review can be published. Every fully published valid review exits 0, including `changes_required`: that recommendation fails the GitHub gate while the Concourse job succeeds. Technical failures and incomplete analyses continue to fail the job and check. Publication stores a validated completed analysis before posting comments, so publication retries do not repeat model calls.

Analysis atomically checkpoints private partial results after each tool. Failure/error hooks use `finalize` to publish individually validated findings and suggestions, using the existing stable markers and fifteen-inline limit. The summary is headed “Analyse unvollständig” and includes the checked commit, tool statuses, known coverage gaps and fixed per-tool diagnostic codes. Missing overall recommendations are not inferred. Without usable findings, the summary explains the error. Partial analyses never enter the completed S3 cache and cannot produce a successful check; timeouts conclude `timed_out`.

Diagnostics distinguish missing structured results, invalid recommendations, transport failures and incomplete chunks before overall result validation. Build logs omit raw model responses, code and secrets. Finalization makes no model calls. Superseded and aborted runs post no new comments; abort hooks close their checks as canceled where possible. Worker loss may leave a check in progress, which grants no merge permission; rerun the build after recovery.

## Verification and rollout

Local checks cover upstream provider/result contracts, recommendation mapping, invalid responses, timeouts, coverage, immutable snapshots, invalid inline ranges, cache reuse, model-profile changes, retry idempotence and PR configuration isolation. CI verifies the Python project on main and PRs without operational secrets. Validate the Concourse YAML separately with `fly validate-pipeline --strict`; static validation does not exercise GitHub, S3, LiteLLM or Docker.

Bootstrap the adapter and configuration onto trusted `main`, load the pipeline and initially leave the check optional. Perform the live acceptance in [GitHub App setup](ai-review-github-app-setup.md), including a clean PR, a clear blocker, a new head and a failing LiteLLM request. Only then require the App-sourced `ai-review/gate` in the `main` ruleset alongside existing CI and require an up-to-date branch. Base-only changes are enforced by that up-to-date requirement; this pipeline does not periodically re-review open PRs.

Merge queues, parallel publishers, automatic fixes, label-based overrides and manual approval bot commands are not supported in this first version. Existing App registration, Vault secrets and S3 artifacts are retained.
