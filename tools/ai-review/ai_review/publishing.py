"""Idempotent, App-owned GitHub comments validated against the immutable diff."""

import hashlib
import json
import re


class PublicationError(RuntimeError):
    pass


def changed_lines(patch):
    lines = {"LEFT": set(), "RIGHT": set()}
    old = new = None
    for line in patch.splitlines():
        match = re.match(r"^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@", line)
        if match:
            old, new = int(match[1]), int(match[2])
        elif old is None or line.startswith("\\"):
            continue
        elif line.startswith("+"):
            lines["RIGHT"].add(new)
            new += 1
        elif line.startswith("-"):
            lines["LEFT"].add(old)
            old += 1
        elif line.startswith(" "):
            old += 1
            new += 1
    return lines


def publish(client, repository, pr, snapshot, result):
    files = {file["filename"]: file for file in snapshot["files"]}
    candidates = []
    fallback = []
    seen = set()
    for kind in ("comments", "suggestions"):
        for item in result.get(kind, []):
            if not isinstance(item, dict):
                raise PublicationError("Invalid inline comment")
            file = files.get(item.get("path"))
            side = item.get("side", "RIGHT")
            start, end = item.get("start_line"), item.get("end_line")
            body = item.get("body")
            if not isinstance(body, str) or not body.strip():
                raise PublicationError("Invalid inline body")
            canonical = {**item, "side": side}
            fingerprint = hashlib.sha256(json.dumps(canonical, sort_keys=True).encode()).hexdigest()[:24]
            if fingerprint in seen:
                continue
            seen.add(fingerprint)
            if (
                not file
                or side not in ("LEFT", "RIGHT")
                or type(start) is not int
                or type(end) is not int
                or start < 1
                or end < start
            ):
                fallback.append(canonical)
                continue
            valid = changed_lines(file["patch"])[side]
            content = file["head_content" if side == "RIGHT" else "base_content"]
            if end > len(content.splitlines()) or not set(range(start, end + 1)).issubset(valid):
                fallback.append(canonical)
                continue
            if "```suggestion" in body and (kind != "suggestions" or side != "RIGHT"):
                fallback.append(canonical)
                continue
            marker = f"<!-- pr-agent:inline:{snapshot['identity']}:{fingerprint} -->"
            candidates.append((canonical, marker))

    summary_marker = "<!-- pr-agent:summary:v1 -->"
    summary = (
        f"{summary_marker}\n## KI-Review\n\n"
        f"Geprüfter Commit: `{snapshot['head_sha']}`\n\n"
        f"Bewertung: **{result['review']['merge_recommendation']}**\n\n"
        f"{result.get('markdown', '')}\n\n"
        f"Analyseabdeckung: {json.dumps(result['coverage'], ensure_ascii=False)}"
    )
    overflow = [item for item, _ in candidates[15:]] + fallback
    if overflow:
        summary += "\n\n### Weitere Hinweise\n\n" + "\n\n".join(
            f"`{item.get('path', 'unbekannt')}:{item.get('start_line', '?')}-{item.get('end_line', '?')}`\n\n"
            + re.sub(r"```suggestion[^\n]*", "```text", item["body"])
            for item in overflow
        )
    if len(summary) > 60000 or any(len(item["body"]) > 59000 for item, _ in candidates):
        raise PublicationError("Review exceeds GitHub comment size limit")

    existing_inline = client.review_comments(repository, pr)
    own_markers = {
        comment.get("body", "").splitlines()[0]
        for comment in existing_inline
        if client.is_own_comment(comment) and comment.get("body")
    }
    for item, marker in candidates[:15]:
        if marker in own_markers:
            continue
        payload = {
            "body": marker + "\n" + item["body"],
            "commit_id": snapshot["head_sha"],
            "path": item["path"],
            "line": item["end_line"],
            "side": item.get("side", "RIGHT"),
        }
        if item["start_line"] != item["end_line"]:
            payload.update(start_line=item["start_line"], start_side=item.get("side", "RIGHT"))
        client.request("POST", f"/repos/{repository}/pulls/{pr}/comments", payload)
        own_markers.add(marker)

    summaries = [
        comment
        for comment in client.issue_comments(repository, pr)
        if client.is_own_comment(comment) and comment.get("body", "").splitlines()[:1] == [summary_marker]
    ]
    if summaries:
        client.request("PATCH", f"/repos/{repository}/issues/comments/{summaries[0]['id']}", {"body": summary})
    else:
        client.request("POST", f"/repos/{repository}/issues/{pr}/comments", {"body": summary})
