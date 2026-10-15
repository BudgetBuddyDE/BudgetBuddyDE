# GitHub App setup for AI review

Status: setup guide for the Go runner. Live acceptance requires your GitHub App, LiteLLM and S3 credentials.

## Create and install the app

1. Create a dedicated GitHub App in the repository owner's settings. Use a descriptive name and your project URL as homepage. Disable webhooks for the initial Concourse-only integration; no callback URL or user authorization is needed.
2. Grant repository permissions: Contents read, Pull requests write, Checks write. Metadata read is implicit. Do not grant Contents write, Administration or Actions write.
3. Install the app only on the BudgetBuddyDE repository.
4. Record the App ID and installation ID; generate a private key. Store the private key in the Concourse credential manager, never in Git, build artifacts or model prompts.
5. The trusted runner exchanges an App JWT for short-lived repository-scoped installation tokens. The initial orchestrator uses a read-only token for discovery and a write token for the review lifecycle. It never includes tokens or the private key in model context. Separate process credentials remain a future hardening step.

## Enforce the gate (after implementation)

1. Publish a test check named `ai-review/gate` from the app so GitHub can select it.
2. Add a ruleset targeting `main`: require PRs, up-to-date branches, existing CI checks and `ai-review/gate`.
3. Select this App as the expected source of the review check, not any source.
4. Require code-owner review and review policy/runner changes with particular care. CODEOWNERS alone does not enforce approval.
5. Restrict bypass permissions. Verify failed, missing, cancelled and stale checks block merging in a test repository first.

Merge queues and webhook-triggered reruns require additional implementation and are not supported yet. App administrators and ruleset administrators remain trusted operators.

## LiteLLM and storage

Use a dedicated LiteLLM virtual API key with allowed models, budget and rate limits. The endpoint and model profile are operator-controlled; PR policy cannot override them. Configure TLS, redact logs and disable retention of raw prompts/code unless explicitly required. Provider-side budgets complement local call/token limits.

Recommended durable storage: a dedicated private AWS S3 bucket. Enable Block Public Access, Bucket Owner Enforced ownership, encryption (SSE-S3 or SSE-KMS), TLS-only access and a lifecycle policy for automatic expiration. Prefer short-lived workload credentials and least-privilege access to the runner's prefix; avoid long-lived AWS access keys where possible.

Store validated reports, run manifests and publication IDs by review identity. Do not retain raw prompts or code snapshots by default. Reports can contain code and sensitive findings, so restrict access and log only metadata. Define retention and version-expiration policies, including for noncurrent versions if bucket versioning is enabled.

S3 is suitable for immutable artifacts and conditional writes, but is not a general distributed lock service. Initially serialize the Concourse review job. Add explicit concurrency coordination before allowing concurrent publishers.

### Minimal bucket permissions

Replace `BUCKET` and restrict the prefix further if the runner serves only one repository:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::BUCKET/reviews/budgetbuddyde/budgetbuddyde/*"
    }
  ]
}
```

The runner does not require object deletion or bucket listing. Missing objects must return `NoSuchKey`; depending on your bucket permissions S3 can instead return `AccessDenied`, which intentionally blocks the review. If needed, grant `s3:ListBucket` constrained by the runner prefix to allow missing-object detection. With SSE-KMS add narrowly scoped `kms:GenerateDataKey` and `kms:Decrypt` access to the selected key. Deny non-TLS access in the bucket policy.

### Live acceptance checklist

1. Merge the reviewed runner and initial policy through a trusted bootstrap. Concourse builds the Dockerfile from `main` and uses the output image directly; no runner registry is required. Populate the Concourse variables without committing secrets. Workers must allow the privileged OCI build task.
2. Confirm a small clean text-only PR produces a summary and a successful App check.
3. Introduce an obvious serious defect. Confirm a blocking finding and, where valid, a directly applicable inline suggestion.
4. Enable the required App-sourced check. Confirm negative and missing checks prevent merge and a status from a different identity cannot satisfy the requirement.
5. Break the LiteLLM key and deny S3 access in the test environment. Confirm no success is granted. Retry after repair and check report reuse and absence of duplicate comments.
6. Push a new head and advance the target branch. Confirm checks bind to the correct head, stale runs fail and reconciliation reevaluates changed identities.
7. Add instruction-like code comments and change `.ai-review` in a PR. Confirm the active policy still comes from the target commit. This tests boundaries, not a guarantee of model judgment.
8. Verify Concourse worker egress, bucket expiration, secret redaction and restricted manual execution. Keep the review job serial; merge queues are not supported.

## Current deployment handoff

- GitHub App registered; credentials provided through `ai-review.appId`, `ai-review.installationId` and `ai-review.appPrivateKey`.
- LiteLLM base URL: `https://ai.tklein.online/v1`, supplied by `litellm.host`; virtual key supplied by `litellm.apiKey`; model alias `code-review`.
- S3 variables: `s3-ai-review.access_key_id`, `s3-ai-review.access_key_secret`, `s3-ai-review.bucket`, `s3-ai-review.region`.
- **Still pending:** enable the required App-sourced `ai-review/gate` check in the `main` ruleset after live acceptance. App registration alone does not block merges.
