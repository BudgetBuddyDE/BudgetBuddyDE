# PR-Agent Concourse adapter

Python 3.12 integration of PR-Agent with immutable PR snapshots, LiteLLM, GitHub App checks and S3 result reuse. It replaces the previous Go review engine. PR-Agent is pinned to `95a3cd0dacfbab14803eacc7cdac68c82d8d0af9`; update the dependency lock and contract tests together when upgrading.

## Development

```sh
cd tools/ai-review
uv sync --locked
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked pytest
```

The root npm checks do not install or test this separate Python project. Concourse runs its own verification task on main and PRs. Build the operational image from trusted main:

```sh
docker build -t budgetbuddy-pr-agent tools/ai-review
```

Concourse uses its OCI build task and unpacked image directly, without pushing an image registry artifact.

## Task interfaces

```sh
python -m ai_review prepare --pr-resource pull-request --output prepared
python -m ai_review analyze --input prepared --output analyzed
python -m ai_review publish --input prepared --result analyzed
python -m ai_review finalize --input prepared --result analyzed --conclusion failure
```

Preparation receives `GITHUB_REPOSITORY`, `TARGET_BRANCH`, `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY`, `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and nonsecret LiteLLM configuration. Analysis receives only `LITELLM_API_KEY` and `LITELLM_BASE_URL`, `LITELLM_MODEL`, `LITELLM_CONTEXT_WINDOW`, `LITELLM_PROFILE_REVISION`. Publication receives the GitHub App and S3 credentials. Cleanup receives the App credentials, a prepared check identity and available analysis artifacts.

Prepared artifacts contain snapshot data and trusted `.pr_agent.toml`, never credentials. They are untrusted code data and must not be executed. The registered snapshot provider supplies native `review` and `improve` with this fixed input and collects their structured outputs locally. Configuration is loaded from the fixed base commit; PR configuration does not override operator settings.

## Gate and retries

Complete `no_concerns_found` and `needs_review` pass the GitHub gate; `changes_required` sets it to `failure`. Every fully published valid review exits 0, including `changes_required`, so the Concourse job succeeds. Invalid results, incomplete required coverage and technical errors fail the task and block the gate. Deleted files retain full review coverage using their old-content diff; suggestions for removed files are explicitly not applicable. All other required files must be covered by both tools. Timeouts and cancellation grant no success. The check is bound to the exact head SHA and state is checked again before publication and success.

Analysis atomically checkpoints private partial results after each tool. On failure, `finalize` publishes individually validated findings and suggestions with an “Analyse unvollständig” summary, tool statuses, coverage gaps and fixed per-tool diagnostic codes. Missing overall recommendations are not inferred. With no usable findings, a readable error summary is published. The analysis task remains failed; the check concludes `failure` or `timed_out`. Partial results are never cached in S3. Superseded or aborted runs post no new comments. Finalization makes no model calls; raw model responses, code and secrets stay out of build logs.

S3 stores completed positive and negative analyses under a versioned identity containing immutable revisions, configuration and PR metadata hashes, model/adapter/upstream versions and a hash of adapter source plus the dependency lock. Retry publication uses that result without model calls; marked comments avoid duplicates. Older Go reports are retained but not imported. Inline suggestions are validated against snapshot ranges and never applied automatically. A summary captures findings beyond the fifteen inline-comment limit.

See [architecture](../../docs/ai-pr-review-concept.md), [GitHub App setup and live acceptance](../../docs/ai-review-github-app-setup.md) and [CI operations](../../ci/README.md). Repository validation alone does not prove a live deployment or merge restriction.
