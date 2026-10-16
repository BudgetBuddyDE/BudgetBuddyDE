"""GitHub App API boundary. Error messages never include response bodies or credentials."""

import json
import os
import re
import time
from urllib.parse import quote

import httpx
import jwt


class GitHubError(RuntimeError):
    pass


class GitHub:
    def __init__(self, token, app_id, session=None, bot_login=None, bot_id=None):
        self.app_id = int(app_id)
        self.session = session or httpx.Client(timeout=40)
        self.token = token
        self.bot_login = bot_login
        self.bot_id = bot_id

    @classmethod
    def from_env(cls, repository=None):
        try:
            app_id = int(os.environ["GITHUB_APP_ID"])
            installation = int(os.environ["GITHUB_INSTALLATION_ID"])
            now = int(time.time())
            assertion = jwt.encode(
                {"iat": now - 60, "exp": now + 540, "iss": str(app_id)},
                os.environ["GITHUB_APP_PRIVATE_KEY"],
                algorithm="RS256",
            )
            client = cls(assertion, app_id)
            app = client.request("GET", "/app")
            if app.get("id") != app_id or not re.fullmatch(r"[a-zA-Z0-9_-]+", app.get("slug", "")):
                raise GitHubError("Invalid GitHub App identity")
            repo = repository or os.environ["GITHUB_REPOSITORY"]
            _repo(repo)
            response = client.request(
                "POST",
                f"/app/installations/{installation}/access_tokens",
                {
                    "repositories": [repo.split("/")[1]],
                    "permissions": {"contents": "read", "pull_requests": "write", "checks": "write"},
                },
            )
            client.token = response["token"]
            client.bot_login = app["slug"] + "[bot]"
            bot = client.request("GET", "/users/" + quote(client.bot_login, safe=""))
            if bot.get("type") != "Bot" or bot.get("login") != client.bot_login:
                raise GitHubError("Invalid GitHub App bot identity")
            client.bot_id = bot["id"]
            return client
        except (KeyError, ValueError, jwt.PyJWTError):
            raise GitHubError("Invalid GitHub App configuration") from None

    def request(self, method, path, payload=None):
        if not path.startswith("/") or path.startswith("//"):
            raise GitHubError("Invalid GitHub API path")
        try:
            with self.session.stream(
                method,
                "https://api.github.com" + path,
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                json=payload,
                follow_redirects=False,
            ) as response:
                response.raise_for_status()
                body = bytearray()
                for chunk in response.iter_bytes(chunk_size=65536):
                    body.extend(chunk)
                    if len(body) > 8 * 1024 * 1024:
                        raise GitHubError("GitHub response exceeds size limit")
                return json.loads(body) if body else None
        except (httpx.HTTPError, ValueError):
            raise GitHubError("GitHub API request failed") from None

    def pages(self, path):
        output = []
        for page in range(1, 101):
            data = self.request("GET", f"{path}{'&' if '?' in path else '?'}per_page=100&page={page}")
            if not isinstance(data, list):
                raise GitHubError("Invalid GitHub pagination response")
            output.extend(data)
            if len(data) < 100:
                return output
        raise GitHubError("GitHub pagination limit exceeded")

    def get_pull(self, repo, pr):
        return self.request("GET", f"/repos/{_repo(repo)}/pulls/{int(pr)}")

    def compare(self, repo, base, head):
        return self.request("GET", f"/repos/{_repo(repo)}/compare/{quote(base, safe='')}...{quote(head, safe='')}")

    def get_file(self, repo, path, ref):
        if not re.fullmatch(r"[0-9a-f]{40}", ref):
            raise GitHubError("File reference must be immutable")
        parts = path.split("/")
        if any(part in ("", ".", "..") for part in parts):
            raise GitHubError("Invalid GitHub file path")
        tree_ref = ref
        for index, part in enumerate(parts):
            tree = self.request("GET", f"/repos/{_repo(repo)}/git/trees/{tree_ref}")
            if tree.get("truncated"):
                raise GitHubError("Incomplete Git tree")
            matches = [entry for entry in tree.get("tree", []) if entry.get("path") == part]
            if len(matches) != 1:
                raise GitHubError("File missing from immutable Git tree")
            entry = matches[0]
            final = index == len(parts) - 1
            if (
                final
                and (entry.get("type") != "blob" or entry.get("mode") not in ("100644", "100755"))
                or not final
                and (entry.get("type") != "tree" or entry.get("mode") != "040000")
            ):
                raise GitHubError("Symlinks and submodules are not supported")
            tree_ref = entry["sha"]
        if entry.get("size", 0) > 128 * 1024:
            raise GitHubError("File exceeds analysis size limit")
        data = self.request("GET", f"/repos/{_repo(repo)}/git/blobs/{tree_ref}")
        if not isinstance(data, dict) or data.get("encoding") != "base64":
            raise GitHubError("Unsupported GitHub file type")
        import base64

        try:
            content = base64.b64decode(data["content"].replace("\n", ""), validate=True)
            if len(content) > 128 * 1024:
                raise GitHubError("File exceeds analysis size limit")
            return content
        except (ValueError, KeyError):
            raise GitHubError("Invalid GitHub file response") from None

    def create_check(self, repo, head, external_id):
        return self.request(
            "POST",
            f"/repos/{_repo(repo)}/check-runs",
            {
                "name": "ai-review/gate",
                "head_sha": head,
                "external_id": external_id,
                "status": "in_progress",
            },
        )["id"]

    def update_check(self, repo, check_id, conclusion, title="", summary=""):
        return self.request(
            "PATCH",
            f"/repos/{_repo(repo)}/check-runs/{int(check_id)}",
            {
                "status": "completed",
                "conclusion": conclusion,
                "output": {"title": title or "KI-Review", "summary": summary[:60000] or conclusion},
            },
        )

    def issue_comments(self, repo, pr):
        return self.pages(f"/repos/{_repo(repo)}/issues/{int(pr)}/comments")

    def review_comments(self, repo, pr):
        return self.pages(f"/repos/{_repo(repo)}/pulls/{int(pr)}/comments")

    def is_own_comment(self, comment):
        user = comment.get("user", {})
        return user.get("type") == "Bot" and (
            (self.bot_id is not None and user.get("id") == self.bot_id and user.get("login") == self.bot_login)
            or comment.get("performed_via_github_app", {}).get("id") == self.app_id
        )


def _repo(repo):
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo):
        raise GitHubError("Invalid repository")
    return repo


Client = GitHub
