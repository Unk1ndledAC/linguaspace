from __future__ import annotations

import json
import os
import socket
import subprocess
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from .asr import server_asr_available, transcribe
from .auth import issue_token, verify_token
from .config import settings
from .infrastructure import cache, graph_mirror, objects
from .providers import provider, timed_generate, vision_provider
from .runtime_store import runtime
from .scoring import score_training
from .store import store
from .translation import list_terms, translate

app = FastAPI(title=settings.app_name, version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class ChatRequest(BaseModel):
    question: str = Field(min_length=1)
    language: str = "zh"
    location: str | None = None
    session_id: str | None = None


class KnowledgeInput(BaseModel):
    title: str
    content: str
    tags: list[str] = []


class SearchInput(BaseModel):
    query: str
    top_k: int = 5


class GraphInput(BaseModel):
    source: str
    relation: str
    target: str


class GraphQuery(BaseModel):
    entity: str


class RouteInput(BaseModel):
    visitor_type: str = "深度文化游客"
    interest: str = "民族文化"
    language: str = "zh"


class TrainingInput(BaseModel):
    scenario: str = "导游综合实训"
    question: str = ""
    answer: str


class ReviewInput(BaseModel):
    record_id: str
    mode: str = "optimize"
    guide_note: str = ""
    optimized_answer: str = ""


class TTSInput(BaseModel):
    text: str


class CollaborationInput(BaseModel):
    question: str
    ai_answer: str = ""
    guide_note: str = ""


class LoginInput(BaseModel):
    username: str
    password: str


class SessionInput(BaseModel):
    language: str = "zh"
    location: str | None = None
    visitor_name: str = "匿名游客"


class GuideReplyInput(BaseModel):
    answer: str


class ReviewDecisionInput(BaseModel):
    status: str
    reviewer: str = "admin"
    comment: str = ""


class TermInput(BaseModel):
    zh_name: str
    language: str = "en"
    translation: str
    scene: str = ""


class TranslationInput(BaseModel):
    text: str
    target_language: str = "en"


class FeedbackInput(BaseModel):
    message_id: str = ""
    rating: int = Field(ge=1, le=5)
    content: str = ""


class UserInput(BaseModel):
    username: str
    password: str = "123456"
    display_name: str = ""
    role: str
    language: str = "zh"


class ScenarioInput(BaseModel):
    id: str | None = None
    language: str = "中文"
    scene: str
    visitor_type: str
    question: str
    reference_answers: list[str] = []


def require_roles(*roles: str):
    def verify(authorization: str | None = Header(default=None)) -> dict[str, Any]:
        if not settings.enforce_auth:
            return {"sub": "local-demo", "role": "admin"}
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(401, "missing bearer token")
        try:
            payload = verify_token(authorization.removeprefix("Bearer ").strip())
        except Exception:
            raise HTTPException(401, "invalid or expired token")
        if payload["role"] not in roles:
            raise HTTPException(403, "insufficient role")
        return payload

    return verify


def _tcp(host: str, port: int) -> dict[str, Any]:
    try:
        with socket.create_connection((host, port), timeout=0.4):
            return {"ok": True, "host": host, "port": port}
    except OSError as exc:
        return {"ok": False, "host": host, "port": port, "error": str(exc)}


def _prompt(question: str, sources: list[dict[str, Any]], graph: list[dict[str, str]]) -> str:
    context = "\n".join(f"- {item['title']}：{item['snippet']}" for item in sources)
    relations = "\n".join(f"- {item['source']} → {item['relation']} → {item['target']}" for item in graph[:12])
    return f"""你是语界 LinguaSpace 的云南文旅导览助手。只能基于给定的已审核资料回答，不要编造。
游客问题：{question}
知识库资料：
{context}
文化关系：
{relations or "无补充关系"}
请用自然、简洁、友好的中文回答，并在动态信息处提醒以现场公告为准。"""


def _answer(question: str, session_id: str | None = None, input_type: str = "text") -> dict[str, Any]:
    if not session_id:
        session_id = runtime.create_session()["id"]
    runtime.record_message(session_id, "user", input_type, question=question)
    sources = store.search_knowledge(question, 5)
    if not sources:
        answer = "暂无可靠资料。建议补充景点名称或联系现场导游确认。"
        runtime.record_message(session_id, "assistant", input_type, answer=answer, reliable=False, provider="none")
        return {"session_id": session_id, "answer": answer, "sources": [], "provider": "none", "model": None, "reliable": False}
    graph = store.graph_query(question)
    cached = cache.get(f"answer:{question}")
    if cached:
        answer, latency, model, mode = cached["answer"], 0, cached["model"], "cache"
    else:
        try:
            answer, latency = timed_generate(_prompt(question, sources, graph))
            model = provider.model
            mode = provider.name
            runtime.log_model("llm", mode, model, question, latency)
            cache.set(f"answer:{question}", {"answer": answer, "model": model})
        except Exception as exc:
            answer = "根据已审核资料：" + "；".join(item["snippet"] for item in sources[:2])
            latency = 0
            model = provider.model
            mode = "rag-fallback"
            store.logs.append({"type": "llm_error", "error": str(exc), "created_at": datetime.now().isoformat()})
            runtime.log_model("llm", mode, model, question, latency, "failed", str(exc))
    record = {"id": uuid.uuid4().hex, "question": question, "answer": answer, "sources": sources, "provider": mode, "model": model, "latency_ms": latency, "created_at": datetime.now().isoformat()}
    store.logs.append(record)
    runtime.record_message(session_id, "assistant", input_type, answer=answer, sources=sources, reliable=True, model=model, provider=mode)
    return {"session_id": session_id, **record, "reliable": True, "graph": graph}


@app.get("/api/health")
def health() -> dict[str, Any]:
    models = vision_provider.tags()
    return {
        "status": "ok",
        "app": settings.app_name,
        "components": {
            "api": {"ok": True},
            "mysql": {**_tcp("127.0.0.1", 3306), "runtime_store": runtime.mysql_ok},
            "postgres_pgvector": _tcp("127.0.0.1", 5432),
            "redis": _tcp("127.0.0.1", 6379),
            "minio": _tcp("127.0.0.1", 9000),
            "neo4j": _tcp("127.0.0.1", 7687),
            "llm": {"ok": provider.name == "openai-compatible" or provider.model in models, "provider": provider.name, "model": provider.model, "available_models": provider.tags()},
            "vision": {"ok": settings.ollama_vision_model in models, "model": settings.ollama_vision_model},
            "tts": {"ok": os.name == "nt", "engine": "Windows SAPI"},
            "asr": {"ok": True, "engine": "faster-whisper" if server_asr_available() else "Browser SpeechRecognition", "server_asr": server_asr_available(), "fallback": "Browser SpeechRecognition"},
            "cache_adapter": {"ok": True, "backend": cache.backend},
            "object_storage_adapter": {"ok": True, "backend": objects.backend},
            "graph_adapter": {"ok": True, "backend": graph_mirror.backend},
        },
    }


@app.get("/api/architecture/audit")
def architecture_audit() -> dict[str, Any]:
    return {"status": "single-machine-complete-loop", "layers": [{"name": "客户端层", "ok": True, "items": ["四端独立入口"]}, {"name": "业务服务层", "ok": True, "items": ["导览", "实训", "协同", "审核", "日志"]}, {"name": "AI能力层", "ok": True, "items": ["Ollama LLM", "Ollama Vision", "ASR adapter", "TTS", "translation adapter"]}, {"name": "知识增强层", "ok": True, "items": ["RAG", "术语表", "文化图谱"]}, {"name": "数据与运维层", "ok": True, "items": ["MySQL", "CSV 镜像", "Docker Compose", "健康监测"]}], "notes": ["MySQL 为优先运行存储，CSV 为可编辑镜像和离线兜底。", "PostgreSQL/pgvector、Redis、MinIO、Neo4j 作为可选增强组件由 Docker Compose 拉起。"]}


@app.post("/api/auth/login")
def login(payload: LoginInput) -> dict[str, Any]:
    user = runtime.login(payload.username, payload.password)
    if not user:
        raise HTTPException(401, "invalid username or password")
    return {"token": issue_token(user), "user": user}


@app.get("/api/users")
def users(_: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    return {"items": [{key: value for key, value in item.items() if key != "password"} for item in runtime._all("users")]}


@app.post("/api/users")
def add_user(payload: UserInput, _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    try:
        user = runtime.add_user(payload.username, payload.password, payload.display_name, payload.role, payload.language)
        return {key: value for key, value in user.items() if key != "password"}
    except ValueError:
        raise HTTPException(422, "invalid role")


@app.put("/api/users/{user_id}/status")
def user_status(user_id: str, status: str, _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    if status not in ("active", "disabled", "locked"):
        raise HTTPException(422, "invalid status")
    return runtime._update("users", user_id, {"status": status})


@app.post("/api/sessions")
def create_session(payload: SessionInput) -> dict[str, Any]:
    return runtime.create_session(payload.language, payload.location, payload.visitor_name)


@app.get("/api/sessions")
def sessions() -> dict[str, Any]:
    return {"items": runtime.list_sessions()}


@app.get("/api/collaboration/sessions")
def collaboration_sessions() -> dict[str, Any]:
    return {"items": runtime.list_sessions()}


@app.get("/api/content/guide")
def guide_content() -> dict[str, Any]:
    return {"places": store.places, "questions": store.questions}


@app.get("/api/content/routes")
def route_content() -> dict[str, Any]:
    return {"routes": store.routes, "filters": store.filters}


@app.get("/api/collaboration/cases")
def collaboration_cases() -> dict[str, Any]:
    return {"items": store.cases}


@app.post("/api/chat")
def chat(payload: ChatRequest) -> dict[str, Any]:
    return _answer(payload.question.strip(), payload.session_id)


@app.post("/api/chat/stream")
def chat_stream(payload: ChatRequest) -> StreamingResponse:
    question = payload.question.strip()
    session_id = payload.session_id or runtime.create_session(payload.language, payload.location)["id"]
    runtime.record_message(session_id, "user", "text", question=question)
    sources = store.search_knowledge(question, 5)
    if not sources:
        answer = "暂无可靠资料。建议补充景点名称或联系现场导游确认。"
        runtime.record_message(session_id, "assistant", "text", answer=answer, reliable=False, provider="none")
        return StreamingResponse(iter([answer]), media_type="text/plain; charset=utf-8", headers={"X-LinguaSpace-Session": session_id})
    prompt = _prompt(question, sources, store.graph_query(question))

    def generate():
        chunks: list[str] = []
        started = datetime.now()
        try:
            for chunk in provider.stream(prompt):
                chunks.append(chunk)
                yield chunk
            answer = "".join(chunks)
            elapsed = round((datetime.now() - started).total_seconds() * 1000)
            runtime.log_model("llm-stream", provider.name, provider.model, question, elapsed)
        except Exception as exc:
            answer = "根据已审核资料：" + "；".join(item["snippet"] for item in sources[:2])
            yield answer
            runtime.log_model("llm-stream", "rag-fallback", provider.model, question, 0, "failed", str(exc))
        runtime.record_message(session_id, "assistant", "text", answer=answer, sources=sources, reliable=True, model=provider.model, provider=provider.name)

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8", headers={"X-LinguaSpace-Sources": str(len(sources)), "X-LinguaSpace-Session": session_id})


@app.get("/api/knowledge")
def knowledge_list() -> dict[str, Any]:
    return {"items": store.list_knowledge()}


@app.post("/api/knowledge")
def knowledge_add(payload: KnowledgeInput, _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    return store.add_knowledge(payload.model_dump())


@app.put("/api/knowledge/{doc_id}")
def knowledge_update(doc_id: str, payload: KnowledgeInput, _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    try:
        return store.update_knowledge(doc_id, payload.model_dump())
    except KeyError:
        raise HTTPException(404, "knowledge item not found")


@app.delete("/api/knowledge/{doc_id}")
def knowledge_delete(doc_id: str, _: dict = Depends(require_roles("admin"))) -> dict[str, bool]:
    try:
        store.delete_knowledge(doc_id)
        return {"ok": True}
    except KeyError:
        raise HTTPException(404, "knowledge item not found")


@app.post("/api/knowledge/search")
def knowledge_search(payload: SearchInput) -> dict[str, Any]:
    return {"items": store.search_knowledge(payload.query, payload.top_k)}


@app.get("/api/graph")
def graph_list(keyword: str = "") -> dict[str, Any]:
    return {"items": store.list_graph(keyword)}


@app.post("/api/graph/query")
def graph_query(payload: GraphQuery) -> dict[str, Any]:
    return {"items": store.graph_query(payload.entity)}


@app.post("/api/graph")
def graph_add(payload: GraphInput, _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    graph_mirror.upsert(payload.source, payload.relation, payload.target)
    return store.add_graph(payload.model_dump())


@app.put("/api/graph/{relation_id}")
def graph_update(relation_id: str, payload: GraphInput, _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    try:
        graph_mirror.upsert(payload.source, payload.relation, payload.target)
        return store.update_graph(relation_id, payload.model_dump())
    except KeyError:
        raise HTTPException(404, "graph relation not found")


@app.delete("/api/graph/{relation_id}")
def graph_delete(relation_id: str, _: dict = Depends(require_roles("admin"))) -> dict[str, bool]:
    try:
        store.delete_graph(relation_id)
        return {"ok": True}
    except KeyError:
        raise HTTPException(404, "graph relation not found")


@app.get("/api/training/scenarios")
def training_scenarios() -> dict[str, Any]:
    items = []
    for item in store.scenarios:
        clone = dict(item)
        clone["reference_answers"] = json.loads(item.get("reference_answers", "[]"))
        items.append(clone)
    return {"items": items}


@app.post("/api/training/scenarios")
def add_training_scenario(payload: ScenarioInput, _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    return store.add_scenario(payload.model_dump())


@app.put("/api/training/scenarios/{scenario_id}")
def update_training_scenario(scenario_id: str, payload: ScenarioInput, _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    try:
        return store.update_scenario(scenario_id, payload.model_dump())
    except KeyError:
        raise HTTPException(404, "training scenario not found")


@app.delete("/api/training/scenarios/{scenario_id}")
def delete_training_scenario(scenario_id: str, _: dict = Depends(require_roles("admin"))) -> dict[str, bool]:
    try:
        store.delete_scenario(scenario_id)
        return {"ok": True}
    except KeyError:
        raise HTTPException(404, "training scenario not found")


@app.post("/api/training/score")
def training_score(payload: TrainingInput) -> dict[str, Any]:
    started = time.perf_counter()
    report = score_training(payload.scenario, payload.question, payload.answer)
    runtime.log_model("training-judge", report["judge_mode"], provider.model, f"{payload.question}\n{payload.answer}", round((time.perf_counter() - started) * 1000))
    record = runtime.add_training_record(payload.scenario, payload.question, payload.answer, report)
    return {**report, "record_id": record["id"]}


@app.get("/api/training/records")
def training_records() -> dict[str, Any]:
    return {"items": runtime._all("training_records")}


@app.get("/api/guide/questions")
def guide_questions() -> dict[str, Any]:
    items = [item for item in runtime._all("messages", 200) if item["role"] == "user"]
    return {"items": items}


@app.get("/api/guide/questions/{record_id}")
def guide_question_detail(record_id: str) -> dict[str, Any]:
    for item in runtime._all("messages", 1000):
        if item.get("id") == record_id:
            return item
    raise HTTPException(404, "question record not found")


@app.post("/api/guide/questions/review")
def guide_review(payload: ReviewInput, _: dict = Depends(require_roles("guide", "admin"))) -> dict[str, Any]:
    return runtime.create_correction(payload.record_id, payload.mode, payload.guide_note, payload.optimized_answer)


@app.get("/api/review/tasks")
def review_tasks(status: str = "") -> dict[str, Any]:
    items = runtime._all("review_tasks")
    return {"items": [item for item in items if not status or item["status"] == status]}


@app.post("/api/review/tasks/{task_id}/decision")
def review_decision(task_id: str, payload: ReviewDecisionInput, _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    try:
        return runtime.decide_review(task_id, payload.status, payload.reviewer, payload.comment)
    except KeyError:
        raise HTTPException(404, "review task not found")
    except RuntimeError as exc:
        raise HTTPException(409, str(exc))
    except ValueError:
        raise HTTPException(422, "invalid review decision")


@app.get("/api/logs/model-calls")
def model_logs(capability: str = "", status: str = "", _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    items = runtime._all("model_call_logs")
    return {"items": [item for item in items if (not capability or item["capability"] == capability) and (not status or item["status"] == status)]}


@app.get("/api/terms")
def terms() -> dict[str, Any]:
    return {"items": list_terms()}


@app.get("/api/knowledge/documents")
def documents() -> dict[str, Any]:
    return {"items": [item for item in runtime._all("review_tasks") if item["object_type"] == "document"]}


@app.get("/api/knowledge/stats")
def knowledge_stats() -> dict[str, Any]:
    return {"knowledge_items": len(store.knowledge), "graph_relations": len(store.graph), "places": len(store.places), "routes": len(store.routes), "training_scenarios": len(store.scenarios), "terms": len(list_terms()), "pending_reviews": len([item for item in runtime._all("review_tasks") if item["status"] == "pending"])}


@app.post("/api/terms")
def add_term(payload: TermInput, _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    return runtime.add_term(payload.zh_name, payload.language, payload.translation, payload.scene)


@app.put("/api/terms/{term_id}")
def update_term(term_id: str, payload: TermInput, _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    try:
        return runtime.update_term(term_id, payload.zh_name, payload.language, payload.translation, payload.scene)
    except KeyError:
        raise HTTPException(404, "term not found")


@app.delete("/api/terms/{term_id}")
def delete_term(term_id: str, _: dict = Depends(require_roles("admin"))) -> dict[str, bool]:
    runtime._delete("terms", term_id)
    return {"ok": True}


@app.post("/api/translate")
def translate_text(payload: TranslationInput) -> dict[str, Any]:
    return translate(payload.text, payload.target_language)


@app.post("/api/feedback")
def add_feedback(payload: FeedbackInput) -> dict[str, Any]:
    return runtime.add_feedback(payload.message_id, payload.rating, payload.content)


@app.get("/api/feedback")
def feedback() -> dict[str, Any]:
    return {"items": runtime._all("feedback")}


@app.get("/api/collaboration/corrections")
def corrections() -> dict[str, Any]:
    return {"items": runtime._all("guide_corrections")}


@app.post("/api/route/recommend")
def route_recommend(payload: RouteInput) -> dict[str, Any]:
    terms = f"{payload.visitor_type}{payload.interest}"
    ranked = [route for route in store.routes if any(term in terms for term in str(route.get("match_terms", "")).split("|"))]
    route = (ranked or store.routes)[:1]
    return {"items": route}


@app.post("/api/image/ask")
async def image_ask(file: UploadFile = File(...), question: str = Form("请介绍图片中的云南文旅内容")) -> dict[str, Any]:
    image = await file.read()
    if len(image) > 8 * 1024 * 1024:
        raise HTTPException(413, "image too large")
    upload = objects.save("image", file.filename or "upload.jpg", image)
    vision_prompt = "识别这张云南文旅图片中的景点、物体、文字、菜品或标识。只输出用于知识库检索的简短中文关键词。"
    try:
        started = time.perf_counter()
        summary = vision_provider.generate(vision_prompt, model=settings.ollama_vision_model, images=[image], timeout=120)
        runtime.log_model("vision", "ollama", settings.ollama_vision_model, vision_prompt, round((time.perf_counter() - started) * 1000))
    except Exception as exc:
        runtime.log_model("vision", "ollama", settings.ollama_vision_model, vision_prompt, 0, "failed", str(exc))
        raise HTTPException(503, f"vision model unavailable: {exc}")
    answer = _answer(f"{summary} {question}")
    return {"upload": upload, "vision_summary": summary, **answer}


@app.post("/api/image/ask/stream")
async def image_ask_stream(file: UploadFile = File(...), question: str = Form("请介绍图片中的云南文旅内容")) -> StreamingResponse:
    result = await image_ask(file, question)
    return StreamingResponse(iter([result["answer"]]), media_type="text/plain; charset=utf-8")


@app.post("/api/audio/transcribe")
async def audio_transcribe(file: UploadFile = File(...)) -> dict[str, Any]:
    content = await file.read()
    upload = objects.save("audio", file.filename or "upload.wav", content)
    path = Path(upload["local_path"])
    started = time.perf_counter()
    result = transcribe(path)
    runtime.log_model("asr", result["engine"], "small", file.filename or "", round((time.perf_counter() - started) * 1000), "success" if result.get("available") else "degraded", result.get("message", ""))
    return {"audio_url": upload["url"], "storage": upload["backend"], **result}


@app.post("/api/audio/ask")
async def audio_ask(file: UploadFile = File(...)) -> dict[str, Any]:
    content = await file.read()
    upload = objects.save("audio", file.filename or "upload.wav", content)
    path = Path(upload["local_path"])
    transcript = transcribe(path)
    if not transcript.get("text"):
        return {"audio_url": upload["url"], "transcript": transcript, "answer": "语音识别暂不可用，请在游客端使用浏览器实时语音输入或改用文字提问。", "sources": [], "reliable": False}
    return {"audio_url": upload["url"], "transcript": transcript, **_answer(str(transcript["text"]), input_type="audio")}


@app.post("/api/collaboration/summary")
def collaboration_summary(payload: CollaborationInput) -> dict[str, Any]:
    summary = f"游客问题：{payload.question}\nAI 回答摘要：{payload.ai_answer[:240] or '尚无'}\n导游备注：{payload.guide_note or '尚无'}"
    return {"summary": summary, "risk_level": "high" if any(term in payload.question for term in ("高反", "投诉", "受伤", "宗教", "禁忌")) else "normal"}


@app.post("/api/collaboration/correction")
def collaboration_correction(payload: CollaborationInput) -> dict[str, Any]:
    return runtime.create_correction(uuid.uuid4().hex, "correction", payload.guide_note, payload.ai_answer)


@app.post("/api/sessions/{session_id}/takeover")
def takeover(session_id: str, _: dict = Depends(require_roles("guide", "admin"))) -> dict[str, Any]:
    try:
        runtime.get_session(session_id)
        runtime._update("guide_sessions", session_id, {"status": "taken_over", "updated_at": datetime.now().isoformat(timespec="seconds")})
        return {"session_id": session_id, "status": "taken_over"}
    except KeyError:
        raise HTTPException(404, "session not found")


@app.post("/api/sessions/{session_id}/guide-reply")
def guide_reply(session_id: str, payload: GuideReplyInput, _: dict = Depends(require_roles("guide", "admin"))) -> dict[str, Any]:
    try:
        runtime.get_session(session_id)
        return runtime.record_message(session_id, "guide", "text", answer=payload.answer, reliable=True, provider="human-guide")
    except KeyError:
        raise HTTPException(404, "session not found")


@app.post("/api/knowledge/documents")
async def upload_document(file: UploadFile = File(...), source: str = Form("管理员上传"), tags: str = Form(""), _: dict = Depends(require_roles("admin"))) -> dict[str, Any]:
    if Path(file.filename or "").suffix.lower() not in (".txt", ".md", ".csv"):
        raise HTTPException(415, "supported formats: txt, md, csv")
    content = (await file.read()).decode("utf-8-sig", errors="replace").strip()
    if not content:
        raise HTTPException(422, "empty document")
    upload = objects.save("document", file.filename or "knowledge.txt", content.encode("utf-8"))
    result = runtime.create_document_reviews(Path(file.filename or "知识文档").stem, content, source, [item.strip() for item in tags.split(",") if item.strip()])
    return {"upload": upload, **result}


@app.post("/api/tts/synthesize")
def tts(payload: TTSInput) -> dict[str, Any]:
    if os.name != "nt":
        raise HTTPException(503, "Windows SAPI is only available on Windows")
    filename = f"tts-{uuid.uuid4().hex}.wav"
    path = settings.media_dir / filename
    escaped = payload.text.replace("'", "''")
    command = f"Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('{path}'); $s.Speak('{escaped}'); $s.Dispose()"
    started = time.perf_counter()
    subprocess.run(["powershell", "-NoProfile", "-Command", command], check=True, capture_output=True)
    runtime.log_model("tts", "windows-sapi", "system-voice", payload.text, round((time.perf_counter() - started) * 1000))
    return {"url": f"/media/{filename}", "engine": "Windows SAPI"}


@app.get("/media/{filename}")
def media(filename: str) -> FileResponse:
    path = settings.media_dir / Path(filename).name
    if not path.exists():
        raise HTTPException(404, "media not found")
    return FileResponse(path)
