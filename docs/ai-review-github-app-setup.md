# GitHub App setup for PR-Agent reviews

This guide describes deployment of the Python PR-Agent adapter. A committed pipeline is not a live deployment or an enforced merge gate. Complete the acceptance checklist before making the check mandatory.

## GitHub App

1. Reuse the dedicated review App, or create one in the repository owner's settings. Disable webhooks for this Concourse polling integration. No callback URL or user authorization flow is needed.
2. Grant repository permissions: **Contents: read**, **Pull requests: write**, **Checks: write**. Metadata read is implicit. Install it on the intended repository.
3. Supply `ai-review.appId`, `ai-review.installationId` and `ai-review.appPrivateKey` through the Concourse credential manager. Preserve the PEM newlines in the private key. Never put credentials into Git or task artifacts.
4. The adapter exchanges an App JWT for a short-lived installation token. Only preparation, publication and cleanup receive App credentials; the analysis task does not.

## LiteLLM and Concourse variables

Reuse `litellm.host` for the OpenAI-compatible base URL including `/v1`, and `litellm.apiKey` for a dedicated virtual key. The key is supplied only to analysis. Restrict its model access, budget and rate limits in LiteLLM. Budget exhaustion blocks the check until a successful retry.

Set the nonsecret operator parameters in `ci/vars.yml`:

```yaml
ai-review-settings:
  model: code-review
  contextWindow: 32000
  profileRevision: '1'
```

The context window must match the supported model profile and must never exceed its actual capacity. The model is sent as `openai/code-review`; implicit provider fallbacks are disabled. Increment the profile revision when changing the routing or capabilities behind an unchanged alias so cached reviews are not reused across different profiles.

The adapter omits `temperature` for the configured proxy alias in all PR-Agent model requests, including suggestion scoring. This preserves the LiteLLM model profile defaults and supports reasoning models that reject PR-Agent's default `temperature=0.2`. No reasoning override or model fallback is added.

Supply S3 credentials through the existing variables `s3-ai-review.access_key_id`, `s3-ai-review.access_key_secret`, `s3-ai-review.bucket` and `s3-ai-review.region`. The private bucket stores completed PR-Agent analyses for retry reuse, including negative decisions. Existing Go reports remain untouched and are not accepted as new-format results.

Grant the adapter `s3:GetObject` and `s3:PutObject` for its review prefix. Missing objects must be distinguishable from denied reads; AWS may require prefix-constrained `s3:ListBucket` for this. Restrict access to the bucket because reports can contain code and security findings. Configure expiration according to your retention requirements. SSE-KMS buckets additionally need the selected key's encrypt/decrypt permissions.

## Load and accept the pipeline

1. Merge the reviewed adapter, `.pr_agent.toml` and task definitions into trusted `main`. The image is built locally by the privileged Concourse OCI build task; no registry publication is required. Verify that workers support this build.
2. Load `ci/general.pipeline.yml` with `ci/vars.yml` and credential-manager secrets, then unpause `pull-request-ai-review`. Keep `ai-review/gate` optional during acceptance.
3. Open a small clean PR targeting `main`. Confirm a German summary, accurate head SHA, successful App check and visible coverage.
4. Introduce a clear defect. Confirm a complete, successfully published `changes_required` review sets `ai-review/gate` to `failure` while the Concourse review job succeeds. Valid suggestions must appear as applicable GitHub suggestions. Model judgment is probabilistic, so inspect the result rather than assuming a seeded defect is always detected.
5. Push another commit, and then test a force-push while analysis runs. Confirm another build and check for the current head; old results must not approve it. Verify stale queued builds skip model calls.
6. Intentionally fail the LiteLLM call in the test environment. Confirm the Concourse job fails and the GitHub check grants no success. Available validated partial findings must appear under “Analyse unvollständig” with tool statuses, coverage gaps and diagnostic codes, without an invented overall recommendation. If no findings are available, confirm a readable error summary. Then repair and retry. Also test denied S3 access and publication failure. Completed analyses must be reused without duplicate comments or model calls; partial analyses must not enter the S3 cache. Also check a timeout after one tool finishes: its checkpointed findings should remain available and the check must conclude `timed_out`.
7. Modify `.pr_agent.toml` and add instruction-like PR content. Confirm active configuration comes from the fixed target commit and no PR code is executed by operational tasks.
8. Confirm canceled, missing and in-progress checks grant no merge permission; superseded and canceled runs must post no new comments. Verify a retry after worker interruption closes or replaces the interrupted review appropriately.
9. Only after these checks, require `ai-review/gate` in the `main` ruleset and select the dedicated App as the expected source. Retain existing CI requirements, require branches to be up to date and restrict bypass rights. Confirm an unrelated identity's status cannot satisfy this check.
10. Verify a negative check actually prevents merging and a new commit requires its own successful check.

Existing administrators remain trusted operators. Merge queues and manual override commands require additional implementation. To roll back enforcement, remove only the new required check from the ruleset and pause its job; retain normal CI requirements, App credentials and S3 data.
