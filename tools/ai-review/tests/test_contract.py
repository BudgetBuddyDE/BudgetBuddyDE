"""Contracts execute the actual pinned engines; only the model transport is replaced."""

import json
from importlib.metadata import distribution

import pytest
from pr_agent.git_providers import get_git_provider_with_context, register_git_provider
from starlette_context import request_cycle_context

from ai_review.analysis import PR_AGENT_SHA, analyze, build_settings
from ai_review.provider import SnapshotGitProvider

SNAPSHOT = {
    "files": [
        {
            "filename": "a.py",
            "old_filename": None,
            "status": "modified",
            "base_content": "x = 1\n",
            "head_content": "x = 2\n",
            "patch": "@@ -1 +1 @@\n-x = 1\n+x = 2\n",
        }
    ],
    "config_toml": "",
    "title": "test",
}
SETTINGS = {"model": "code-review", "context_window": 32000, "base_url": "https://proxy.example/v1", "api_key": "test"}


def test_installed_distribution_is_exact_pin():
    info = json.loads(distribution("pr-agent").read_text("direct_url.json"))
    assert info["vcs_info"]["commit_id"] == PR_AGENT_SHA


def test_public_registration_is_selectable():
    register_git_provider("budgetbuddy-snapshot", SnapshotGitProvider)
    provider = SnapshotGitProvider(snapshot=SNAPSHOT)
    config = build_settings(SNAPSHOT, SETTINGS)
    with request_cycle_context({"settings": config, "git_provider": {"snapshot://review": provider}}):
        assert get_git_provider_with_context("snapshot://review") is provider


@pytest.mark.parametrize("recommendation", ["no_concerns_found", "needs_review", "changes_required"])
def test_real_engines_and_structured_recommendations(monkeypatch, recommendation):
    from pr_agent.algo.ai_handlers.litellm_ai_handler import LiteLLMAIHandler

    calls = []

    async def completion(self, model, system, user, **kwargs):
        calls.append((model, user))
        if "merge_recommendation" in system:
            return f"review:\n  merge_recommendation: {recommendation}\n  key_issues_to_review: []\n", "stop"
        return "code_suggestions: []\n", "stop"

    monkeypatch.setattr(LiteLLMAIHandler, "chat_completion", completion)
    result = analyze(SNAPSHOT, SETTINGS)
    assert result["coverage"]["errors"] == []
    assert result["coverage"]["complete"] is True
    assert result["review"]["merge_recommendation"] == recommendation
    assert result["tool_status"] == {"review": "completed", "improve": "completed"}
    assert len(calls) == 2
    assert all(model == "openai/code-review" for model, _ in calls)


def test_real_engines_invalid_model_response_blocks(monkeypatch):
    from pr_agent.algo.ai_handlers.litellm_ai_handler import LiteLLMAIHandler

    async def completion(self, *args, **kwargs):
        return "not valid review data", "stop"

    monkeypatch.setattr(LiteLLMAIHandler, "chat_completion", completion)
    result = analyze(SNAPSHOT, SETTINGS)
    assert result["coverage"]["complete"] is False
    assert result["coverage"]["errors"]


def test_real_suggestion_and_inline_review_output(monkeypatch):
    from pr_agent.algo.ai_handlers.litellm_ai_handler import LiteLLMAIHandler

    async def completion(self, model, system, user, **kwargs):
        if "merge_recommendation" in system:
            return (
                """review:
  merge_recommendation: changes_required
  key_issues_to_review:
  - relevant_file: a.py
    issue_header: Regression
    issue_content: x muss eins bleiben.
    start_line: 1
    end_line: 1
""",
                "stop",
            )
        if "suggestion_score" in system:
            return (
                """code_suggestions:
- suggestion_summary: Korrigiere den Wert
  relevant_file: a.py
  relevant_lines_start: 1
  relevant_lines_end: 1
  suggestion_score: 9
  why: Korrigiert den Fehler
""",
                "stop",
            )
        return (
            """code_suggestions:
- relevant_file: a.py
  language: python
  existing_code: x = 2
  improved_code: x = 1
  suggestion_content: Korrigiere den falschen Wert.
  one_sentence_summary: Korrigiere den Wert
  label: possible issue
""",
            "stop",
        )

    monkeypatch.setattr(LiteLLMAIHandler, "chat_completion", completion)
    result = analyze(SNAPSHOT, SETTINGS)
    assert result["coverage"]["errors"] == []
    assert result["comments"][0]["path"] == "a.py"
    assert result["suggestions"][0]["body"].endswith("```suggestion\nx = 1\n```")


