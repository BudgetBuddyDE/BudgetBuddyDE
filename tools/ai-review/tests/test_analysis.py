from copy import deepcopy
from types import SimpleNamespace

import pytest

from ai_review.analysis import _normalize_suggestions, _tool_coverage, analyze, build_settings
from ai_review.provider import SnapshotGitProvider


@pytest.fixture
def settings():
    return {"model": "code-review", "context_window": 32000, "base_url": "https://proxy.example/v1", "api_key": "test"}


@pytest.fixture
def snapshot():
    return {
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


def test_snapshot_is_detached_and_no_worktree_reads(snapshot):
    expected = deepcopy(snapshot)
    provider = SnapshotGitProvider(snapshot=snapshot)
    snapshot["files"][0]["head_content"] = "malicious"
    files = provider.get_diff_files()
    files[0].head_file = "modified by engine"
    assert provider.get_diff_files()[0].head_file == expected["files"][0]["head_content"]


def test_operator_model_and_secret_cannot_be_overridden(snapshot, settings):
    snapshot["config_toml"] = '[config]\nmodel="evil"'
    with pytest.raises(ValueError, match="Unsupported"):
        build_settings(snapshot, settings)
    snapshot["config_toml"] = ""
    config = build_settings(snapshot, settings)
    assert config.config.fallback_models == []
    assert config.openai.api_base == settings["base_url"]
    assert config.config.repo_context_files == []
    assert config.config.model_weak == "openai/code-review"


def test_empty_required_snapshot_uses_no_model(settings):
    result = analyze({"files": [], "excluded_files": [{"filename": "package-lock.json"}]}, settings)
    assert result["coverage"]["complete"] is True
    assert result["review"]["merge_recommendation"] == "no_concerns_found"
    assert result["tool_status"] == {"review": "completed", "improve": "completed"}
    assert result["usage"] == {}


@pytest.mark.parametrize(
    "field,value",
    [
        ("remaining_files_list", ["a.py"]),
        ("partial_files_list", ["a.py"]),
        ("failed_chunk_count", 1),
        ("parse_failure_count", 1),
    ],
)
def test_incomplete_analysis_never_claims_full_coverage(field, value):
    covered, errors = _tool_coverage(
        SimpleNamespace(
            **{
                "remaining_files_list": [],
                "partial_files_list": [],
                "failed_chunk_count": 0,
                "parse_failure_count": 0,
                field: value,
            }
        ),
        ["a.py"],
        review=False,
    )
    assert covered == []
    assert errors


def test_unsafe_suggestion_fence_rejected():
    with pytest.raises(ValueError, match="fence"):
        _normalize_suggestions([{"improved_code": "```\nevil"}], [])


def test_missing_native_coverage_contract_blocks():
    covered, errors = _tool_coverage(SimpleNamespace(), ["a.py"], review=True)
    assert covered == []
    assert errors


def test_mismatched_existing_code_is_not_applicable(snapshot):
    suggestion = {
        "relevant_file": "a.py",
        "relevant_lines_start": 1,
        "relevant_lines_end": 1,
        "improved_code": "x = 1",
        "existing_code": "wrong original",
        "suggestion_content": "Fix",
    }
    result = _normalize_suggestions([suggestion], snapshot["files"])
    assert "```suggestion" not in result[0]["body"]
    assert "```text" in result[0]["body"]


def test_native_compression_cannot_hide_deleted_hunks(snapshot):
    from ai_review.analysis import _deletion_coverage_errors

    tool = SimpleNamespace(patches_diff="## File: 'a.py'\n__new hunk__\n1 +x = 2\n")
    errors = _deletion_coverage_errors(tool, snapshot["files"])
    assert errors


def test_removed_findings_use_left_side():
    from ai_review.analysis import _normalize_issues

    issue = {"relevant_file": "gone.py", "start_line": 1, "end_line": 1, "issue_content": "Regression"}
    result = _normalize_issues({"key_issues_to_review": [issue]}, [{"filename": "gone.py", "status": "removed"}])
    assert result[0]["side"] == "LEFT"
