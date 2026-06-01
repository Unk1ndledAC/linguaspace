from __future__ import annotations

from typing import Any

from .runtime_store import runtime


def _terms_by_language(language: str) -> list[dict[str, Any]]:
    return [term for term in list_terms() if term.get("language") == language]


def apply_glossary_to_zh(text: str, source_language: str) -> dict[str, Any]:
    if source_language in ("zh", "zh-CN", "中文"):
        return {"text": text, "language": "zh", "engine": "identity", "term_hits": []}
    translated = text
    hits = []
    for term in _terms_by_language(source_language):
        translation = term.get("translation")
        zh_name = term.get("zh_name")
        if translation and zh_name and translation in translated:
            translated = translated.replace(translation, zh_name)
            hits.append({"source": translation, "translation": zh_name})
    return {"text": translated, "language": "zh", "engine": "glossary-reverse", "term_hits": hits}


def list_terms() -> list[dict[str, Any]]:
    return runtime._all("terms")


def translate(text: str, target_language: str) -> dict[str, Any]:
    if target_language in ("zh", "zh-CN", "中文"):
        return {"text": text, "language": "zh", "engine": "identity", "term_hits": []}
    hits = []
    translated = text
    for term in _terms_by_language(target_language):
        zh_name = term.get("zh_name")
        translation = term.get("translation")
        if zh_name and translation and zh_name in translated:
            translated = translated.replace(zh_name, translation)
            hits.append({"source": zh_name, "translation": translation})
    return {
        "text": translated,
        "language": target_language,
        "engine": "glossary",
        "term_hits": hits,
        "note": "当前版本使用 MySQL 术语库保证多语名称一致性，可继续接入 NLLB 或云端翻译适配器扩展全文翻译。",
    }