def test_real_engine_coverage_budget_blocks(monkeypatch):
    from copy import deepcopy

    from pr_agent.algo.ai_handlers.litellm_ai_handler import LiteLLMAIHandler

    snapshot = deepcopy(SNAPSHOT)
    snapshot["files"] *= 10
    snapshot["files"] = [
        dict(f, filename=f"file{i}.py", patch="@@ -1 +1 @@\n-x\n+" + "words " * 10000)
        for i, f in enumerate(snapshot["files"])
    ]

    async def completion(self, model, system, user, **kwargs):
        if "merge_recommendation" in system:
            return "review:\n  merge_recommendation: no_concerns_found\n  key_issues_to_review: []\n", "stop"
        return "code_suggestions: []", "stop"

    monkeypatch.setattr(LiteLLMAIHandler, "chat_completion", completion)
    result = analyze(snapshot, dict(SETTINGS, context_window=8192))
    assert result["coverage"]["complete"] is False
    assert result["coverage"]["errors"]


@pytest.mark.parametrize(
    "status,base,head,patch",
    [
        ("removed", "deleted_unique_guard = 1\n", "", "@@ -1 +0,0 @@\n-deleted_unique_guard = 1\n"),
        ("added", "", "added_unique_guard = 1\n", "@@ -0,0 +1 @@\n+added_unique_guard = 1\n"),
        (
            "renamed",
            "old_unique_guard = 1\n",
            "renamed_unique_guard = 1\n",
            "@@ -1 +1 @@\n-old_unique_guard = 1\n+renamed_unique_guard = 1\n",
        ),
    ],
)
def test_real_engine_changed_file_contracts(monkeypatch, status, base, head, patch):
    from copy import deepcopy

    from pr_agent.algo.ai_handlers.litellm_ai_handler import LiteLLMAIHandler

    snapshot = deepcopy(SNAPSHOT)
    snapshot["files"][0].update(status=status, base_content=base, head_content=head, patch=patch)
    calls = []

    async def completion(self, model, system, user, **kwargs):
        calls.append(user)
        if "merge_recommendation" in system:
            assert (base or head).strip() in user
            return "review:\n  merge_recommendation: no_concerns_found\n  key_issues_to_review: []\n", "stop"
        return "code_suggestions: []", "stop"

    monkeypatch.setattr(LiteLLMAIHandler, "chat_completion", completion)
    result = analyze(snapshot, SETTINGS)
    assert result["coverage"]["errors"] == []
    assert result["coverage"]["complete"] is True
    assert result["coverage"]["reviewed_files"] == ["a.py"]
    if status == "removed":
        assert len(calls) == 1
        assert result["coverage"]["improve_not_applicable_files"] == ["a.py"]
        assert result["coverage"]["improved_files"] == []
    else:
        assert len(calls) == 2
        assert result["coverage"]["improved_files"] == ["a.py"]


