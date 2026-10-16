"""Integration contracts between Concourse tasks and the installed adapter CLI."""

from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[3]
APP_ENV = {"GITHUB_APP_ID", "GITHUB_INSTALLATION_ID", "GITHUB_APP_PRIVATE_KEY", "GITHUB_REPOSITORY"}
STORE_ENV = {"S3_BUCKET", "AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"}
MODEL_ENV = {"LITELLM_BASE_URL", "LITELLM_MODEL", "LITELLM_CONTEXT_WINDOW", "LITELLM_PROFILE_REVISION"}


def read_task(name):
    return yaml.safe_load((ROOT / "ci" / "tasks" / f"{name}-ai-review.task.yml").read_text())


def review_job():
    pipeline = yaml.safe_load((ROOT / "ci" / "general.pipeline.yml").read_text())
    return pipeline, next(job for job in pipeline["jobs"] if job["name"] == "pull-request-ai-review")


def test_pr_resource_and_operational_code_are_trusted():
    pipeline, job = review_job()
    resource_type = next(resource for resource in pipeline["resource_types"] if resource["name"] == "github-pr")
    assert resource_type["source"] == {"repository": "cfcommunity/github-pr-resource", "tag": "0.26.0"}
    resource = next(resource for resource in pipeline["resources"] if resource["type"] == "github-pr")
    assert resource["check_every"] == "1m"
    assert resource["source"]["disable_ci_skip"] is True
    assert job["serial"] is True
    gets = job["plan"][0]["in_parallel"]
    assert {step["get"] for step in gets} == {"ci-source", "repository", "pull-request"}
    pr = next(step for step in gets if step["get"] == "pull-request")
    assert pr["trigger"] is True
    assert pr["version"] == "every"
    assert pr["params"]["integration_tool"] == "checkout"
    build = job["plan"][1]
    assert build["privileged"] is True
    assert build["config"]["params"]["CONTEXT"] == "repository/tools/ai-review"
    assert build["config"]["params"]["UNPACK_ROOTFS"] == "true"
    lifecycle = job["plan"][2]
    assert lifecycle["timeout"] == "15m"
    for step in lifecycle["do"] + [lifecycle[key] for key in ("on_failure", "on_error", "on_abort")]:
        assert step["image"] == "image"
        assert step["file"].startswith("ci-source/ci/tasks/")


def test_task_credentials_are_separated():
    _, job = review_job()
    prepare, analyze, publish = job["plan"][2]["do"]
    assert APP_ENV | STORE_ENV | MODEL_ENV <= prepare["params"].keys()
    assert "LITELLM_API_KEY" not in prepare["params"]
    assert set(analyze["params"]) == MODEL_ENV | {"LITELLM_API_KEY"}
    assert analyze["timeout"] == "10m"
    assert set(publish["params"]) == APP_ENV | STORE_ENV
    for hook in ("on_failure", "on_error", "on_abort"):
        assert set(job["plan"][2][hook]["params"]) == APP_ENV | {"REVIEW_CONCLUSION"}


def test_task_artifacts_and_cli_contract():
    expected = {
        "prepare": (
            ["pull-request"],
            ["prepared"],
            ["prepare", "--pr-resource", "pull-request", "--output", "prepared"],
        ),
        "analyze": (["prepared"], ["analyzed"], ["analyze", "--input", "prepared", "--output", "analyzed"]),
        "publish": (["prepared", "analyzed"], [], ["publish", "--input", "prepared", "--result", "analyzed"]),
    }
    for command, (inputs, outputs, arguments) in expected.items():
        task = read_task(command)
        assert [item["name"] for item in task["inputs"]] == inputs
        assert [item["name"] for item in task.get("outputs", [])] == outputs
        assert task["run"] == {"path": "python", "args": ["-m", "ai_review", *arguments]}
    finalize = read_task("finalize")
    assert finalize["inputs"] == [{"name": "prepared", "optional": True}, {"name": "analyzed", "optional": True}]
    assert '--conclusion "$REVIEW_CONCLUSION"' in finalize["run"]["args"][-1]
    assert "--result analyzed" in finalize["run"]["args"][-1]
