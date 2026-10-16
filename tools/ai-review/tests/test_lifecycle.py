import copy
import subprocess
from argparse import Namespace
from unittest.mock import Mock

import pytest

from ai_review import __main__ as cli
from ai_review.contracts import ReviewError, StaleReview, validate_result
from ai_review.snapshot import build_snapshot, exclusion, settings_from_env, validate_patch

HEAD, BASE, MERGE = "a" * 40, "b" * 40, "c" * 40
IDENTITY = "d" * 64


@pytest.fixture
def snapshot():
    return {
        "schema_version": 1,
        "repository": "owner/repo",
        "pr": 42,
        "head_sha": HEAD,
        "base_sha": BASE,
        "merge_base_sha": MERGE,
        "target_branch": "main",
        "identity": IDENTITY,
        "manifest": {"head_sha": HEAD},
        "cache_key": f"pr-agent/v1/owner/repo/42/{IDENTITY}.json",
        "files": [
            {
                "filename": "main.py",
                "old_filename": "main.py",
                "status": "modified",
                "base_content": "old\n",
                "head_content": "new\n",
                "patch": "@@ -1 +1 @@\n-old\n+new",
            }
        ],
        "excluded_files": [],
        "settings": {
            "model": "code-review",
            "base_url": "https://llm.example/v1",
            "context_window": 32000,
            "model_profile_version": "1",
        },
    }


@pytest.fixture
def result():
    return {
        "schema_version": 1,
        "identity": IDENTITY,
        "review": {"merge_recommendation": "no_concerns_found"},
        "tool_status": {"review": "completed", "improve": "completed"},
        "comments": [],
        "suggestions": [],
        "markdown": "Review",
        "usage": {},
        "coverage": {
            "complete": True,
            "required_files": ["main.py"],
            "reviewed_files": ["main.py"],
            "improved_files": ["main.py"],
            "excluded_files": [],
            "errors": [],
        },
    }


@pytest.fixture
def prepared(tmp_path, snapshot):
    directory = tmp_path / "prepared"
    cli.write_json(
        directory,
        "state.json",
        {
            "repository": "owner/repo",
            "pr": 42,
            "head_sha": HEAD,
            "target_branch": "main",
            "check_id": 123,
            "skip": False,
        },
    )
    cli.write_json(directory, "snapshot.json", snapshot)
    return directory


@pytest.mark.parametrize(
    "decision,expected",
    [("no_concerns_found", "success"), ("needs_review", "success"), ("changes_required", "failure")],
)
def test_gate_policy(snapshot, result, decision, expected):
    result["review"]["merge_recommendation"] = decision
    assert validate_result(result, snapshot) == expected


@pytest.mark.parametrize(
    "mutation",
    [
        lambda r: r.update(identity="another-snapshot"),
        lambda r: r["review"].clear(),
        lambda r: r["tool_status"].update(improve="failed"),
        lambda r: r["coverage"].update(complete=False),
        lambda r: r["coverage"].update(improved_files=[]),
        lambda r: r["coverage"].update(reviewed_files=["main.py", "main.py"]),
        lambda r: r["coverage"].update(errors=["timeout"]),
        lambda r: r["coverage"].update(excluded_files=[{"path": "main.py", "reason": "untrusted"}]),
        lambda r: r["usage"].update(total_tokens=float("nan")),
    ],
)
def test_missing_invalid_or_incomplete_result_never_passes(snapshot, result, mutation):
    mutation(result)
    with pytest.raises(ReviewError):
        validate_result(result, snapshot)


@pytest.mark.parametrize(
    "before,after,patch",
    [
        ("", "new\n", "@@ -0,0 +1 @@\n+new"),
        ("old\n", "", "@@ -1 +0,0 @@\n-old"),
        ("a\nb\n", "a\nnew\nb\n", "@@ -1,0 +2 @@\n+new"),
        ("old", "new", "@@ -1 +1 @@\n-old\n\\ No newline at end of file\n+new\n\\ No newline at end of file"),
    ],
)
def test_snapshot_validates_added_deleted_and_no_newline_patches(before, after, patch):
    validate_patch(patch, before, after)


@pytest.mark.parametrize("patch", ["", "@@ -1 +1 @@\n-old", "@@ -1 +1 @@\n-wrong\n+new"])
def test_truncated_or_wrong_patch_blocks(patch):
    with pytest.raises(ReviewError):
        validate_patch(patch, "old\n", "new\n")


