import io
import json
import os
import runpy
import tempfile
import tomllib
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'prepare-ai-review.py'
PR_AGENT_CONFIG = SCRIPT.parents[2] / '.pr_agent.toml'
SHA = 'a' * 40
OTHER_SHA = 'b' * 40
REPOSITORY = 'example/budget'
URL = f'https://github.com/{REPOSITORY}/pull/42'


class PrepareAiReviewTests(unittest.TestCase):
    def setUp(self):
        self.directory = Path(self.enterContext(tempfile.TemporaryDirectory()))
        self.metadata = self.directory / 'pull-request/.git/resource'
        self.metadata.mkdir(parents=True)
        self.decision = self.directory / 'review-decision/urls.json'
        self.decision.parent.mkdir()
        (self.metadata / 'url').write_text(URL, encoding='utf-8')
        self.write_version(pr='42', commit=SHA)

        self.addCleanup(os.chdir, Path.cwd())
        os.chdir(self.directory)
        self.enterContext(patch.dict(os.environ, {
            'EXPECTED_REPOSITORY': REPOSITORY,
            'EXPECTED_BASE_BRANCH': 'main',
            'GH_TOKEN': 'test-token',
        }))
        self.urlopen = self.enterContext(patch('urllib.request.urlopen'))
        self.stderr = self.enterContext(redirect_stderr(io.StringIO()))
        self.enterContext(redirect_stdout(io.StringIO()))

    def write_version(self, **version):
        (self.metadata / 'version.json').write_text(json.dumps(version), encoding='utf-8')

    def run_prepare(self, **response):
        pr = {
            'state': 'open',
            'draft': False,
            'base': {'ref': 'main'},
            'head': {'repo': {'full_name': REPOSITORY}, 'sha': SHA},
            **response,
        }
        self.urlopen.return_value = io.BytesIO(json.dumps(pr).encode('utf-8'))
        runpy.run_path(str(SCRIPT), run_name='__main__')

    def assert_decision(self, urls):
        self.assertEqual(json.loads(self.decision.read_text(encoding='utf-8')), urls)

    def assert_skips(self, **response):
        self.run_prepare(**response)
        self.assert_decision([])

    def assert_fails_closed(self, message, **response):
        with self.assertRaises(SystemExit) as error:
            self.run_prepare(**response)
        self.assertEqual(error.exception.code, 1)
        self.assertIn(message, self.stderr.getvalue())
        if self.decision.exists():
            self.assert_decision([])

    def test_selects_internal_pr_using_selected_version_not_resource_head_sha(self):
        (self.metadata / 'head_sha').write_text(OTHER_SHA, encoding='utf-8')
        self.run_prepare()
        self.urlopen.assert_called_once()
        request, = self.urlopen.call_args.args
        self.assertEqual(request.full_url, f'https://api.github.com/repos/{REPOSITORY}/pulls/42')
        self.assertEqual(request.get_header('Authorization'), 'Bearer test-token')
        self.assertEqual(self.urlopen.call_args.kwargs['timeout'], 30)
        self.assert_decision([URL])

    def test_skips_draft_pr(self):
        self.assert_skips(draft=True)

    def test_skips_fork_pr(self):
        self.assert_skips(head={'repo': {'full_name': 'other/budget'}, 'sha': SHA})

    def test_skips_deleted_head_repository(self):
        self.assert_skips(head={'repo': None, 'sha': SHA})

    def test_skips_stale_version(self):
        self.assert_skips(head={'repo': {'full_name': REPOSITORY}, 'sha': OTHER_SHA})

    def test_recheck_excludes_pr_updated_after_review(self):
        self.run_prepare()
        self.assert_decision([URL])
        self.run_prepare(head={'repo': {'full_name': REPOSITORY}, 'sha': OTHER_SHA})
        self.assert_decision([])
        self.assertEqual(self.urlopen.call_count, 2)

    def test_skips_closed_pr(self):
        self.assert_skips(state='closed')

    def test_skips_wrong_base(self):
        self.assert_skips(base={'ref': 'develop'})

    def test_fails_closed_on_api_error(self):
        self.urlopen.side_effect = OSError('simulated failure')
        self.assert_fails_closed('Could not validate pull request')

    def test_fails_closed_on_invalid_api_response(self):
        self.assert_fails_closed('Invalid GitHub pull request response', draft='false')

    def test_rejects_invalid_pr_url_before_request(self):
        (self.metadata / 'url').write_text(
            'https://github.com.evil.test/example/budget/pull/42', encoding='utf-8',
        )
        self.assert_fails_closed('Invalid pull request URL')
        self.urlopen.assert_not_called()

    def test_rejects_invalid_selected_version_before_request(self):
        self.write_version(pr='42', commit='invalid')
        self.assert_fails_closed('Invalid pull request head SHA')
        self.urlopen.assert_not_called()


class PrAgentConfigTests(unittest.TestCase):
    def test_defines_positive_model_input_token_limit(self):
        with PR_AGENT_CONFIG.open('rb') as config_file:
            limit = tomllib.load(config_file)['config']['custom_model_max_tokens']
        self.assertIs(type(limit), int)
        self.assertGreater(limit, 0)

    def test_enables_committable_suggestions_for_problems(self):
        with PR_AGENT_CONFIG.open('rb') as config_file:
            settings = tomllib.load(config_file)['pr_code_suggestions']
        self.assertIs(settings['committable_code_suggestions'], True)
        self.assertIs(settings['focus_only_on_problems'], True)
