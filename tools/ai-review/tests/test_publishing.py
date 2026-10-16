from unittest.mock import Mock

import pytest

from ai_review.publishing import PublicationError, changed_lines, publish


def fixture():
    client = Mock()
    client.review_comments.return_value = []
    client.issue_comments.return_value = []
    client.is_own_comment.return_value = True
    snapshot = {
        "identity": "a" * 64,
        "head_sha": "b" * 40,
        "files": [
            {
                "filename": "a.py",
                "base_content": "old\n",
                "head_content": "new\n",
                "patch": "@@ -1 +1 @@\n-old\n+new\n",
            }
        ],
    }
    result = {
        "review": {"merge_recommendation": "needs_review"},
        "markdown": "Hinweis",
        "coverage": {"complete": True},
        "comments": [],
        "suggestions": [],
    }
    return client, snapshot, result


def test_changed_lines_handles_deletion_and_addition():
    assert changed_lines("@@ -1,2 +1,2 @@\n same\n-old\n+new") == {"LEFT": {2}, "RIGHT": {2}}


def test_retries_dedupe_own_inline_and_update_summary():
    client, snapshot, result = fixture()
    result["comments"] = [{"path": "a.py", "start_line": 1, "end_line": 1, "body": "Defekt"}]
    publish(client, "owner/repo", 1, snapshot, result)
    inline = client.request.call_args_list[0].args[2]["body"]
    client.review_comments.return_value = [{"body": inline}]
    client.issue_comments.return_value = [{"id": 42, "body": "<!-- pr-agent:summary:v1 -->\nalt"}]
    client.request.reset_mock()
    publish(client, "owner/repo", 1, snapshot, result)
    assert client.request.call_count == 1
    assert client.request.call_args.args[:2] == ("PATCH", "/repos/owner/repo/issues/comments/42")


def test_spoofed_marker_does_not_dedupe():
    client, snapshot, result = fixture()
    client.issue_comments.return_value = [{"id": 1, "body": "<!-- pr-agent:summary:v1 -->"}]
    client.is_own_comment.return_value = False
    publish(client, "owner/repo", 1, snapshot, result)
    assert client.request.call_args.args[0] == "POST"


def test_invalid_location_is_summary_only_without_suggestion_fence():
    client, snapshot, result = fixture()
    result["suggestions"] = [{"path": "a.py", "start_line": 2, "end_line": 2, "body": "```suggestion\nfix\n```"}]
    publish(client, "owner/repo", 1, snapshot, result)
    assert client.request.call_count == 1
    body = client.request.call_args.args[2]["body"]
    assert "fix" in body and "```suggestion" not in body


def test_invalid_body_fails_before_publication():
    client, snapshot, result = fixture()
    result["comments"] = [{"path": "a.py", "start_line": 1, "end_line": 1, "body": None}]
    with pytest.raises(PublicationError):
        publish(client, "owner/repo", 1, snapshot, result)
    client.request.assert_not_called()


def test_duplicate_comments_and_suggestions_only_publish_once():
    client, snapshot, result = fixture()
    item = {"path": "a.py", "start_line": 1, "end_line": 1, "body": "Defekt"}
    result["comments"] = [item, item]
    result["suggestions"] = [item]
    publish(client, "owner/repo", 1, snapshot, result)
    assert client.request.call_count == 2


def test_limit_preserves_overflow_in_summary():
    client, snapshot, result = fixture()
    result["comments"] = [{"path": "a.py", "start_line": 1, "end_line": 1, "body": f"Problem {n}"} for n in range(17)]
    publish(client, "owner/repo", 1, snapshot, result)
    assert client.request.call_count == 16
    body = client.request.call_args.args[2]["body"]
    assert "Problem 15" in body and "Problem 16" in body
