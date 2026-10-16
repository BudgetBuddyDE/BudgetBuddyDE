"""Conditional immutable S3 cache, isolated from analysis credentials."""

import json
import os
import re

import boto3
from botocore.exceptions import BotoCoreError, ClientError

MAX_BYTES = 4 * 1024 * 1024


class StorageError(RuntimeError):
    pass


class Store:
    def __init__(self, client, bucket):
        self.client = client
        self.bucket = bucket

    @classmethod
    def from_env(cls):
        try:
            return cls(boto3.client("s3"), os.environ["S3_BUCKET"])
        except (KeyError, BotoCoreError):
            raise StorageError("S3 configuration failed") from None

    def load(self, key):
        _identity(key)
        try:
            response = self.client.get_object(Bucket=self.bucket, Key=key)
            with response["Body"] as stream:
                body = stream.read(MAX_BYTES + 1)
            if len(body) > MAX_BYTES:
                raise StorageError("Stored report exceeds size limit")
            envelope = json.loads(body)
            _validate(key, envelope)
            return envelope
        except ClientError as exc:
            if exc.response.get("Error", {}).get("Code") in ("NoSuchKey", "404", "NotFound"):
                return None
            raise StorageError("S3 read failed") from None
        except (BotoCoreError, ValueError, KeyError, TypeError):
            raise StorageError("Invalid stored report or S3 read failure") from None

    def save(self, key, envelope):
        _validate(key, envelope)
        body = json.dumps(envelope, ensure_ascii=False, allow_nan=False).encode()
        if len(body) > MAX_BYTES:
            raise StorageError("Report exceeds size limit")
        try:
            self.client.put_object(
                Bucket=self.bucket, Key=key, Body=body, ContentType="application/json", IfNoneMatch="*"
            )
            return envelope
        except ClientError as exc:
            if exc.response.get("Error", {}).get("Code") in ("PreconditionFailed", "412", "ConditionalRequestConflict"):
                stored = self.load(key)
                if stored is not None:
                    return stored
            raise StorageError("S3 conditional write failed") from None
        except BotoCoreError:
            raise StorageError("S3 write failed") from None


def _identity(key):
    match = re.fullmatch(r"pr-agent/v1/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/[1-9][0-9]*/([a-f0-9]{64})\.json", key)
    if not match:
        raise StorageError("Invalid cache key")
    return match[1]


def _validate(key, envelope):
    if (
        not isinstance(envelope, dict)
        or envelope.get("schema_version") != 1
        or envelope.get("identity") != _identity(key)
        or not isinstance(envelope.get("result"), dict)
    ):
        raise StorageError("Invalid cache identity or schema")