@pytest.mark.parametrize("recommendation", ["", "  merge_recommendation: unexpected\n"])
def test_invalid_recommendation_keeps_findings_and_runs_improve(monkeypatch, recommendation):
    from copy import deepcopy

    from pr_agent.algo.ai_handlers.litellm_ai_handler import LiteLLMAIHandler

    checkpoints, calls = [], []

    async def completion(self, model, system, user, **kwargs):
        calls.append(system)
        if "merge_recommendation" in system:
            return (
                "review:\n"
                + recommendation
                + """  key_issues_to_review:
  - relevant_file: a.py
    issue_header: Regression
    issue_content: x muss eins bleiben.
    start_line: 1
    end_line: 1
""",
                "stop",
            )
        return "code_suggestions: []", "stop"

    monkeypatch.setattr(LiteLLMAIHandler, "chat_completion", completion)
    result = analyze(SNAPSHOT, SETTINGS, checkpoint=lambda value: checkpoints.append(deepcopy(value)))
    assert len(calls) == 2
    assert result["comments"][0]["body"] == "x muss eins bleiben."
    assert result["review"] == {}
    assert result["coverage"]["complete"] is False
    assert {"tool": "review", "code": "invalid_recommendation"} in result["diagnostics"]
    assert result["tool_status"] == {"review": "failed", "improve": "completed"}
    assert checkpoints[0]["tool_status"] == {"review": "not_started", "improve": "not_started"}
    assert checkpoints[1]["comments"] == result["comments"]
    assert checkpoints[1]["tool_status"]["improve"] == "not_started"


def test_failed_improve_keeps_completed_review_checkpoint(monkeypatch):
    from pr_agent.algo.ai_handlers.litellm_ai_handler import LiteLLMAIHandler

    checkpoints = []

    async def completion(self, model, system, user, **kwargs):
        if "merge_recommendation" in system:
            return "review:\n  merge_recommendation: changes_required\n  key_issues_to_review: []", "stop"
        return "not a suggestion result", "stop"

    monkeypatch.setattr(LiteLLMAIHandler, "chat_completion", completion)
    result = analyze(SNAPSHOT, SETTINGS, checkpoint=checkpoints.append)
    assert checkpoints[1]["review"]["merge_recommendation"] == "changes_required"
    assert checkpoints[1]["tool_status"] == {"review": "completed", "improve": "not_started"}
    assert result["tool_status"] == {"review": "completed", "improve": "failed"}
    assert {"tool": "improve", "code": "invalid_suggestions"} in result["diagnostics"]
    assert result["coverage"]["complete"] is False


def test_proxy_alias_requests_omit_temperature_for_review_suggestions_and_scoring(monkeypatch):
    from litellm import ModelResponse
    from pr_agent.algo.ai_handlers import litellm_ai_handler

    calls = []

    async def completion(**kwargs):
        calls.append(kwargs)
        assert kwargs["model"] == "openai/code-review"
        assert "temperature" not in kwargs
        assert "reasoning_effort" not in kwargs
        system = kwargs["messages"][0]["content"]
        if "merge_recommendation" in system:
            content = "review:\n  merge_recommendation: changes_required\n  key_issues_to_review: []"
        elif "suggestion_score" in system:
            content = """code_suggestions:
- suggestion_summary: Korrigiere den Wert
  relevant_file: a.py
  relevant_lines_start: 1
  relevant_lines_end: 1
  suggestion_score: 9
  why: Korrigiert den Fehler
"""
        else:
            content = """code_suggestions:
- relevant_file: a.py
  language: python
  existing_code: x = 2
  improved_code: x = 1
  suggestion_content: Korrigiere den falschen Wert.
  one_sentence_summary: Korrigiere den Wert
  label: possible issue
"""
        return ModelResponse(
            model=kwargs["model"],
            choices=[{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
            usage={"prompt_tokens": 20, "completion_tokens": 20, "total_tokens": 40},
        )

    # Replace only the network boundary; run both pinned PR-Agent tools and their real handler.
    monkeypatch.setattr(litellm_ai_handler, "acompletion", completion)
    result = analyze(SNAPSHOT, SETTINGS)
    assert result["coverage"]["complete"] is True
    assert result["review"]["merge_recommendation"] == "changes_required"
    assert result["suggestions"]
    assert len(calls) == 3