def test_missing_hunks_block_even_when_individual_hunk_is_valid():
    with pytest.raises(ReviewError):
        validate_patch("@@ -1 +1 @@\n-old\n+new", "old\nunchanged\nlast\n", "new\nunchanged\nchanged\n")


def test_real_lib_and_build_source_are_not_treated_as_generated():
    for path in ("apps/webapp/src/lib/navigation.ts", "packages/api/src/lib/cache.ts", "tools/build/index.py"):
        assert exclusion(path, {}) is None
    assert exclusion("packages/api/lib/index.js", {}) == "workspace build output"
    assert exclusion("services/backend/build/index.js", {}) == "workspace build output"


def test_suggestions_not_applicable_only_for_removed_files(snapshot, result):
    result["coverage"]["improved_files"] = []
    result["coverage"]["improve_not_applicable_files"] = ["main.py"]
    with pytest.raises(ReviewError):
        validate_result(result, snapshot)
    snapshot["files"][0]["status"] = "removed"
    assert validate_result(result, snapshot) == "success"


def test_snapshot_reads_config_only_from_base_and_sources_from_immutable_refs(snapshot):
    client = Mock()
    pull = {
        "state": "open",
        "head": {"sha": HEAD, "ref": "feature"},
        "base": {"sha": BASE, "ref": "main", "repo": {"full_name": "owner/repo"}},
    }
    client.get_pull.return_value = pull
    client.compare.return_value = {
        "merge_base_commit": {"sha": MERGE},
        "files": [
            {
                "filename": "renamed.py",
                "previous_filename": "old.py",
                "status": "renamed",
                "patch": "@@ -1 +1 @@\n-old\n+new",
            },
            {"filename": "package-lock.json", "status": "modified"},
        ],
    }
    contents = {
        (BASE, ".pr_agent.toml"): b"[pr_reviewer]\nrequire_tests_review=true\n",
        (MERGE, "old.py"): b"old\n",
        (HEAD, "renamed.py"): b"new\n",
    }
    client.get_file.side_effect = lambda repo, path, ref: contents[(ref, path)]
    frozen = build_snapshot(client, "owner/repo", 42, HEAD, "main", snapshot["settings"])
    assert frozen["files"][0]["old_filename"] == "old.py"
    assert frozen["excluded_files"] == [{"path": "package-lock.json", "reason": "dependency lockfile"}]
    assert all(call.args[2] in {BASE, MERGE, HEAD} for call in client.get_file.call_args_list)
    assert client.get_file.call_args_list[0].args[1:] == (".pr_agent.toml", BASE)
    alternate = copy.deepcopy(snapshot["settings"])
    alternate["model_profile_version"] = "2"
    changed = build_snapshot(client, "owner/repo", 42, HEAD, "main", alternate)
    assert changed["identity"] != frozen["identity"]
    pull["body"] = "Updated requirements"
    changed_metadata = build_snapshot(client, "owner/repo", 42, HEAD, "main", snapshot["settings"])
    assert changed_metadata["identity"] != frozen["identity"]
    contents[(HEAD, "renamed.py")] = b"\x00hidden source"
    with pytest.raises(ReviewError, match="Required source is not UTF-8"):
        build_snapshot(client, "owner/repo", 42, HEAD, "main", snapshot["settings"])


def test_prepare_skips_obsolete_version_before_cache_or_model(tmp_path, monkeypatch):
    from ai_review.github import GitHub
    from ai_review.storage import Store

    monkeypatch.setenv("GITHUB_REPOSITORY", "owner/repo")
    monkeypatch.setenv("TARGET_BRANCH", "main")
    monkeypatch.setattr(cli, "resource_identity", lambda _: (42, HEAD))
    client = Mock()
    monkeypatch.setattr(GitHub, "from_env", lambda _: client)
    monkeypatch.setattr(cli, "assert_current", Mock(side_effect=StaleReview()))
    storage = Mock()
    monkeypatch.setattr(Store, "from_env", storage)
    output = tmp_path / "prepared"
    assert cli.prepare(Namespace(pr_resource="pr", output=str(output))) == 0
    assert cli.read_json(output, "state.json")["skip"] is True
    client.create_check.assert_not_called()
    storage.assert_not_called()


