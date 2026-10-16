"""Offline PR-Agent provider: every read is pinned to a prepared immutable snapshot."""

from copy import deepcopy
from types import SimpleNamespace

from pr_agent.algo.types import EDIT_TYPE, FilePatchInfo
from pr_agent.git_providers.git_provider import GitProvider


class SnapshotGitProvider(GitProvider):
    def __init__(self, pr_url=None, snapshot=None):
        if snapshot is None:
            raise ValueError("A prepared snapshot is required")
        self.snapshot = deepcopy(snapshot)
        self.pr_url = pr_url or "snapshot://review"
        self.pr = SimpleNamespace(title=snapshot.get("title", "Pull request"))
        self.markdown = []
        self.structured_review = None
        self.suggestions = []
        self.comments = []
        self.analysis_tool = "review"

    def is_supported(self, capability):
        return capability in {"gfm_markdown"}

    def get_diff_files(self):
        # PR-Agent mutates FilePatchInfo while packing. Never expose snapshot objects.
        edit_types = {
            "added": EDIT_TYPE.ADDED,
            "deleted": EDIT_TYPE.DELETED,
            "removed": EDIT_TYPE.DELETED,
            "renamed": EDIT_TYPE.RENAMED,
            "modified": EDIT_TYPE.MODIFIED,
        }
        return [
            FilePatchInfo(
                base_file=f["base_content"],
                head_file=f["head_content"],
                patch=f["patch"],
                filename=f["filename"],
                old_filename=f.get("old_filename"),
                # The pinned engine replaces DELETED with a filename-only notice.
                # Review deletions as empty-file modifications to retain the exact old hunk.
                edit_type=(
                    EDIT_TYPE.MODIFIED
                    if f["status"] in {"removed", "deleted"} and self.analysis_tool == "review"
                    else edit_types.get(f["status"], EDIT_TYPE.UNKNOWN)
                ),
            )
            for f in self.snapshot["files"]
            if not (self.analysis_tool == "improve" and f["status"] in {"removed", "deleted"})
        ]

    def get_files(self):
        return [f.filename for f in self.get_diff_files()]

    def get_filtered_diff_file_names(self):
        return []

    def get_languages(self):
        return {}

    def get_pr_title(self):
        return self.pr.title

    def get_pr_branch(self):
        return self.snapshot.get("branch", "")

    def get_user_id(self):
        return "ai-review"

    def get_pr_description_full(self):
        return self.snapshot.get("description", "")

    def get_pr_head_sha(self):
        return self.snapshot.get("head_sha", "")

    def get_commit_messages(self):
        return self.snapshot.get("commits", "")

    def get_repo_settings(self):
        return ""

    def publish_description(self, pr_title, pr_body):
        raise RuntimeError("Snapshot provider cannot alter a pull request")

    def publish_structured_review(self, review):
        self.structured_review = deepcopy(review)

    def publish_comment(self, pr_comment, is_temporary=False, **kwargs):
        if not is_temporary:
            self.markdown.append(pr_comment)
        return SimpleNamespace(body=pr_comment, id=0)

    def publish_code_suggestions(self, code_suggestions):
        self.suggestions.extend(deepcopy(code_suggestions))
        return True

    def supports_code_suggestions_artifact(self):
        return True

    def publish_code_suggestions_artifact(self, code_suggestions, artifact_footer="", **kwargs):
        self.suggestions.extend(deepcopy(code_suggestions))
        if artifact_footer:
            self.markdown.append(artifact_footer)
        return True

    def publish_inline_comment(self, body, relevant_file, relevant_line_in_file, original_suggestion=None):
        self.comments.append({"body": body, "path": relevant_file, "line": relevant_line_in_file})
        return True

    def publish_inline_comments(self, comments):
        self.comments.extend(deepcopy(comments))
        return True

    def remove_initial_comment(self):
        pass

    def remove_comment(self, comment):
        pass

    def get_issue_comments(self):
        return []

    def publish_labels(self, labels):
        pass

    def get_pr_labels(self, update=False):
        return []

    def remove_reaction(self, issue_comment_id, reaction_id):
        return False
