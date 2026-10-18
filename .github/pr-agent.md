# PR-Agent review

PR-Agent reviews pull requests in a dedicated GitHub Actions workflow. This is
independent of the Concourse build and verification pipelines. The workflow uses
a GitHub App installation token for GitHub API access and sends model requests
to the configured LiteLLM endpoint.

## GitHub App setup

Create a GitHub App, install it only on this repository, and grant these
repository permissions:

- Metadata: read-only (GitHub requires this and grants it automatically).
- Contents: read-only.
- Issues: read and write.
- Pull requests: read and write.

The workflow does not need App webhooks, a webhook secret, a client secret, or
write access to repository contents. The installation token is scoped to the
current repository and is revoked when its job ends.

## Actions configuration

Add the following repository secrets under **Settings > Secrets and variables >
Actions > Secrets**:

| Secret                     | Value                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `PR_AGENT_APP_PRIVATE_KEY` | The GitHub App's complete PEM private key.                                                                   |
| `LITELLM_API_KEY`          | A dedicated LiteLLM Virtual Key, restricted to the review model and configured with a budget and rate limit. |

Add the following repository variables under **Settings > Secrets and variables >
Actions > Variables**:

| Variable                 | Value                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `PR_AGENT_APP_CLIENT_ID` | The GitHub App's Client ID.                                                                              |
| `LITELLM_API_BASE`       | The HTTPS OpenAI-compatible API base URL, including `/v1`, for example `https://litellm.example.com/v1`. |
| `LITELLM_MODEL`          | The complete model value expected by PR-Agent and LiteLLM, entered exactly as it should be sent.         |
| `LITELLM_CONTEXT_TOKENS` | The verified context limit for the selected model, in tokens.                                            |

The workflow passes `LITELLM_MODEL` unchanged as both PR-Agent model settings,
without adding or removing a provider prefix. Set the variable to the exact
complete model value expected by your LiteLLM configuration. `OPENAI_KEY` is
populated with the LiteLLM Virtual Key; no OpenAI account key is used. Model
fallbacks are disabled in PR-Agent so model routing remains controlled by
LiteLLM.

## Events and security

The workflow uses `pull_request_target` so repository secrets are available for
fork pull requests. It deliberately does not check out, build, install, test,
or execute pull request code. Pull request content is still untrusted prompt
input, so the LiteLLM key should be limited and budgeted. The workflow runs only
the review command, not PR description generation or code suggestions, and
skips bot senders and draft pull requests.

GitHub plans to enforce its default `pull_request_target` event policy for
affected public repositories starting November 2, 2026. Check the repository's
Actions event policy before enabling this workflow and explicitly allow the
event if GitHub's policy requires it. Keep the no-checkout/no-untrusted-code
execution guarantees when doing so.

The PR-Agent image and GitHub App token action are pinned to immutable digests
or commit SHAs in the workflow. Review those pins deliberately when upgrading.

## Verification

After merging, check a draft, internal, and fork pull request. Confirm that a
review appears under the GitHub App bot identity, that a new commit triggers
only `/review`, and that LiteLLM logs show the expected endpoint, model alias,
and Virtual Key. Persistent comment updates and finding state are not enabled
until their behavior with the App identity has been verified for the pinned
PR-Agent image.
