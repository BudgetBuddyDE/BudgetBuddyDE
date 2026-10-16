"""Bounded, source-free diagnostics and independently validated partial findings."""

import json

from .contracts import ReviewError

DIAGNOSTIC_MESSAGES = {
    "missing_structured_review": "Das Werkzeug lieferte kein strukturiertes Review.",
    "invalid_recommendation": "Die Gesamtbewertung fehlt oder hat einen ungültigen Wert.",
    "invalid_review_schema": "Ein Teil des Reviews entspricht nicht dem erwarteten Format.",
    "invalid_suggestions": "Ein Teil der Verbesserungsvorschläge hat ein ungültiges Format.",
    "transport_error": "Die Modellanfrage ist fehlgeschlagen.",
    "incomplete_completion": "Die Modellantwort wurde nicht vollständig abgeschlossen.",
    "incomplete_chunks": "Die Analyseabdeckung ist unvollständig.",
    "command_failed": "PR-Agent meldet einen fehlgeschlagenen Werkzeuglauf.",
    "tool_error": "Das Werkzeug konnte nicht vollständig ausgeführt werden.",
    "analysis_timeout": "Die Analyse hat das Zeitlimit überschritten.",
    "invalid_artifact": "Es liegt kein gültiges Analyse-Artefakt für diesen Snapshot vor.",
    "publication_failed": "Das Review konnte nicht vollständig veröffentlicht werden.",
    "analysis_failed": "Die Analyse wurde nicht erfolgreich abgeschlossen.",
}


def safe_diagnostics(result):
    diagnostics = result.get("diagnostics", []) if isinstance(result, dict) else []
    output = []
    if isinstance(diagnostics, list):
        for item in diagnostics[:100]:
            if not isinstance(item, dict):
                continue
            tool, code = item.get("tool"), item.get("code")
            if (
                isinstance(tool, str)
                and tool in {"review", "improve", "analysis", "publication"}
                and isinstance(code, str)
                and code in DIAGNOSTIC_MESSAGES
                and {"tool": tool, "code": code} not in output
            ):
                output.append({"tool": tool, "code": code})
    return output


def partial_result(result, snapshot):
    """Incomplete artifacts never receive full-review validation or cache eligibility."""
    if (
        not isinstance(result, dict)
        or result.get("schema_version") != 1
        or result.get("identity") != snapshot["identity"]
    ):
        raise ReviewError("Partial analysis belongs to another snapshot")
    try:
        json.dumps(result, allow_nan=False)
    except (ValueError, TypeError):
        raise ReviewError("Invalid partial analysis JSON") from None
    files = {file["filename"]: file for file in snapshot["files"]}
    coverage = result.get("coverage")
    coverage = coverage if isinstance(coverage, dict) else {}
    output = {
        "schema_version": 1,
        "identity": snapshot["identity"],
        "review": {},
        "markdown": "",
        "comments": [],
        "suggestions": [],
        "diagnostics": safe_diagnostics(result),
        "tool_status": {},
        "coverage": {
            "complete": False,
            "required_files": sorted(files),
            "excluded_files": snapshot["excluded_files"],
            "errors": [],
        },
    }
    statuses = result.get("tool_status")
    statuses = statuses if isinstance(statuses, dict) else {}
    for tool in ("review", "improve"):
        status = statuses.get(tool)
        output["tool_status"][tool] = status if status in ("completed", "failed", "not_started") else "failed"
    for key in ("reviewed_files", "improved_files", "improve_not_applicable_files"):
        names = coverage.get(key, [])
        output["coverage"][key] = (
            sorted({name for name in names if isinstance(name, str) and name in files})
            if isinstance(names, list)
            else []
        )
    for kind in ("comments", "suggestions"):
        items = result.get(kind)
        if not isinstance(items, list):
            continue
        for item in items[:1000]:
            if not isinstance(item, dict) or not isinstance(item.get("path"), str):
                continue
            file = files.get(item["path"])
            side, start, end, body = (
                item.get("side", "RIGHT"),
                item.get("start_line"),
                item.get("end_line"),
                item.get("body"),
            )
            if (
                file is None
                or side not in ("LEFT", "RIGHT")
                or type(start) is not int
                or type(end) is not int
                or not 0 < start <= end
                or end > len(file["head_content" if side == "RIGHT" else "base_content"].splitlines())
                or not isinstance(body, str)
                or not body.strip()
                or len(body) > 16000
            ):
                continue
            output[kind].append(
                {"path": item["path"], "side": side, "start_line": start, "end_line": end, "body": body}
            )
    return output
