from __future__ import annotations

import json
import re
from typing import Any

from .config import settings
from .providers import provider

ABUSE = ("受着", "活该", "闭嘴", "滚", "老头", "老太太", "傻", "蠢", "废物", "别烦")
DANGEROUS = ("随便拍", "随便吃", "直接吃", "继续爬", "不用管", "不用就医", "翻护栏", "自行采摘")
SAFETY = ("高反", "高原反应", "头痛", "胸闷", "呼吸", "缺氧", "晕", "受伤", "急救", "危险")
SAFETY_ACTIONS = ("停止", "暂停", "休息", "补水", "保暖", "吸氧", "下撤", "就医", "医院", "120", "求助", "联系")
METRICS = ("内容准确度", "讲解完整度", "服务应对", "文化与边界敏感度")
STOP_PHRASES = ("我会", "可以", "需要", "建议", "应该", "游客", "导游", "说明", "提醒")


def _extract_points(reference_answers: str) -> list[str]:
    points: list[str] = []
    segments = [part.strip() for part in reference_answers.replace("|", "\n").split("\n") if part.strip()]
    for segment in segments:
        for chunk in re.split(r"[。！？；;\n]", segment):
            cleaned = chunk.strip()
            if 4 <= len(cleaned) <= 32 and not any(phrase in cleaned for phrase in STOP_PHRASES):
                points.append(cleaned)
    seen = set()
    unique = []
    for item in points:
        if item not in seen:
            unique.append(item)
            seen.add(item)
    return unique


def _coverage(answer: str, reference_answers: str) -> dict[str, Any]:
    points = _extract_points(reference_answers)
    if not points:
        return {"score": 0, "covered": [], "missing": [], "total": 0}
    covered = [point for point in points if point in answer]
    missing = [point for point in points if point not in answer]
    score = round(len(covered) / max(1, len(points)) * 100)
    return {"score": score, "covered": covered, "missing": missing, "total": len(points)}


def _guardrail(question: str, answer: str) -> dict[str, Any]:
    text = answer.strip()
    abuse = any(word in text for word in ABUSE)
    dangerous = any(word in text for word in DANGEROUS)
    safety_question = any(word in question for word in SAFETY)
    has_action = any(word in text for word in SAFETY_ACTIONS)
    length_score = min(100, max(0, len(text) * 2))
    metrics = {
        "内容准确度": min(100, 25 + length_score // 2),
        "讲解完整度": min(100, 15 + length_score // 2),
        "服务应对": min(100, 20 + length_score // 2),
        "文化与边界敏感度": 70,
    }
    notes: list[str] = []
    cap = 100
    if not text:
        cap = 0
        notes.append("回答为空，无法形成有效讲解。")
    if abuse:
        cap = min(cap, 10)
        notes.append("回答包含冒犯或推诿表达，必须使用尊重、明确、可执行的服务话术。")
    if dangerous:
        cap = min(cap, 15)
        notes.append("回答包含危险建议，应立即制止并提供安全替代方案。")
    if safety_question and not has_action:
        cap = min(cap, 20)
        notes.append("面对身体不适或安全问题，应给出停止活动、休息观察、求助或就医等明确措施。")
    if len(text) < 16:
        cap = min(cap, 35)
        notes.append("讲解过短，需要补充事实依据、服务流程和注意事项。")
    total = min(cap, round(sum(metrics.values()) / 4))
    if cap < 100:
        metrics = {key: min(value, cap) for key, value in metrics.items()}
    return {"total": total, "metrics": metrics, "feedback": notes or ["回答具备基础结构，可继续补充知识依据和服务细节。"], "judge_mode": "rule-guardrail", "guardrail_triggered": cap < 100}


def score_training(scenario: str, question: str, answer: str, reference_answers: str = "") -> dict[str, Any]:
    guardrail = _guardrail(question, answer)
    coverage = _coverage(answer, reference_answers)
    prompt = f"""你是云南文旅导游实训评分员。请严格评价学生回答，不得因为提到关键词就给高分。
场景：{scenario}
游客问题：{question}
学生回答：{answer}
按 0-100 分评价：{"،".join(METRICS)}。冒犯、推诿、危险建议必须显著降分；安全问题缺少可执行处置措施不得高分。
只返回 JSON：{{"metrics":{{"内容准确度":0,"讲解完整度":0,"服务应对":0,"文化与边界敏感度":0}},"feedback":["建议"]}}"""
    try:
        raw = provider.generate(prompt, timeout=45)
        match = re.search(r"\{.*\}", raw, re.S)
        parsed = json.loads(match.group(0) if match else raw)
        metrics = {key: max(0, min(100, int(parsed.get("metrics", {}).get(key, 0)))) for key in METRICS}
        if coverage["total"]:
            metrics["讲解完整度"] = min(metrics["讲解完整度"], coverage["score"])
        total = round(sum(metrics.values()) / len(metrics))
        if guardrail["guardrail_triggered"] or guardrail["total"] <= 55:
            total = min(total, guardrail["total"])
            metrics = {key: min(value, guardrail["metrics"][key]) for key, value in metrics.items()}
        feedback = guardrail["feedback"] if guardrail["guardrail_triggered"] else parsed.get("feedback", [])
        if coverage["missing"]:
            feedback = [*feedback, "缺失知识点：" + "；".join(coverage["missing"][:6])]
        metrics["知识点覆盖率"] = coverage["score"]
        return {
            "total": total,
            "metrics": metrics,
            "feedback": feedback,
            "judge_mode": "llm-as-judge",
            "guardrail_triggered": guardrail["guardrail_triggered"],
            "coverage": coverage,
        }
    except Exception as exc:
        raise RuntimeError(f"LLM judge unavailable: {exc}") from exc
