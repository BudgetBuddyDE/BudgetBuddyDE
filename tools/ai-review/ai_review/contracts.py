"""Validate the minimal contract between the engine, cache and publisher."""

import hashlib
import json
import re
from pathlib import PurePosixPath

RECOMMENDATIONS = {"no_concerns_found", "needs_review", "changes_required"}
SHA = re.compile(r"[0-9a-f]{40}\Z")
REPOSITORY = re.compile(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\Z")


class ReviewError(Exception):
    """A bounded error safe to report without provider response bodies."""


class StaleReview(ReviewError):
    """The PR no longer matches the prepared identity."""


def safe_path(value: str) -> bool:
    return (
        isinstance(value, str)
        and bool(value)
        and not PurePosixPath(value).is_absolute()
        and str(PurePosixPath(value)) == value
        and not set(value).intersection("\\\x00\r\n")
        and all(part not in (".", "..") for part in value.split("/"))
    )


def digest(value) -> str:
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, ensure_ascii=True, separators=(",", ":")).encode()
    ).hexdigest()


def validate_result(result: dict, snapshot: dict) -> str:
    """Never infer successful analysis from an exit code or rendered Markdown."""
    if not isinstance(result, dict) or result.get("schema_version") != 1:
        raise ReviewError("Invalid analysis schema")
    if result.get("identity") != snapshot["identity"]:
        raise ReviewError("Analysis belongs to another snapshot")
    try:
        json.dumps(result, allow_nan=False)
    except (ValueError, TypeError):
        raise ReviewError("Analysis is not valid JSON") from None
    if result.get("diagnostics", []) != []:
        raise ReviewError("Analysis has diagnostic failures")
    review = result.get("review")
    if not isinstance(review, dict) or review.get("merge_recommendation") not in RECOMMENDATIONS:
        raise ReviewError("Missing or invalid merge recommendation")
    if result.get("tool_status") != {"review": "completed", "improve": "completed"}:
        raise ReviewError("Both review tools must complete")
    coverage = result.get("coverage")
    if not isinstance(coverage, dict) or coverage.get("complete") is not True or coverage.get("errors") != []:
        raise ReviewError("Analysis is incomplete")
    required = {file["filename"] for file in snapshot["files"]}
    for key in ("required_files", "reviewed_files"):
        actual = coverage.get(key)
        if not isinstance(actual, list) or not all(isinstance(name, str) for name in actual):
            raise ReviewError("Invalid coverage manifest")
        if len(actual) != len(set(actual)) or set(actual) != required:
            raise ReviewError("Analysis did not cover all required files")
    improved = coverage.get("improved_files")
    not_applicable = coverage.get("improve_not_applicable_files", [])
    if (
        not isinstance(improved, list)
        or not isinstance(not_applicable, list)
        or not all(isinstance(name, str) for name in improved + not_applicable)
    ):
        raise ReviewError("Invalid suggestion coverage")
    removed = {file["filename"] for file in snapshot["files"] if file["status"] == "removed"}
    if (
        len(improved + not_applicable) != len(set(improved + not_applicable))
        or set(improved + not_applicable) != required
        or not set(not_applicable) <= removed
    ):
        raise ReviewError("Suggestions did not cover all applicable files")
    if coverage.get("excluded_files") != snapshot["excluded_files"]:
        raise ReviewError("Excluded files do not match the snapshot")
    for key in ("comments", "suggestions"):
        if not isinstance(result.get(key), list) or len(result[key]) > 1000:
            raise ReviewError("Invalid finding collection")
        for finding in result[key]:
            if not isinstance(finding, dict):
                raise ReviewError("Invalid finding")
            body = finding.get("body")
            if not isinstance(body, str) or not body.strip() or len(body) > 16000:
                raise ReviewError("Invalid finding body")
    if not isinstance(result.get("markdown"), str) or len(result["markdown"]) > 100000:
        raise ReviewError("Invalid review summary")
    return "failure" if review["merge_recommendation"] == "changes_required" else "success"


def validate_envelope(envelope: dict, snapshot: dict) -> dict:
    if (
        not isinstance(envelope, dict)
        or envelope.get("schema_version") != 1
        or envelope.get("identity") != snapshot["identity"]
        or envelope.get("manifest") != snapshot["manifest"]
    ):
        raise ReviewError("Cached analysis identity mismatch")
    result = envelope.get("result")
    validate_result(result, snapshot)
    return result
