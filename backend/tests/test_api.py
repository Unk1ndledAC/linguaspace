import uuid

from fastapi.testclient import TestClient

from app.auth import verify_token
from app.main import app

client = TestClient(app)


def test_health_and_data_assets():
    assert client.get("/api/health").status_code == 200
    assert len(client.get("/api/knowledge").json()["items"]) >= 50
    assert len(client.get("/api/graph").json()["items"]) >= 150
    scenarios = client.get("/api/training/scenarios")
    assert scenarios.status_code == 200
    assert len(scenarios.json()["items"]) >= 10
    assert isinstance(scenarios.json()["items"][0]["reference_answers"], list)


def test_rag_refuses_unknown_question():
    payload = client.post("/api/chat", json={"question": "量子引力弦理论在火星上的票价"}).json()
    assert payload["reliable"] is False
    assert "暂无可靠资料" in payload["answer"]


def test_graph_query_and_crud():
    created = client.post("/api/graph", json={"source": "测试节点", "relation": "关联", "target": "测试目标"}).json()
    assert created["source"] == "测试节点"
    assert client.post("/api/graph/query", json={"entity": "测试节点"}).json()["items"]
    assert client.delete(f"/api/graph/{created['id']}").json()["ok"]


def test_training_guardrail_blocks_abusive_answer():
    payload = client.post("/api/training/score", json={"scenario": "高原应急", "question": "导游我高反了怎么办", "answer": "高反了你就受着老头"}).json()
    assert payload["total"] <= 10
    assert payload["guardrail_triggered"] is True


def test_sessions_messages_and_guide_takeover():
    session = client.post("/api/sessions", json={"visitor_name": "验收游客", "location": "大理古城"}).json()
    answer = client.post("/api/chat", json={"session_id": session["id"], "question": "白族三道茶是什么意思"}).json()
    assert answer["session_id"] == session["id"]
    sessions = client.get("/api/collaboration/sessions").json()["items"]
    assert any(item["id"] == session["id"] for item in sessions)
    assert client.post(f"/api/sessions/{session['id']}/takeover").json()["status"] == "taken_over"
    reply = client.post(f"/api/sessions/{session['id']}/guide-reply", json={"answer": "请跟随我继续了解。"}).json()
    assert reply["provider"] == "human-guide"


def test_document_review_translation_and_feedback():
    uploaded = client.post("/api/knowledge/documents", files={"file": ("sample.md", "测试知识正文".encode("utf-8"), "text/markdown")}, data={"source": "pytest", "tags": "测试"}).json()
    assert uploaded["status"] == "pending_review"
    assert uploaded["chunk_count"] == 1
    rejected = client.post(f"/api/review/tasks/{uploaded['tasks'][0]['id']}/decision", json={"status": "rejected", "comment": "测试退回"}).json()
    assert rejected["status"] == "rejected"
    translated = client.post("/api/translate", json={"text": "欢迎来到大理古城", "target_language": "en"}).json()
    assert "Dali Ancient Town" in translated["text"]
    feedback = client.post("/api/feedback", json={"rating": 4, "content": "验收反馈"}).json()
    assert feedback["status"] == "open"


def test_auth_stats_and_audio_required_asr():
    login = client.post("/api/auth/login", json={"username": "admin", "password": "123456"})
    assert login.status_code == 200
    assert verify_token(login.json()["token"])["role"] == "admin"
    stats = client.get("/api/knowledge/stats").json()
    assert stats["knowledge_items"] >= 50
    audio = client.post("/api/audio/transcribe", files={"file": ("empty.wav", b"not-real-audio", "audio/wav")})
    assert audio.status_code in (200, 500)


def test_admin_crud_extensions():
    term = client.post("/api/terms", json={"zh_name": "测试术语", "language": "en", "translation": "Test Term", "scene": "pytest"}).json()
    updated = client.put(f"/api/terms/{term['id']}", json={"zh_name": "测试术语", "language": "en", "translation": "Updated Term", "scene": "pytest"}).json()
    assert updated["translation"] == "Updated Term"
    assert client.delete(f"/api/terms/{term['id']}").json()["ok"]
    scenario = client.post("/api/training/scenarios", json={"scene": "测试场景", "visitor_type": "测试游客", "question": "测试问题", "reference_answers": ["测试回答"]}).json()
    assert scenario["scene"] == "测试场景"
    assert client.delete(f"/api/training/scenarios/{scenario['id']}").json()["ok"]
    user = client.post("/api/users", json={"username": f"pytest-{term['id'][:8]}", "role": "student"}).json()
    assert user["role"] == "student"


def test_collaboration_risk_detection():
    payload = client.post("/api/collaboration/summary", json={"question": "游客高反了怎么办"}).json()
    assert payload["risk_level"] == "high"


def test_tourist_handoff_preferences_and_favorites():
    session = client.post("/api/sessions", json={"visitor_name": "api-tourist"}).json()
    preferences = client.put("/api/tourist/preferences", json={"session_id": session["id"], "language": "en", "location": "Dali"}).json()
    assert preferences["language"] == "en"
    favorite = client.post("/api/tourist/favorites", json={"session_id": session["id"], "item_type": "route", "item_id": "route-test", "title": "Dali route"}).json()
    assert any(item["id"] == favorite["id"] for item in client.get("/api/tourist/favorites", params={"session_id": session["id"]}).json()["items"])
    assert client.post("/api/tourist/handoff", json={"session_id": session["id"], "note": "help"}).json()["status"] == "handoff_requested"
    assert client.post(f"/api/sessions/{session['id']}/takeover").json()["status"] == "taken_over"
    assert client.post(f"/api/sessions/{session['id']}/release").json()["status"] == "active"
    assert client.delete(f"/api/tourist/favorites/{favorite['id']}").json()["ok"]


def test_document_chunks_roles_metrics_and_settings():
    uploaded = client.post("/api/knowledge/documents", files={"file": ("extended.md", b"extended knowledge", "text/markdown")}, data={"source": "pytest"}).json()
    document_id = uploaded["document_id"]
    assert client.post(f"/api/knowledge/documents/{document_id}/vectorize").json()["vector_status"] == "ready"
    chunks = client.get("/api/knowledge/chunks", params={"document_id": document_id}).json()["items"]
    assert chunks and chunks[0]["vector_status"] == "ready"
    role_id = f"pytest-{uuid.uuid4().hex[:8]}"
    assert client.post("/api/roles", json={"id": role_id, "name": "Pytest role"}).json()["id"] == role_id
    updated = client.put(f"/api/roles/{role_id}/permissions", json={"permission_ids": ["tourist.read"]}).json()
    assert updated["permissions"] == ["tourist.read"]
    assert "overview" in client.get("/api/system/metrics").json()
    assert "values" in client.put("/api/system/settings", json={"values": {"default_language": "zh"}}).json()
    assert client.delete(f"/api/roles/{role_id}").json()["ok"]
    assert client.delete(f"/api/knowledge/documents/{document_id}").json()["ok"]
