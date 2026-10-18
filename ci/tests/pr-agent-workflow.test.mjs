import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import test from 'node:test';

import {parse} from 'yaml';

const root = new URL('../../', import.meta.url);
const workflowText = readFileSync(new URL('.github/workflows/pr-agent.yml', root), 'utf8');
const workflow = parse(workflowText);

test('PR-Agent runs isolated, review-only jobs for internal and fork pull requests', () => {
  assert.deepEqual(workflow.on.pull_request_target.types, ['opened', 'reopened', 'ready_for_review', 'synchronize']);
  assert.deepEqual(workflow.permissions, {});
  assert.equal(workflow.jobs.review['timeout-minutes'], 15);
  assert.match(workflow.concurrency.group, /github\.event\.pull_request\.number/);
  assert.equal(workflow.concurrency['cancel-in-progress'], true);
  assert.match(workflow.jobs.review.if, /sender\.type != 'Bot'/);
  assert.match(workflow.jobs.review.if, /pull_request\.draft == false/);

  const steps = workflow.jobs.review.steps;
  assert.equal(
    steps.some(step => step.uses?.startsWith('actions/checkout@')),
    false,
  );
  assert.equal(
    steps.some(step => step.run),
    false,
  );
  assert.equal(steps.length, 2);

  const appToken = steps.find(step => step.id === 'app-token');
  assert.match(appToken.uses, /^actions\/create-github-app-token@[0-9a-f]{40}$/);
  assert.equal(appToken.with['permission-contents'], 'read');
  assert.equal(appToken.with['permission-issues'], 'write');
  assert.equal(appToken.with['permission-pull-requests'], 'write');

  const agent = steps.find(step => step.name === 'Review pull request with PR-Agent');
  assert.match(agent.uses, /^docker:\/\/pragent\/pr-agent@sha256:[0-9a-f]{64}$/);
  assert.equal(agent.env.GITHUB_TOKEN, '${{ steps.app-token.outputs.token }}');
  assert.equal(agent.env.OPENAI_KEY, '${{ secrets.LITELLM_API_KEY }}');
  assert.equal(agent.env.OPENAI__API_BASE, '${{ vars.LITELLM_API_BASE }}');
  assert.equal(agent.env.CONFIG__MODEL, '${{ vars.LITELLM_MODEL }}');
  assert.equal(agent.env.CONFIG__MODEL_WEAK, '${{ vars.LITELLM_MODEL }}');
  assert.equal(agent.env.CONFIG__CUSTOM_MODEL_MAX_TOKENS, '${{ vars.LITELLM_CONTEXT_TOKENS }}');
  assert.equal(agent.env.CONFIG__MAX_MODEL_TOKENS, '${{ vars.LITELLM_CONTEXT_TOKENS }}');
  assert.equal(agent.env.CONFIG__FALLBACK_MODELS, '[]');
  assert.equal(agent.env.CONFIG__RESTRICTED_MODE, 'true');
  assert.equal(agent.env['PR_REVIEWER.PERSISTENT_COMMENT'], 'false');
  assert.equal(agent.env['PR_REVIEWER.PERSISTENT_FINDING_STATE'], 'false');
  assert.equal(agent.env['GITHUB_ACTION_CONFIG.AUTO_REVIEW'], 'true');
  assert.equal(agent.env['GITHUB_ACTION_CONFIG.AUTO_DESCRIBE'], 'false');
  assert.equal(agent.env['GITHUB_ACTION_CONFIG.AUTO_IMPROVE'], 'false');
  assert.equal(agent.env['GITHUB_ACTION_CONFIG.PR_ACTIONS'], '["opened", "reopened", "ready_for_review"]');
  assert.equal(agent.env['GITHUB_ACTION_CONFIG.HANDLE_PUSH_TRIGGER'], 'true');
  assert.equal(agent.env['GITHUB_ACTION_CONFIG.PUSH_COMMANDS'], '["/review"]');
});

test('workflow documentation lists the required secrets and variables', () => {
  const docs = readFileSync(new URL('.github/pr-agent.md', root), 'utf8');

  for (const name of ['PR_AGENT_APP_PRIVATE_KEY', 'LITELLM_API_KEY']) {
    assert.ok(docs.includes(`\`${name}\``), `Missing secret documentation for ${name}`);
  }
  for (const name of ['PR_AGENT_APP_CLIENT_ID', 'LITELLM_API_BASE', 'LITELLM_MODEL', 'LITELLM_CONTEXT_TOKENS']) {
    assert.ok(docs.includes(`\`${name}\``), `Missing variable documentation for ${name}`);
  }
  assert.doesNotMatch(docs, /openai\/<LITELLM_MODEL>/);
  assert.match(docs, /does not check out, build, install, test,\s+or execute pull request code/);
});
