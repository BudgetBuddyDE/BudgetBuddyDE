"""Credential-separated Concourse stages for the PR-Agent review lifecycle."""

import argparse
import json
import os
import subprocess
import sys
import time
import uuid
from pathlib import Path

from .contracts import REPOSITORY, ReviewError, StaleReview, validate_envelope, validate_result
from .diagnostics import partial_result, safe_diagnostics
from .snapshot import assert_current, build_snapshot, resource_identity, settings_from_env


def progress(event: str, **fields):
    print(
        json.dumps({"time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "event": event, **fields}), flush=True
    )


def write_json(directory: str | Path, name: str, data: dict):
    folder = Path(directory)
    folder.mkdir(parents=True, exist_ok=True)
    temporary = folder / (name + ".tmp")
    with temporary.open("w", encoding="utf-8") as stream:
        os.chmod(temporary, 0o600)
        json.dump(data, stream, ensure_ascii=False, allow_nan=False)
    temporary.replace(folder / name)


def read_json(directory: str | Path, name: str) -> dict:
    path = Path(directory) / name
    if path.stat().st_size > 8 * 1024 * 1024:
        raise ReviewError("Stage artifact is oversized")

    def unique(pairs):
        output = {}
        for key, value in pairs:
            if key in output:
                raise ReviewError("Duplicate artifact key")
            output[key] = value
        return output

    def invalid_constant(_):
        raise ReviewError("Invalid JSON number")

    value = json.loads(path.read_text(), object_pairs_hook=unique, parse_constant=invalid_constant)
    if not isinstance(value, dict):
        raise ReviewError("Invalid stage artifact")
    return value


def client_from_state(state):
    from .github import GitHub

    repository = os.environ["GITHUB_REPOSITORY"]
    if not REPOSITORY.fullmatch(repository) or state.get("repository") != repository:
        raise ReviewError("Stage repository mismatch")
    return GitHub.from_env(repository)


def check_current(client, snapshot):
    return assert_current(
        client,
        snapshot["repository"],
        snapshot["pr"],
        snapshot["head_sha"],
        snapshot["target_branch"],
        snapshot["base_sha"],
    )


def prepare(args):
    from .github import GitHub
    from .storage import Store

    repository = os.environ["GITHUB_REPOSITORY"]
    branch = os.environ["TARGET_BRANCH"]
    if not REPOSITORY.fullmatch(repository) or not branch:
        raise ReviewError("Invalid repository or target branch")
    pr, head = resource_identity(args.pr_resource)
    client = GitHub.from_env(repository)
    state = {"repository": repository, "pr": pr, "head_sha": head, "target_branch": branch, "skip": True}
    try:
        assert_current(client, repository, pr, head, branch)
    except StaleReview:
        write_json(args.output, "state.json", state)
        progress("obsolete_version_skipped", pr=pr, head=head)
        return 0
    state["skip"] = False
    state["check_id"] = client.create_check(repository, head, "pr-agent:" + uuid.uuid4().hex)
    write_json(args.output, "state.json", state)
    progress("check_started", pr=pr, head=head, check_id=state["check_id"])
    try:
        snapshot = build_snapshot(client, repository, pr, head, branch, settings_from_env())
        key = f"pr-agent/v1/{repository}/{pr}/{snapshot['identity']}.json"
        snapshot["cache_key"] = key
        cached = Store.from_env().load(key)
        if cached is not None:
            validate_envelope(cached, snapshot)
            write_json(args.output, "cached.json", cached)
        write_json(args.output, "snapshot.json", snapshot)
        progress(
            "snapshot_prepared",
            pr=pr,
            head=head,
            cache_hit=cached is not None,
            files=len(snapshot["files"]),
            excluded=len(snapshot["excluded_files"]),
        )
        return 0
    except Exception as error:
        conclusion = "cancelled" if isinstance(error, StaleReview) else "failure"
        client.update_check(
            repository,
            state["check_id"],
            conclusion,
            "Review-Vorbereitung fehlgeschlagen",
            "Keine Freigabe. Details im Concourse-Build.",
        )
        raise


def analyze(args):
    state = read_json(args.input, "state.json")
    if state.get("skip"):
        write_json(args.output, "result.json", {"skip": True})
        return 0
    snapshot = read_json(args.input, "snapshot.json")
    cache = Path(args.input) / "cached.json"
    if cache.is_file():
        result = validate_envelope(read_json(args.input, "cached.json"), snapshot)
        write_json(args.output, "result.json", result)
        progress("cached_analysis_reused", pr=state["pr"])
        return 0
    # Reject accidental credential forwarding before PR-Agent or its dependencies load.
    forbidden = ("GITHUB_APP_", "GITHUB_INSTALLATION_", "AWS_", "S3_")
    if any(name.startswith(forbidden) for name in os.environ) or any(
        name in os.environ for name in ("GITHUB_TOKEN", "GITHUB__USER_TOKEN")
    ):
        raise ReviewError("Analysis task received forbidden credentials")
    if not os.environ.get("LITELLM_API_KEY"):
        raise ReviewError("LiteLLM key is missing")
    progress("analysis_started", pr=state["pr"], head=state["head_sha"])
    try:
        # Tool logs may contain source or model output, so only parent stage metadata is logged.
        process = subprocess.run(
            [sys.executable, "-m", "ai_review", "engine", "--input", args.input, "--output", args.output],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=570,
            check=False,
        )
        result = read_json(args.output, "result.json")
        diagnostics = safe_diagnostics(result)
        for diagnostic in diagnostics:
            progress("tool_diagnostic", **diagnostic)
        if process.returncode or diagnostics:
            raise ReviewError("PR-Agent analysis failed")
        validate_result(result, snapshot)
    except Exception as error:  # noqa: BLE001 - failures are reduced to a safe stage marker.
        timed_out = isinstance(error, subprocess.TimeoutExpired)
        write_json(args.output, "error.json", {"conclusion": "timed_out" if timed_out else "failure"})
        progress(
            "analysis_failed",
            pr=state["pr"],
            timed_out=timed_out,
            code="analysis_timeout" if timed_out else "analysis_failed",
        )
        raise ReviewError("Analysis timed out" if timed_out else "Analysis failed or was incomplete") from None
    progress("analysis_completed", pr=state["pr"])
    return 0


def engine(args):
    from .analysis import analyze as run_analysis

    snapshot = read_json(args.input, "snapshot.json")
    settings = {**snapshot["settings"], "api_key": os.environ["LITELLM_API_KEY"]}

    def checkpoint(result):
        result["identity"] = snapshot["identity"]
        write_json(args.output, "result.json", result)

    result = run_analysis(snapshot, settings, checkpoint=checkpoint)
    result["identity"] = snapshot["identity"]
    checkpoint(result)
    validate_result(result, snapshot)
    return 0


def publish(args):
    from .publishing import publish as publish_comments
    from .storage import Store

    state = read_json(args.input, "state.json")
    if state.get("skip"):
        return 0
    snapshot = read_json(args.input, "snapshot.json")
    client = client_from_state(state)
    try:
        result = read_json(args.result, "result.json")
        conclusion = validate_result(result, snapshot)
        check_current(client, snapshot)
        envelope = {
            "schema_version": 1,
            "identity": snapshot["identity"],
            "manifest": snapshot["manifest"],
            "result": result,
        }
        saved = Store.from_env().save(snapshot["cache_key"], envelope)
        result = validate_envelope(saved, snapshot)
        conclusion = validate_result(result, snapshot)
        check_current(client, snapshot)
        publish_comments(client, state["repository"], state["pr"], snapshot, result)
        check_current(client, snapshot)
        client.update_check(
            state["repository"],
            state["check_id"],
            conclusion,
            "KI-Review: " + result["review"]["merge_recommendation"],
            f"Geprüfter Commit: `{snapshot['head_sha']}`. Beide Werkzeuge vollständig ausgeführt.",
        )
        progress("check_completed", pr=state["pr"], head=state["head_sha"], conclusion=conclusion)
        return 0
    except StaleReview:
        client.update_check(
            state["repository"],
            state["check_id"],
            "cancelled",
            "Review überholt",
            "Der PR-Stand hat sich geändert. Keine Freigabe für einen neueren Commit.",
        )
        progress("stale_publication_cancelled", pr=state["pr"])
        return 1


def finalize(args):
    if not (Path(args.input) / "state.json").is_file():
        progress("no_check_to_finalize")
        return 0
    state = read_json(args.input, "state.json")
    if state.get("skip") or not state.get("check_id"):
        return 0
    client = client_from_state(state)
    check = client.request("GET", f"/repos/{state['repository']}/check-runs/{state['check_id']}")
    if check.get("head_sha") != state["head_sha"] or check.get("app", {}).get("id") != client.app_id:
        raise ReviewError("Check identity mismatch")
    if check.get("status") == "completed":
        return 0
    conclusion = args.conclusion
    if conclusion != "cancelled" and args.result and (Path(args.result) / "error.json").is_file():
        try:
            if read_json(args.result, "error.json").get("conclusion") == "timed_out":
                conclusion = "timed_out"
        except (ReviewError, ValueError, OSError):
            progress("invalid_failure_marker", code="invalid_artifact")
    publication_error = None
    # Completed checks are immutable here; failure hooks only report unfinished runs.
    if conclusion != "cancelled" and (Path(args.input) / "snapshot.json").is_file():
        from .publishing import publish as publish_comments

        try:
            snapshot = read_json(args.input, "snapshot.json")
            if (
                snapshot["head_sha"] != state["head_sha"]
                or snapshot["repository"] != state["repository"]
                or snapshot["pr"] != state["pr"]
            ):
                raise ReviewError("Finalization snapshot mismatch")
            check_current(client, snapshot)
            raw = None
            if args.result and (Path(args.result) / "result.json").is_file():
                try:
                    raw = read_json(args.result, "result.json")
                    report = partial_result(raw, snapshot)
                except (ReviewError, ValueError, OSError):
                    raw = None
            if raw is None:
                report = partial_result({"schema_version": 1, "identity": snapshot["identity"]}, snapshot)
                report["diagnostics"] = [{"tool": "analysis", "code": "invalid_artifact"}]
            if conclusion == "timed_out":
                report["diagnostics"].append({"tool": "analysis", "code": "analysis_timeout"})
            elif not report["diagnostics"]:
                # Complete analysis with an unfinished check indicates publication failure.
                raw_coverage = raw.get("coverage") if raw is not None else None
                complete = isinstance(raw_coverage, dict) and raw_coverage.get("complete") is True
                report["diagnostics"].append(
                    {
                        "tool": "publication" if complete else "analysis",
                        "code": "publication_failed" if complete else "analysis_failed",
                    }
                )
            publish_comments(client, state["repository"], state["pr"], snapshot, report, incomplete=True)
            check_current(client, snapshot)
        except StaleReview:
            conclusion = "cancelled"
        except Exception as error:  # noqa: BLE001 - always attempt check cleanup.
            # Still close the check when GitHub comments fail. Never emit exception text.
            publication_error = error
            progress("partial_publication_failed", code="publication_failed")
    client.update_check(
        state["repository"],
        state["check_id"],
        conclusion,
        "KI-Review nicht abgeschlossen",
        "Keine Freigabe. Analyse unvollständig oder Veröffentlichung fehlgeschlagen. Details im Concourse-Build.",
    )
    if publication_error is not None:
        raise ReviewError("Partial publication failed") from None
    progress("check_finalized", pr=state["pr"], conclusion=conclusion)
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    p = commands.add_parser("prepare")
    p.add_argument("--pr-resource", required=True)
    p.add_argument("--output", required=True)
    for name in ("analyze", "engine"):
        p = commands.add_parser(name)
        p.add_argument("--input", required=True)
        p.add_argument("--output", required=True)
    p = commands.add_parser("publish")
    p.add_argument("--input", required=True)
    p.add_argument("--result", required=True)
    p = commands.add_parser("finalize")
    p.add_argument("--input", required=True)
    p.add_argument("--result")
    p.add_argument("--conclusion", choices=("failure", "cancelled", "timed_out"), required=True)
    args = parser.parse_args(argv)
    try:
        return globals()[args.command](args)
    except Exception as error:  # noqa: BLE001 - never expose upstream exception details.
        # Never emit response bodies, tracebacks, paths or provider exception strings.
        progress("stage_failed", stage=args.command, kind=type(error).__name__)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
