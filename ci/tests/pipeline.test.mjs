import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {URL} from 'node:url';
import test from 'node:test';

import {parse} from 'yaml';

const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const general = parse(read('ci/general.pipeline.yml'), {merge: true});
const database = parse(read('ci/database.pipeline.yml'), {merge: true});
const variables = parse(read('ci/vars.yml'));
const review = general.jobs.find(job => job.name === 'pull-request-ai-review');
const app = ['GITHUB_REPOSITORY', 'GITHUB_APP_ID', 'GITHUB_INSTALLATION_ID', 'GITHUB_APP_PRIVATE_KEY'];
const store = ['S3_BUCKET', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
const model = ['LITELLM_BASE_URL', 'LITELLM_MODEL', 'LITELLM_CONTEXT_WINDOW', 'LITELLM_PROFILE_REVISION'];
const keys = value => Object.keys(value).sort();

function visit(step, callback) {
  callback(step);
  for (const field of ['plan', 'do', 'in_parallel', 'aggregate']) {
    const nested = step[field];
    for (const child of Array.isArray(nested) ? nested : nested?.steps || []) visit(child, callback);
  }
  for (const field of ['on_success', 'on_failure', 'on_error', 'on_abort', 'ensure', 'try']) {
    if (step[field]) visit(step[field], callback);
  }
}

test('provider tasks and image are explicitly pinned to a release', () => {
  const {revision, digest} = variables['ai-code-buddy-settings'];
  assert.match(revision, /^[a-f0-9]{40}$/);
  assert.notEqual(revision, '0'.repeat(40));
  assert.match(digest, /^sha256:[a-f0-9]{64}$/);
  assert.notEqual(digest, `sha256:${'0'.repeat(64)}`);
  const source = general.resources.find(resource => resource.name === 'ai-code-buddy-source');
  const image = general.resources.find(resource => resource.name === 'ai-code-buddy-image');
  assert.equal(source.source.uri, 'git@github.com:tklein1801/ai-code-buddy.git');
  assert.equal(source.source.private_key, '((github.private_key))');
  assert.deepEqual(source.version, {ref: '((ai-code-buddy-settings.revision))'});
  assert.equal(image.source.repository, 'ghcr.io/tklein1801/ai-code-buddy');
  assert.equal(image.source.tag, 'latest');
  assert.deepEqual(image.version, {digest: '((ai-code-buddy-settings.digest))'});
  assert.equal(image.source.username, undefined);
  assert.equal(image.source.password, undefined);
  const gets = review.plan[0].in_parallel;
  assert.deepEqual(gets.map(step => step.get).sort(), ['ai-code-buddy-image', 'ai-code-buddy-source', 'pull-request']);
  for (const step of gets.filter(step => step.get !== 'pull-request')) assert.notEqual(step.trigger, true);
  const check = review.plan[1];
  assert.equal(check.file, 'ai-code-buddy-source/ci/tasks/verify-ai-code-buddy-release.task.yml');
  assert.equal(check.image, 'ai-code-buddy-image');
  assert.equal(check.params, undefined);
});

test('review runs for every PR version with conflict-compatible checkout', () => {
  const type = general.resource_types.find(resource => resource.name === 'github-pr');
  assert.deepEqual(type.source, {repository: 'cfcommunity/github-pr-resource', tag: '0.26.0'});
  const resource = general.resources.find(resource => resource.type === 'github-pr');
  assert.equal(resource.check_every, '1m');
  assert.equal(resource.source.base_branch, '((repo.pr.branch))');
  assert.equal(resource.source.disable_ci_skip, true);
  assert.equal(review.serial, true);
  const pr = review.plan[0].in_parallel.find(step => step.get === 'pull-request');
  assert.equal(pr.trigger, true);
  assert.equal(pr.version, 'every');
  assert.equal(pr.params.integration_tool, 'checkout');
});

test('lifecycle and hooks use the same external task release and separate credentials', () => {
  const lifecycle = review.plan[2];
  assert.equal(lifecycle.timeout, '15m');
  const [prepare, analyze, publish] = lifecycle.do;
  assert.deepEqual(keys(prepare.params), [...app, ...store, ...model, 'TARGET_BRANCH'].sort());
  assert.deepEqual(keys(analyze.params), [...model, 'LITELLM_API_KEY'].sort());
  assert.deepEqual(keys(publish.params), [...app, ...store].sort());
  assert.equal(analyze.timeout, '10m');
  for (const [name, step] of [
    ['prepare', prepare],
    ['analyze', analyze],
    ['publish', publish],
  ]) {
    assert.equal(step.file, `ai-code-buddy-source/ci/tasks/${name}-ai-review.task.yml`);
    assert.equal(step.image, 'ai-code-buddy-image');
  }
  for (const name of ['on_failure', 'on_error', 'on_abort']) {
    const hook = lifecycle[name];
    assert.equal(hook.image, 'ai-code-buddy-image');
    assert.equal(hook.file, 'ai-code-buddy-source/ci/tasks/finalize-ai-review.task.yml');
    assert.deepEqual(keys(hook.params), [...app, 'REVIEW_CONCLUSION'].sort());
    assert.equal(hook.params.REVIEW_CONCLUSION, name === 'on_abort' ? 'cancelled' : 'failure');
  }
  visit(review, step => assert.notEqual(step.privileged, true));
});

test('ordinary task definitions still use ci-source from main', () => {
  for (const pipeline of [general, database]) {
    const source = pipeline.resources.find(resource => resource.name === 'ci-source');
    assert.equal(source.source.branch, 'main');
    assert.equal(source.source.disable_ci_skip, false);
    for (const job of pipeline.jobs.filter(job => job.name !== review.name)) {
      let usesTask = false;
      const gets = [];
      visit(job, step => {
        if (step.get === 'ci-source') gets.push(step);
        if (step.file) {
          usesTask = true;
          assert.match(step.file, /^ci-source\/ci\/tasks\//);
        }
        assert.notEqual(step.task, 'verify-ai-review');
      });
      if (usesTask) assert.equal(gets.length, 1, `${job.name} must load ci-source`);
      for (const step of gets) assert.notEqual(step.trigger, true);
    }
  }
  assert.equal(existsSync(new URL('tools/ai-review/pyproject.toml', root)), false);
  for (const name of ['prepare', 'analyze', 'publish', 'finalize', 'verify']) {
    assert.equal(existsSync(new URL(`ci/tasks/${name}-ai-review.task.yml`, root)), false);
  }
});

test('static configuration never shadows secret namespaces', () => {
  for (const name of ['ai-review', 'ai-code-buddy-source', 'litellm', 's3-ai-review', 'github']) {
    assert.equal(Object.hasOwn(variables, name), false);
  }
  assert.deepEqual(keys(variables['ai-review-settings']), ['contextWindow', 'model', 'profileRevision']);
  for (const path of ['ci/general.pipeline.yml', 'ci/database.pipeline.yml']) {
    for (const [, namespace, field] of read(path).matchAll(/\(\(([^():.\s]+)\.([^()\s]+)\)\)/g)) {
      if (!Object.hasOwn(variables, namespace)) continue;
      let value = variables[namespace];
      for (const part of field.split('.')) {
        assert.ok(Object.hasOwn(value, part), `Unresolved static variable ${namespace}.${field}`);
        value = value[part];
      }
    }
  }
});
