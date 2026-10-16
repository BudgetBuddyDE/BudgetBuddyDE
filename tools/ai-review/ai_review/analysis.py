"""Run the unmodified, pinned PR-Agent engines against an offline provider."""

import asyncio
import re
import tomllib
from copy import deepcopy

from pr_agent.config_loader import global_settings
from pr_agent.git_providers import register_git_provider
from starlette_context import request_cycle_context

from .provider import SnapshotGitProvider

PR_AGENT_SHA = "95a3cd0dacfbab14803eacc7cdac68c82d8d0af9"
RECOMMENDATIONS = {"no_concerns_found", "needs_review", "changes_required"}
# Native knobs that cannot select endpoints, execute commands, or load PR-local context.
CONFIG_FIELDS = {
    "pr_reviewer": {"extra_instructions", "require_tests_review", "require_security_review"},
    "pr_code_suggestions": {"extra_instructions", "num_code_suggestions_per_chunk", "suggestions_score_threshold"},
}


def build_settings(snapshot, settings):
    global_settings.as_dict()  # Materialize lazy defaults before cloning and overriding sections.
    config = deepcopy(global_settings)
    for section, values in tomllib.loads(snapshot.get("config_toml", "")).items():
        if section not in CONFIG_FIELDS or not isinstance(values, dict) or set(values) - CONFIG_FIELDS[section]:
            raise ValueError(f"Unsupported trusted PR-Agent configuration section or key: {section}")
        for key, value in values.items():
            config.set(f"{section}.{key}", value)
    model = settings["model"]
    if not isinstance(model, str) or not re.fullmatch(r"[A-Za-z0-9_.:/-]+", model):
        raise ValueError("Invalid model alias")
    model = model if model.startswith("openai/") else "openai/" + model
    context_window = int(settings["context_window"])
    if context_window < 8192:
        raise ValueError("context_window must be at least 8192")
    overrides = {
        "config.git_provider": "budgetbuddy-snapshot",
        "config.model": model,
        "config.model_weak": model,
        "config.model_reasoning": model,
        "config.custom_model_max_tokens": context_window,
        "config.max_model_tokens": context_window,
        "config.fallback_models": [],
        # The proxy alias hides model capabilities; let LiteLLM choose sampling defaults.
        "config.no_temperature_models": [model],
        "config.use_repo_settings_file": False,
        "config.enable_per_directory_settings": False,
        "config.extra_config_url": "",
        "config.repo_context_files": [],
        "config.publish_output": True,
        "config.publish_output_progress": False,
        "config.output_run_details": False,
        "config.verbosity_level": 0,
        "config.enable_ai_metadata": False,
        "config.response_language": "de-DE",
        "config.retry_same_model_on_timeout": False,
        "config.num_retries": 0,
        "config.ignore_language_framework": [],
        "config.use_extra_bad_extensions": False,
        "bad_extensions.default": [],
        "ignore.glob": [],
        "ignore.regex": [],
        "pr_reviewer.require_merge_recommendation": True,
        "pr_reviewer.enable_large_pr_chunking": True,
        "pr_reviewer.max_number_of_calls": 3,
        "pr_reviewer.inline_key_issues": False,
        "pr_reviewer.persistent_comment": False,
        "pr_code_suggestions.max_number_of_calls": 3,
        "pr_code_suggestions.decouple_hunks": True,
        "pr_code_suggestions.summarize": False,
        "openai.api_base": settings["base_url"],
        "openai.key": settings["api_key"],
        "litellm.enable_callbacks": False,
    }
    for key, value in overrides.items():
        config.set(key, value)
    return config


def _tool_coverage(tool, required, *, review):
    failure_key = "review_failed_chunk_count" if review else "failed_chunk_count"
    lists = [getattr(tool, key, None) for key in ("remaining_files_list", "partial_files_list")]
    failures = getattr(tool, failure_key, None)
    parses = getattr(tool, "parse_failure_count", None) if not review else 0
    if (
        any(not isinstance(value, (list, tuple)) or any(not isinstance(path, str) for path in value) for value in lists)
        or type(failures) is not int
        or failures < 0
        or type(parses) is not int
        or parses < 0
    ):
        return [], ["Fehlende oder ungültige PR-Agent-Abdeckungsdaten"]
    missing, partial = (set(value) for value in lists)
    failed = failures + parses
    errors = []
    if missing:
        errors.append("Nicht analysierte Dateien: " + ", ".join(sorted(missing)))
    if partial:
        errors.append("Unvollständige Dateien: " + ", ".join(sorted(partial)))
    if failed:
        errors.append(f"{failed} fehlgeschlagene Analyse-Chunks")
    # Chunks with unknown coverage cannot confer full-file credit.
    covered = sorted(set(required) - missing - partial) if not failed else []
    return covered, errors


