from __future__ import annotations

from typing import Any

from .runtime_store import runtime


def list_terms() -> list[dict[str, Any]]:
    return runtime._all("terms")


def translate(text: str, target_language: str) -> dict[str, Any]:
    if target_language in ("zh", "zh-CN", "中文"):
        return {"text": text, "language": "zh", "engine": "identity", "term_hits": []}
    hits = []
    translated = text
    for term in list_terms():
        if term["language"] == target_language and term["zh_name"] in translated:
            translated = translated.replace(term["zh_name"], term["translation"])
            hits.append({"source": term["zh_name"], "translation": term["translation"]})
    return {"text": translated, "language": target_language, "engine": "glossary-fallback", "term_hits": hits, "note": "当前单机版优先保证术语一致性，可配置 NLLB 或云端翻译适配器扩展全文翻译。"}