@pytest.mark.parametrize("recommendation", ["no_concerns_found", "changes_required"])
def test_cached_analysis_reused_without_key_or_model(prepared, snapshot, result, recommendation, monkeypatch, tmp_path):
    result["review"]["merge_recommendation"] = recommendation
    cli.write_json(
        prepared,
        "cached.json",
        {"schema_version": 1, "identity": IDENTITY, "manifest": snapshot["manifest"], "result": result},
    )
    transport = Mock()
    monkeypatch.setattr(cli.subprocess, "run", transport)
    assert cli.analyze(Namespace(input=str(prepared), output=str(tmp_path / "analyzed"))) == 0
    transport.assert_not_called()
    assert cli.read_json(tmp_path / "analyzed", "result.json") == result


def test_timeout_creates_marker_for_failure_hook(prepared, monkeypatch, tmp_path):
    for key in list(cli.os.environ):
        if key.startswith(("GITHUB_APP_", "GITHUB_INSTALLATION_", "AWS_", "S3_")):
            monkeypatch.delenv(key)
    monkeypatch.setenv("LITELLM_API_KEY", "never-log-this")
    monkeypatch.setattr(cli.subprocess, "run", Mock(side_effect=subprocess.TimeoutExpired("model", 570)))
    output = tmp_path / "analyzed"
    with pytest.raises(ReviewError, match="timed out"):
        cli.analyze(Namespace(input=str(prepared), output=str(output)))
    assert cli.read_json(output, "error.json") == {"conclusion": "timed_out"}


def test_analysis_rejects_accidental_publisher_credentials(prepared, monkeypatch, tmp_path):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "publisher-secret")
    with pytest.raises(ReviewError, match="forbidden credentials"):
        cli.analyze(Namespace(input=str(prepared), output=str(tmp_path)))


@pytest.mark.parametrize("recommendation,exit_code", [("changes_required", 1), ("needs_review", 0)])
def test_publish_saves_before_comments_and_uses_exact_head(
    prepared, result, recommendation, exit_code, monkeypatch, tmp_path
):
    from ai_review import publishing
    from ai_review.storage import Store

    result["review"]["merge_recommendation"] = recommendation
    cli.write_json(tmp_path / "analyzed", "result.json", result)
    client, store = Mock(), Mock()
    store.save.side_effect = lambda key, envelope: envelope
    monkeypatch.setattr(cli, "client_from_state", lambda _: client)
    monkeypatch.setattr(cli, "check_current", Mock())
    monkeypatch.setattr(Store, "from_env", lambda: store)

    def post(*_):
        store.save.assert_called_once()

    monkeypatch.setattr(publishing, "publish", post)
    assert cli.publish(Namespace(input=str(prepared), result=str(tmp_path / "analyzed"))) == exit_code
    assert client.update_check.call_args.args[:3] == ("owner/repo", 123, "failure" if exit_code else "success")
    assert store.save.call_args.args[1]["manifest"]["head_sha"] == HEAD


def test_stale_publication_never_posts_or_saves(prepared, result, monkeypatch, tmp_path):
    from ai_review import publishing

    cli.write_json(tmp_path / "analyzed", "result.json", result)
    client = Mock()
    monkeypatch.setattr(cli, "client_from_state", lambda _: client)
    monkeypatch.setattr(cli, "check_current", Mock(side_effect=StaleReview()))
    publish = Mock()
    monkeypatch.setattr(publishing, "publish", publish)
    assert cli.publish(Namespace(input=str(prepared), result=str(tmp_path / "analyzed"))) == 1
    assert client.update_check.call_args.args[2] == "cancelled"
    publish.assert_not_called()


def test_finalize_does_not_overwrite_completed_check(prepared, monkeypatch):
    client = Mock(app_id=99)
    client.request.return_value = {"head_sha": HEAD, "app": {"id": 99}, "status": "completed", "conclusion": "failure"}
    monkeypatch.setattr(cli, "client_from_state", lambda _: client)
    assert cli.finalize(Namespace(input=str(prepared), conclusion="cancelled", result=None)) == 0
    client.update_check.assert_not_called()


def test_finalize_distinguishes_analysis_timeout(prepared, monkeypatch, tmp_path):
    client = Mock(app_id=99)
    client.request.return_value = {"head_sha": HEAD, "app": {"id": 99}, "status": "in_progress"}
    monkeypatch.setattr(cli, "client_from_state", lambda _: client)
    cli.write_json(tmp_path / "analyzed", "error.json", {"conclusion": "timed_out"})
    assert cli.finalize(Namespace(input=str(prepared), conclusion="failure", result=str(tmp_path / "analyzed"))) == 0
    assert client.update_check.call_args.args[2] == "timed_out"