def _deletion_coverage_errors(tool, files):
    """Fail closed when native token compression discards required deletion hunks."""
    chunks = getattr(tool, "_chunked_patches_diff_list", None)
    diffs = chunks if isinstance(chunks, list) else [getattr(tool, "patches_diff", "")]
    errors = []
    for file in files:
        expected = [line for line in file["patch"].splitlines() if line.startswith("-") and line[1:].strip()]
        if not expected:
            continue
        file_sections = []
        marker = f"## File: '{file['filename']}'"
        for diff in diffs:
            if isinstance(diff, str) and marker in diff:
                file_sections.append(diff.split(marker, 1)[1].split("\n## File:", 1)[0])
        visible = "\n".join(file_sections)
        if any(line not in visible for line in expected):
            errors.append(f"Gelöschter Inhalt wurde nicht vollständig analysiert: {file['filename']}")
    return errors


def _normalize_issues(review, files):
    removed = {file["filename"] for file in files if file["status"] in {"removed", "deleted"}}
    comments = []
    for issue in review.get("key_issues_to_review", []):
        if (
            not isinstance(issue, dict)
            or not isinstance(issue.get("relevant_file"), str)
            or not issue["relevant_file"].strip()
            or not isinstance(issue.get("issue_content"), str)
            or not issue["issue_content"].strip()
            or len(issue["issue_content"]) > 16000
            or type(issue.get("start_line")) is not int
            or type(issue.get("end_line")) is not int
            or not 0 < issue["start_line"] <= issue["end_line"]
        ):
            raise ValueError("Invalid review finding")
        comments.append(
            {
                "path": issue["relevant_file"].strip(),
                "start_line": int(issue["start_line"]),
                "end_line": int(issue["end_line"]),
                "side": "LEFT" if issue["relevant_file"].strip() in removed else "RIGHT",
                "body": str(issue["issue_content"]),
            }
        )
    return comments


def _normalize_suggestions(data, files):
    heads = {file["filename"]: file["head_content"].splitlines() for file in files}
    suggestions = []
    for suggestion in data:
        code = suggestion["improved_code"]
        if not isinstance(code, str) or "```" in code:
            raise ValueError("Suggestion contains an unsafe or invalid code fence")
        explanation_text = suggestion["suggestion_content"]
        if not isinstance(explanation_text, str) or "```" in explanation_text or "~~~" in explanation_text:
            raise ValueError("Suggestion explanation contains an invalid code fence")
        if (
            not isinstance(suggestion.get("relevant_file"), str)
            or not suggestion["relevant_file"].strip()
            or not isinstance(suggestion.get("existing_code"), str)
            or type(suggestion.get("relevant_lines_start")) is not int
            or type(suggestion.get("relevant_lines_end")) is not int
            or not 0 < suggestion["relevant_lines_start"] <= suggestion["relevant_lines_end"]
        ):
            raise ValueError("Invalid suggestion location")
        path = suggestion["relevant_file"].strip()
        start, end = suggestion["relevant_lines_start"], suggestion["relevant_lines_end"]
        existing = suggestion["existing_code"]
        applicable = (
            isinstance(existing, str)
            and path in heads
            and 0 < start <= end <= len(heads[path])
            and heads[path][start - 1 : end] == existing.splitlines()
        )
        fence = "suggestion" if applicable else "text"
        explanation = (
            ""
            if applicable
            else "\n\nHinweis: Der ursprüngliche Code stimmt nicht exakt überein. Bitte manuell prüfen."
        )
        if len(explanation_text + explanation + code) > 15900:
            raise ValueError("Suggestion body is oversized")
        suggestions.append(
            {
                "path": path,
                "start_line": int(suggestion["relevant_lines_start"]),
                "end_line": int(suggestion["relevant_lines_end"]),
                "side": "RIGHT",
                "body": explanation_text + explanation + "\n\n```" + fence + "\n" + code + "\n```",
            }
        )
    return suggestions


