"""Resolve a PR into bounded immutable source, without executing its checkout."""

import fnmatch
import hashlib
import os
import re
import tomllib
from pathlib import Path
from urllib.parse import urlsplit

from . import ADAPTER_VERSION, PR_AGENT_REVISION
from .contracts import REPOSITORY, SHA, ReviewError, StaleReview, digest, safe_path

HUNK = re.compile(r"^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@")
GENERATED = {"node_modules", ".next", "coverage", ".turbo"}
LOCKFILES = {"package-lock.json", "uv.lock", "go.sum"}
BINARY_SUFFIXES = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
    ".gz",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".mp3",
    ".mp4",
    ".mov",
    ".heic",
}


def settings_from_env() -> dict:
    base_url = os.environ["LITELLM_BASE_URL"].rstrip("/")
    parsed = urlsplit(base_url)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.query
        or parsed.fragment
    ):
        raise ReviewError("LiteLLM requires an HTTPS base URL without credentials")
    model = os.environ["LITELLM_MODEL"]
    revision = os.environ["LITELLM_PROFILE_REVISION"]
    context_window = int(os.environ["LITELLM_CONTEXT_WINDOW"])
    if not model or len(model) > 200 or not revision or context_window < 8192:
        raise ReviewError("Invalid operator model profile")
    return {"base_url": base_url, "model": model, "context_window": context_window, "model_profile_version": revision}


def resource_identity(directory: str) -> tuple[int, str]:
    metadata = Path(directory) / ".git" / "resource"
    pr = int((metadata / "pr").read_text().strip())
    head = (metadata / "head_sha").read_text().strip()
    if pr <= 0 or not SHA.fullmatch(head):
        raise ReviewError("Invalid Concourse PR metadata")
    return pr, head


def assert_current(client, repository: str, pr: int, head: str, branch: str, base: str | None = None) -> dict:
    pull = client.get_pull(repository, pr)
    if (
        pull.get("state") != "open"
        or pull.get("head", {}).get("sha") != head
        or pull.get("base", {}).get("ref") != branch
        or pull.get("base", {}).get("repo", {}).get("full_name", "").lower() != repository.lower()
        or (base is not None and pull.get("base", {}).get("sha") != base)
    ):
        raise StaleReview("PR snapshot has been superseded or is no longer eligible")
    return pull


def exclusion(path: str, config: dict) -> str | None:
    name = Path(path).name
    if set(path.split("/")[:-1]) & GENERATED:
        return "generated directory"
    if re.match(r"^packages/[^/]+/lib/|^services/[^/]+/build/|^apps/documentation/dist/|^tools/ai-review/dist/", path):
        return "workspace build output"
    if name in LOCKFILES:
        return "dependency lockfile"
    if Path(path).suffix.lower() in BINARY_SUFFIXES:
        return "binary asset"
    patterns = config.get("ignore", {}).get("glob", [])
    if not isinstance(patterns, list) or not all(isinstance(pattern, str) for pattern in patterns):
        raise ReviewError("Invalid configured exclusion patterns")
    if any(
        fnmatch.fnmatchcase(path, pattern) or (pattern.startswith("**/") and fnmatch.fnmatchcase(path, pattern[3:]))
        for pattern in patterns
    ):
        return "trusted PR-Agent exclusion"
    return None


def validate_patch(patch: str, before: str, after: str) -> None:
    """Apply every supplied hunk and reject missing/truncated source changes."""
    if not isinstance(patch, str) or not patch:
        raise ReviewError("Required source patch is missing")
    old_lines, new_lines = before.splitlines(), after.splitlines()
    output = []
    cursor = 0
    remaining_old = remaining_new = 0
    seen = False
    for line in patch.splitlines():
        match = HUNK.match(line)
        if match:
            if remaining_old or remaining_new:
                raise ReviewError("Truncated source patch")
            old_start, old_count, new_start, new_count = match.groups()
            remaining_old = int(old_count) if old_count is not None else 1
            remaining_new = int(new_count) if new_count is not None else 1
            start = int(old_start) - (1 if remaining_old else 0)
            if start < cursor or start > len(old_lines):
                raise ReviewError("Invalid source patch range")
            output.extend(old_lines[cursor:start])
            cursor = start
            expected = int(new_start) - (1 if remaining_new else 0)
            if expected != len(output):
                raise ReviewError("Invalid target patch range")
            seen = True
            continue
        if line.startswith("\\ No newline at end of file"):
            continue
        if not seen or not line or line[0] not in " +-":
            raise ReviewError("Invalid source patch")
        marker, content = line[0], line[1:]
        if marker in " -":
            if cursor >= len(old_lines) or old_lines[cursor] != content:
                raise ReviewError("Patch does not match immutable source")
            cursor += 1
            remaining_old -= 1
        if marker in " +":
            output.append(content)
            remaining_new -= 1
        if remaining_old < 0 or remaining_new < 0:
            raise ReviewError("Invalid source patch lengths")
    output.extend(old_lines[cursor:])
    if not seen or remaining_old or remaining_new or output != new_lines:
        raise ReviewError("Incomplete or mismatched source patch")


