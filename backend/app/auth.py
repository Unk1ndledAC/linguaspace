from __future__ import annotations

import base64
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json

from .config import settings


def _encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def issue_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "role": user["role"],
        "exp": int((datetime.now(timezone.utc) + timedelta(hours=12)).timestamp()),
    }
    encoded = _encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(settings.app_secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest()
    return f"{encoded}.{_encode(signature)}"


def verify_token(token: str) -> dict:
    encoded, signature = token.split(".", 1)
    expected = hmac.new(settings.app_secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest()
    if not hmac.compare_digest(expected, _decode(signature)):
        raise ValueError("invalid signature")
    payload = json.loads(_decode(encoded))
    if payload["exp"] < int(datetime.now(timezone.utc).timestamp()):
        raise ValueError("expired token")
    return payload