def test_invalid_artifacts_and_errors_do_not_expose_credentials(tmp_path, monkeypatch, capsys):
    (tmp_path / "state.json").write_text('{"skip":true,"skip":false}')
    with pytest.raises(ReviewError):
        cli.read_json(tmp_path, "state.json")
    monkeypatch.setattr(cli, "prepare", Mock(side_effect=ValueError("SECRET-TOKEN")))
    assert cli.main(["prepare", "--pr-resource", "pr", "--output", str(tmp_path)]) == 1
    output = capsys.readouterr().out
    assert "stage_failed" in output and "SECRET-TOKEN" not in output


def test_endpoint_rejects_credentials_http_and_invalid_context(monkeypatch):
    monkeypatch.setenv("LITELLM_MODEL", "code-review")
    monkeypatch.setenv("LITELLM_PROFILE_REVISION", "1")
    monkeypatch.setenv("LITELLM_CONTEXT_WINDOW", "32000")
    for endpoint in ("http://llm.example", "https://user:secret@llm.example", "https://llm.example/?key=secret"):
        monkeypatch.setenv("LITELLM_BASE_URL", endpoint)
        with pytest.raises(ReviewError):
            settings_from_env()
    monkeypatch.setenv("LITELLM_BASE_URL", "https://llm.example/v1")
    monkeypatch.setenv("LITELLM_CONTEXT_WINDOW", "4096")
    with pytest.raises(ReviewError):
        settings_from_env()


def test_publication_failure_retry_reuses_stored_result(prepared, snapshot, result, monkeypatch, tmp_path):
    """Publish failure keeps a durable analysis, and a new build does not ask the model again."""
    from ai_review import publishing
    from ai_review.storage import Store

    client, store = Mock(), Mock()
    saved = {}

    def save(key, envelope):
        saved[key] = copy.deepcopy(envelope)
        return envelope

    store.save.side_effect = save
    store.load.side_effect = lambda key: saved.get(key)
    monkeypatch.setattr(Store, "from_env", lambda: store)
    monkeypatch.setattr(cli, "client_from_state", lambda _: client)
    monkeypatch.setattr(cli, "check_current", Mock())
    post = Mock(side_effect=[RuntimeError("GitHub unavailable"), None])
    monkeypatch.setattr(publishing, "publish", post)
    analyzed = tmp_path / "analyzed"
    cli.write_json(analyzed, "result.json", result)
    with pytest.raises(RuntimeError):
        cli.publish(Namespace(input=str(prepared), result=str(analyzed)))
    client.update_check.assert_not_called()
    assert saved[snapshot["cache_key"]]["result"] == result
    # Preparation of the next build loads this exact envelope; the analysis stage is credential-free on a cache hit.
    cli.write_json(prepared, "cached.json", store.load(snapshot["cache_key"]))
    model = Mock()
    monkeypatch.setattr(cli.subprocess, "run", model)
    assert cli.analyze(Namespace(input=str(prepared), output=str(analyzed))) == 0
    assert cli.publish(Namespace(input=str(prepared), result=str(analyzed))) == 0
    model.assert_not_called()
    assert post.call_count == 2
    assert client.update_check.call_args.args[2] == "success"


def test_new_head_after_comment_publication_prevents_success(prepared, result, monkeypatch, tmp_path):
    from ai_review import publishing
    from ai_review.storage import Store

    client, store = Mock(), Mock()
    store.save.side_effect = lambda key, envelope: envelope
    monkeypatch.setattr(Store, "from_env", lambda: store)
    monkeypatch.setattr(cli, "client_from_state", lambda _: client)
    monkeypatch.setattr(cli, "check_current", Mock(side_effect=[None, None, StaleReview()]))
    post = Mock()
    monkeypatch.setattr(publishing, "publish", post)
    analyzed = tmp_path / "analyzed"
    cli.write_json(analyzed, "result.json", result)
    assert cli.publish(Namespace(input=str(prepared), result=str(analyzed))) == 1
    post.assert_called_once()
    assert client.update_check.call_args.args[2] == "cancelled"
    assert client.update_check.call_args.args[1] == 123