def source(client, repository: str, path: str, sha: str) -> str:
    if not safe_path(path) or not SHA.fullmatch(sha):
        raise ReviewError("Invalid immutable source reference")
    content = client.get_file(repository, path, sha)
    if len(content) > 128 * 1024:
        raise ReviewError("Source file exceeds 128 KiB")
    if b"\0" in content:
        raise UnicodeError("binary content")
    return content.decode("utf-8")


def build_snapshot(client, repository: str, pr: int, head: str, branch: str, settings: dict) -> dict:
    if not REPOSITORY.fullmatch(repository):
        raise ReviewError("Invalid repository")
    pull = assert_current(client, repository, pr, head, branch)
    base = pull["base"]["sha"]
    if not SHA.fullmatch(base):
        raise ReviewError("Invalid base SHA")
    config_toml = source(client, repository, ".pr_agent.toml", base)
    config = tomllib.loads(config_toml)
    comparison = client.compare(repository, base, head)
    merge_base = comparison.get("merge_base_commit", {}).get("sha", "")
    changed = comparison.get("files")
    if not SHA.fullmatch(merge_base) or not isinstance(changed, list) or len(changed) > 100:
        raise ReviewError("Unsupported comparison or more than 100 changed files")
    files, excluded = [], []
    total = 0
    seen = set()
    for file in changed:
        path = file.get("filename")
        previous = file.get("previous_filename", path)
        if not safe_path(path) or not safe_path(previous) or path in seen:
            raise ReviewError("Invalid or duplicate source path")
        seen.add(path)
        reason = exclusion(path, config)
        if reason:
            excluded.append({"path": path, "reason": reason})
            continue
        status = file.get("status")
        if status not in {"added", "removed", "modified", "renamed", "copied", "changed"}:
            raise ReviewError("Unsupported file change status")
        try:
            before = "" if status == "added" else source(client, repository, previous, merge_base)
            after = "" if status == "removed" else source(client, repository, path, head)
        except UnicodeError:
            # Known binary asset types were excluded explicitly above. An arbitrary
            # source file must not evade required analysis by changing its encoding.
            raise ReviewError("Required source is not UTF-8 text") from None
        patch = file.get("patch", "")
        if before == after and not patch:
            excluded.append({"path": path, "reason": "metadata-only change"})
            continue
        validate_patch(patch, before, after)
        total += len(before.encode()) + len(after.encode()) + len(patch.encode())
        if total > 2 * 1024 * 1024:
            raise ReviewError("Snapshot exceeds 2 MiB")
        files.append(
            {
                "filename": path,
                "old_filename": previous,
                "base_content": before,
                "head_content": after,
                "patch": patch,
                "status": status,
            }
        )
    package = Path(__file__).parent
    adapter_hash = hashlib.sha256()
    for path in sorted(package.glob("*.py")):
        adapter_hash.update(path.name.encode())
        adapter_hash.update(path.read_bytes())
    lockfile = package.parent / "uv.lock"
    adapter_hash.update(lockfile.read_bytes())
    title = pull.get("title", "")[:1000]
    description = pull.get("body", "")[:16000] if pull.get("body") else ""
    source_branch = pull["head"].get("ref", "")
    manifest = {
        "repository": repository,
        "pr": pr,
        "head_sha": head,
        "base_sha": base,
        "merge_base_sha": merge_base,
        "policy_hash": hashlib.sha256(config_toml.encode()).hexdigest(),
        "model": settings["model"],
        "endpoint": settings["base_url"],
        "context_window": settings["context_window"],
        "profile_revision": settings["model_profile_version"],
        "pr_agent_revision": PR_AGENT_REVISION,
        "adapter_version": ADAPTER_VERSION,
        "adapter_hash": adapter_hash.hexdigest(),
        "metadata_hash": digest({"title": title, "description": description, "branch": source_branch}),
    }
    snapshot = {
        "schema_version": 1,
        "repository": repository,
        "pr": pr,
        "head_sha": head,
        "base_sha": base,
        "merge_base_sha": merge_base,
        "target_branch": branch,
        "branch": source_branch,
        "title": title,
        "description": description,
        "config_toml": config_toml,
        "files": files,
        "excluded_files": excluded,
        "manifest": manifest,
        "identity": digest(manifest),
        "settings": settings,
    }
    assert_current(client, repository, pr, head, branch, base)
    return snapshot