async def _analyze(snapshot, settings, checkpoint=None):
    from pr_agent.algo.ai_handlers.litellm_ai_handler import LiteLLMAIHandler
    from pr_agent.algo.output_models import PRCodeSuggestions as SuggestionsModel
    from pr_agent.algo.output_models import PRCodeSuggestionsFeedback, PRReview
    from pr_agent.algo.run_details import command_failed, get_run_details
    from pr_agent.algo.utils import load_yaml
    from pr_agent.tools.pr_code_suggestions import PRCodeSuggestions
    from pr_agent.tools.pr_reviewer import PRReviewer

    config = build_settings(snapshot, settings)
    register_git_provider("budgetbuddy-snapshot", SnapshotGitProvider)
    provider = SnapshotGitProvider("snapshot://review", snapshot)
    required = provider.get_files()
    result = {
        "schema_version": 1,
        "review": {},
        "diagnostics": [],
        "comments": [],
        "suggestions": [],
        "markdown": "",
        "coverage": {
            "complete": False,
            "required_files": required,
            "reviewed_files": [],
            "improved_files": [],
            "improve_not_applicable_files": [],
            "excluded_files": snapshot.get("excluded_files", []),
            "errors": [],
        },
        "usage": {},
        "tool_status": {"review": "not_started", "improve": "not_started"},
    }
    if not required:
        result["review"] = {"merge_recommendation": "no_concerns_found", "key_issues_to_review": []}
        result["coverage"]["complete"] = True
        result["tool_status"] = {"review": "completed", "improve": "completed"}
        return result

    def save():
        result["markdown"] = "\n\n".join(provider.markdown)
        if checkpoint is not None:
            checkpoint(deepcopy(result))

    def diagnose(tool, code):
        item = {"tool": tool, "code": code}
        if item not in result["diagnostics"]:
            result["diagnostics"].append(item)
            result["coverage"]["errors"].append(f"{tool}: {code}")

    save()
    with request_cycle_context({"settings": config, "git_provider": {"snapshot://review": provider}}):
        for name, factory in (("review", PRReviewer), ("improve", PRCodeSuggestions)):
            provider.analysis_tool = name
            eligible = provider.get_files()
            if name == "improve":
                result["coverage"]["improve_not_applicable_files"] = sorted(set(required) - set(eligible))
            if not eligible:
                result["tool_status"][name] = "completed"
                save()
                continue
            tool = None
            try:

                class ValidatingHandler(LiteLLMAIHandler):
                    async def chat_completion(self, *args, _tool=name, **kwargs):
                        try:
                            response, finish = await super().chat_completion(*args, **kwargs)
                        except Exception:
                            diagnose(_tool, "transport_error")
                            raise
                        if finish != "stop":
                            diagnose(_tool, "incomplete_completion")
                        if _tool == "improve":
                            try:
                                payload = load_yaml(response)
                                suggestions = payload.get("code_suggestions") if isinstance(payload, dict) else None
                                if not isinstance(suggestions, list):
                                    raise TypeError("Malformed suggestions response")
                                if suggestions and "suggestion_score" in suggestions[0]:
                                    PRCodeSuggestionsFeedback.model_validate(payload)
                                else:
                                    SuggestionsModel.model_validate(payload)
                            except Exception:
                                diagnose(_tool, "invalid_suggestions")
                                raise
                        return response, finish

                tool = factory("snapshot://review", ai_handler=ValidatingHandler)
                await tool.run()
                if command_failed():
                    diagnose(name, "command_failed")
            except Exception:  # noqa: BLE001 - upstream messages may contain source or secrets.
                diagnose(name, "tool_error")
            # Extract independently valid findings even when the overall tool run failed.
            if name == "review":
                payload = provider.structured_review
                review = payload.get("review") if isinstance(payload, dict) else None
                if not isinstance(review, dict):
                    diagnose(name, "missing_structured_review")
                else:
                    issues = review.get("key_issues_to_review", [])
                    if not isinstance(issues, list):
                        diagnose(name, "invalid_review_schema")
                    else:
                        for issue in issues[:1000]:
                            try:
                                result["comments"].extend(
                                    _normalize_issues({"key_issues_to_review": [issue]}, snapshot["files"])
                                )
                            except (KeyError, ValueError, TypeError, AttributeError):
                                diagnose(name, "invalid_review_schema")
                    recommendation = review.get("merge_recommendation")
                    if not isinstance(recommendation, str) or recommendation not in RECOMMENDATIONS:
                        diagnose(name, "invalid_recommendation")
                    else:
                        result["review"] = deepcopy(review)
                    try:
                        PRReview.model_validate({"review": review})
                    except ValueError:
                        diagnose(name, "invalid_review_schema")
            else:
                data = getattr(tool, "data", None)
                suggestions = data.get("code_suggestions") if isinstance(data, dict) else None
                if not isinstance(suggestions, list):
                    diagnose(name, "invalid_suggestions")
                else:
                    for suggestion in suggestions[:1000]:
                        try:
                            result["suggestions"].extend(_normalize_suggestions([suggestion], snapshot["files"]))
                        except (KeyError, ValueError, TypeError, AttributeError):
                            diagnose(name, "invalid_suggestions")
            covered, errors = _tool_coverage(tool, eligible, review=name == "review")
            if name == "review":
                errors.extend(_deletion_coverage_errors(tool, snapshot["files"]))
            if errors:
                diagnose(name, "incomplete_chunks")
            result["coverage"]["reviewed_files" if name == "review" else "improved_files"] = covered
            result["tool_status"][name] = (
                "failed" if any(item["tool"] == name for item in result["diagnostics"]) else "completed"
            )
            details = get_run_details()
            if details is not None and details.has_token_usage:
                result["usage"][name] = {
                    "prompt_tokens": details.prompt_tokens,
                    "completion_tokens": details.completion_tokens,
                    "total_tokens": details.total_tokens,
                }
            save()
    result["coverage"]["complete"] = not result["coverage"]["errors"] and all(
        value == "completed" for value in result["tool_status"].values()
    )
    save()
    return result


def analyze(snapshot: dict, settings: dict, checkpoint=None) -> dict:
    """Synchronous entry point; callers persist the returned result, including failed coverage."""

    async def run():
        async with asyncio.timeout(600):
            return await _analyze(snapshot, settings, checkpoint)

    return asyncio.run(run())
