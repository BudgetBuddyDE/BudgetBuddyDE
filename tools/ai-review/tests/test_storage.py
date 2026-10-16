import io
import json
from unittest.mock import Mock

import pytest
from botocore.exceptions import ClientError

from ai_review.storage import StorageError, Store

KEY = "pr-agent/v1/owner/repo/1/" + "a" * 64 + ".json"
ENVELOPE = {"schema_version": 1, "identity": "a" * 64, "result": {"review": {}}}


def test_save_is_conditional():
    client = Mock()
    assert Store(client, "bucket").save(KEY, ENVELOPE) == ENVELOPE
    assert client.put_object.call_args.kwargs["IfNoneMatch"] == "*"


def test_missing_is_miss_other_errors_fail_closed():
    client = Mock()
    client.get_object.side_effect = ClientError({"Error": {"Code": "NoSuchKey"}}, "GetObject")
    assert Store(client, "bucket").load(KEY) is None
    client.get_object.side_effect = ClientError({"Error": {"Code": "AccessDenied"}}, "GetObject")
    with pytest.raises(StorageError, match="S3 read failed"):
        Store(client, "bucket").load(KEY)


def test_race_loads_winning_result():
    client = Mock()
    client.put_object.side_effect = ClientError({"Error": {"Code": "PreconditionFailed"}}, "PutObject")
    client.get_object.return_value = {"Body": io.BytesIO(json.dumps(ENVELOPE).encode())}
    assert Store(client, "bucket").save(KEY, ENVELOPE) == ENVELOPE


def test_wrong_identity_is_rejected():
    with pytest.raises(StorageError):
        Store(Mock(), "bucket").save(KEY, {**ENVELOPE, "identity": "b" * 64})


def test_environment_uses_pipeline_bucket(monkeypatch):
    monkeypatch.setenv("S3_BUCKET", "review-cache")
    monkeypatch.setattr("ai_review.storage.boto3.client", lambda service: Mock())
    assert Store.from_env().bucket == "review-cache"
