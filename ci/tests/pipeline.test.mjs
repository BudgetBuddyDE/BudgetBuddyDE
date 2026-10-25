import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import test from 'node:test';

import {parse} from 'yaml';

const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const general = parse(read('ci/general.pipeline.yml'), {merge: true});
const database = parse(read('ci/database.pipeline.yml'), {merge: true});
const variables = parse(read('ci/vars.yml'));
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

test('ordinary task definitions use the configured ci-source', () => {
  for (const pipeline of [general, database]) {
    const source = pipeline.resources.find(resource => resource.name === 'ci-source');
    assert.equal(source.source.uri, 'git@github.com:((ci.source.owner))/((ci.source.name)).git');
    assert.equal(source.source.branch, '((ci.source.branch))');
    assert.equal(source.source.disable_ci_skip, false);
    for (const job of pipeline.jobs) {
      let usesTask = false;
      const gets = [];
      visit(job, step => {
        if (step.get === 'ci-source') gets.push(step);
        if (step.file) {
          usesTask = true;
          assert.match(step.file, /^ci-source\/ci\/tasks\//);
        }
      });
      if (usesTask) assert.equal(gets.length, 1, `${job.name} must load ci-source`);
      for (const step of gets) assert.notEqual(step.trigger, true);
    }
  }
  assert.equal(
    general.jobs.some(job => /ai-review/i.test(job.name)),
    false,
  );
  assert.equal(
    general.resources.some(resource => /ai-code-buddy/i.test(resource.name)),
    false,
  );
});

test('static configuration resolves declared pipeline variables', () => {
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
