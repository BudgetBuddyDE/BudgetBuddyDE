import json
import os
import re
import sys
import urllib.request
from pathlib import Path


def fail(message):
    print(message, file=sys.stderr)
    sys.exit(1)


try:
    repository = os.environ['EXPECTED_REPOSITORY']
    base_branch = os.environ['EXPECTED_BASE_BRANCH']
    token = os.environ['GH_TOKEN']
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository):
        fail('Invalid expected repository.')
    if not base_branch or not token:
        fail('Expected base branch and GitHub token are required.')

    metadata = Path('pull-request/.git/resource')
    url = (metadata / 'url').read_text(encoding='utf-8').strip()
    version = json.loads((metadata / 'version.json').read_text(encoding='utf-8'))
    sha = version['commit']
    match = re.fullmatch(r'https://github\.com/([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)/pull/([1-9][0-9]*)', url)
    if not match or match.group(1).lower() != repository.lower():
        fail('Invalid pull request URL or unexpected repository.')
    if str(version['pr']) != match.group(2) or not isinstance(sha, str) or not re.fullmatch(r'[0-9a-fA-F]{40}', sha):
        fail('Invalid pull request head SHA.')

    request = urllib.request.Request(
        f'https://api.github.com/repos/{repository}/pulls/{match.group(2)}',
        headers={
            'Accept': 'application/vnd.github+json',
            'Authorization': f'Bearer {token}',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'concourse-ai-review',
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        pr = json.load(response)
    state = pr['state']
    draft = pr['draft']
    base = pr['base']['ref']
    head_repo = pr['head']['repo']
    head_sha = pr['head']['sha']
    if (state not in ('open', 'closed') or not isinstance(draft, bool)
            or not isinstance(base, str) or not isinstance(head_sha, str)
            or not re.fullmatch(r'[0-9a-fA-F]{40}', head_sha)
            or (head_repo is not None and not isinstance(head_repo.get('full_name'), str))):
        fail('Invalid GitHub pull request response.')
    eligible = (state == 'open' and not draft and base == base_branch and head_repo is not None
                and head_repo['full_name'].lower() == repository.lower()
                and head_sha.lower() == sha.lower())
    if not eligible:
        print('Pull request is stale or excluded; skipping review.')
    Path('review-decision/urls.json').write_text(json.dumps([url] if eligible else []), encoding='utf-8')
except (OSError, ValueError, KeyError, TypeError, AttributeError) as error:
    fail(f'Could not validate pull request: {type(error).__name__}')
