import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';

const severities = ['critical', 'high', 'medium', 'low'];
const shaPattern = /^[a-f0-9]{40}$/;
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const escape = text => text.replace(/[&<>@`*_~\[\]()!#|\\]/g, char => `&#${char.charCodeAt(0)};`);

export function evaluateReview(report) {
  const coverage = report?.manifest?.coverage;
  const findings = report?.comments === null && report?.summary?.comments === 0 ? [] : report?.comments;
  if (
    report?.status !== 'complete' ||
    report.manifest?.terminal_state !== 'complete' ||
    !Array.isArray(coverage?.failed) ||
    coverage.failed.length ||
    !Array.isArray(coverage.waived) ||
    coverage.waived.length ||
    report.summary?.budget_exceeded === true ||
    !Array.isArray(findings) ||
    !findings.every(
      finding =>
        finding &&
        typeof finding.path === 'string' &&
        finding.path.length > 0 &&
        typeof finding.content === 'string' &&
        finding.content.trim().length > 0 &&
        severities.includes(finding.severity),
    )
  ) {
    return {status: 'error', findings: []};
  }
  return {status: findings.some(finding => finding.severity === 'critical') ? 'failure' : 'success', findings};
}

export function inlineComment(finding, patch) {
  const {start_line: start, end_line: end, path, existing_code: existing, suggestion_code: replacement} = finding;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start || !patch) return;

  // Anchor the whole range to one visible right-side hunk, not just its final line.
  let line = 0;
  let selected = [];
  for (const row of patch.split('\n')) {
    const header = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(row);
    if (header) {
      line = Number(header[1]);
      selected = [];
    } else if (line && (row.startsWith('+') || row.startsWith(' '))) {
      if (line >= start && line <= end) selected.push(row.slice(1));
      if (line++ === end && selected.length === end - start + 1) {
        let body = `**${finding.severity.toUpperCase()}**: ${escape(finding.content).slice(0, 4000)}`;
        if (
          typeof existing === 'string' &&
          existing.replace(/\r\n/g, '\n').trimEnd() === selected.join('\n').trimEnd() &&
          typeof replacement === 'string' &&
          replacement.length <= 8000
        ) {
          const fence = '`'.repeat(Math.max(3, ...Array.from(replacement.matchAll(/`+/g), match => match[0].length + 1)));
          body += `\n\n${fence}suggestion\n${replacement}\n${fence}`;
        }
        return {path, line: end, side: 'RIGHT', ...(start < end && {start_line: start, start_side: 'RIGHT'}), body};
      }
    }
  }
}

async function publish() {
  const {GH_TOKEN: token, GITHUB_REPOSITORY: repository} = process.env;
  const {commit: head, pr} = await readJson('pull-request/.git/resource/version.json');
  const base = (await readFile('pull-request/.git/resource/base_sha', 'utf8')).trim();
  if (
    !token ||
    !/^[\w.-]+\/[\w.-]+$/.test(repository ?? '') ||
    !/^[1-9]\d*$/.test(String(pr)) ||
    typeof head !== 'string' ||
    !shaPattern.test(head) ||
    !shaPattern.test(base)
  ) {
    throw new Error('Invalid review configuration or PR resource metadata.');
  }

  async function api(path = '', body) {
    const response = await fetch(`https://api.github.com/repos/${repository}/pulls/${pr}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: body && JSON.stringify(body),
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`GitHub request failed (${response.status}).`);
    return response.json();
  }

  async function* pages(path) {
    for (let page = 1; ; page++) {
      const entries = await api(`${path}?per_page=100&page=${page}`);
      if (!Array.isArray(entries)) throw new Error('Unexpected GitHub response.');
      yield* entries;
      if (entries.length < 100) return;
    }
  }

  async function assertCurrent() {
    const current = await api();
    if (current.state !== 'open' || current.head?.sha !== head || current.base?.sha !== base) {
      throw new Error('The reviewed PR head or base has changed.');
    }
  }

  const report = await readJson('review/report.json');
  const {status, findings} = evaluateReview(report);
  if (status === 'error') {
    console.error('OCR review was incomplete, skipped, or invalid.');
    await writeFile('review-status/status.json', JSON.stringify(status));
    return;
  }

  await assertCurrent();
  const paths = new Set(findings.map(finding => finding.path));
  const patches = new Map();
  if (paths.size) {
    for await (const file of pages('/files')) {
      if (paths.has(file.filename)) patches.set(file.filename, file.patch);
      if (patches.size === paths.size) break;
    }
  }

  const comments = [];
  const summary = [];
  for (const finding of findings.toSorted((a, b) => severities.indexOf(a.severity) - severities.indexOf(b.severity))) {
    const comment = inlineComment(finding, patches.get(finding.path));
    if (comment && comments.length < 40) comments.push(comment);
    else {
      const path = escape(finding.path).slice(0, 500);
      const content = escape(finding.content).slice(0, 1000);
      summary.push(`- **${finding.severity.toUpperCase()}** ${path}: ${content}`);
    }
  }

  const body = [
    `### AI review: ${status === 'failure' ? 'Merge blocked' : 'No critical findings'}`,
    `Commit: \`${head}\` | Findings: ${findings.length} (${findings.filter(f => f.severity === 'critical').length} critical)`,
    ...summary.slice(0, 40),
    ...(summary.length > 40 ? [`Additional findings not shown: ${summary.length - 40}.`] : []),
  ].join('\n\n');
  const fingerprint = createHash('sha256').update(JSON.stringify({base, head, body, comments})).digest('hex');
  const marker = `<!-- concourse-ai-review:${fingerprint} -->`;
  let posted = false;
  for await (const existing of pages('/reviews')) {
    if (existing.commit_id === head && existing.body?.endsWith(`\n${marker}`)) {
      posted = true;
      break;
    }
  }
  await assertCurrent();
  if (!posted) {
    await api('/reviews', {commit_id: head, event: 'COMMENT', body: `${body}\n${marker}`, comments});
    await assertCurrent();
  }
  await writeFile('review-status/status.json', JSON.stringify(status));
}

if (import.meta.main) {
  try {
    await publish();
  } catch {
    // Do not leak GitHub responses, model output, or credentials in CI logs.
    console.error('Could not publish the AI review for the current pull request.');
    process.exitCode = 1;
  }
}
