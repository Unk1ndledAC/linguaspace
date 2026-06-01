from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

from .config import settings


def server_asr_available() -> bool:
    try:
        from faster_whisper import WhisperModel  # noqa: F401

        return True
    except ImportError:
        return False


def normalize_transcript(text: str) -> str:
    try:
        from opencc import OpenCC

        text = OpenCC("t2s").convert(text)
    except ImportError:
        pass
    replacements = {"大礼故城": "大理古城", "丽江故城": "丽江古城", "西双板纳": "西双版纳", "三到茶": "三道茶"}
    for source, target in replacements.items():
        text = text.replace(source, target)
    return text


@lru_cache(maxsize=1)
def _model():
    from faster_whisper import WhisperModel

    return WhisperModel(settings.whisper_model, device="cpu", compute_type="int8")


def transcribe(path: Path) -> dict[str, Any]:
    try:
        segments, info = _model().transcribe(str(path), beam_size=3)
        raw_text = "".join(segment.text for segment in segments).strip()
        return {"text": normalize_transcript(raw_text), "raw_text": raw_text, "language": info.language, "engine": "faster-whisper", "available": True}
    except ImportError as exc:
        raise RuntimeError("faster-whisper is required for server ASR") from exc
    except Exception as exc:
        raise RuntimeError(f"server ASR failed: {exc}") from exc
