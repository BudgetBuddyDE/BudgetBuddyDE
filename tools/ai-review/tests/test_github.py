from unittest.mock import Mock

import httpx
import pytest

from ai_review.github import GitHub, GitHubError


def test_request_sanitizes_api_failure():
    session = Mock()
    session.stream.side_effect = httpx.ConnectError("secret token")
    with pytest.raises(GitHubError, match="^GitHub API request failed$"):
        GitHub("secret", 1, session).request("GET", "/app")


def test_comment_requires_exact_bot_identity():
    client = GitHub("token", 1, bot_login="test[bot]", bot_id=42)
    assert client.is_own_comment({"user": {"id": 42, "type": "Bot", "login": "test[bot]"}})
    assert not client.is_own_comment({"user": {"id": 43, "type": "Bot", "login": "test[bot]"}})


def test_file_rejects_symlink_before_loading_blob():
    client = GitHub("token", 1)
    client.request = Mock(return_value={"tree": [{"path": "a", "mode": "120000", "type": "blob", "sha": "x"}]})
    with pytest.raises(GitHubError, match="Symlinks"):
        client.get_file("owner/repo", "a", "a" * 40)
    assert client.request.call_count == 1


def test_file_requires_immutable_reference():
    with pytest.raises(GitHubError, match="immutable"):
        GitHub("token", 1).get_file("owner/repo", "a", "main")


def test_nested_file_reads_verified_blob():
    client = GitHub("token", 1)
    client.request = Mock(
        side_effect=[
            {"tree": [{"path": "src", "mode": "040000", "type": "tree", "sha": "d" * 40}]},
            {"tree": [{"path": "a.py", "mode": "100644", "type": "blob", "sha": "b" * 40, "size": 2}]},
            {"encoding": "base64", "content": "eAo="},
        ]
    )
    assert client.get_file("owner/repo", "src/a.py", "a" * 40) == b"x\n"
    assert client.request.call_args.args[1].endswith("/git/blobs/" + "b" * 40)


def test_http_response_is_bounded_and_redirects_not_followed():
    session = httpx.Client(
        transport=httpx.MockTransport(lambda request: httpx.Response(200, content=b"x" * (8 * 1024 * 1024 + 1)))
    )
    with pytest.raises(GitHubError, match="size limit"):
        GitHub("token", 1, session=session).request("GET", "/app")
    paths = []

    def redirect(request):
        paths.append(str(request.url))
        return httpx.Response(302, headers={"Location": "https://example.com/stolen"})

    session = httpx.Client(transport=httpx.MockTransport(redirect), follow_redirects=True)
    with pytest.raises(GitHubError):
        GitHub("token", 1, session=session).request("GET", "/app")
    assert paths == ["https://api.github.com/app"]
