from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import uuid
from datetime import datetime
from threading import RLock
from typing import Any

from .config import settings
from .store import store


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 120_000).hex()
    return f"pbkdf2_sha256${salt}${digest}"


def _verify_password(password: str, encoded: str) -> bool:
    if not encoded.startswith("pbkdf2_sha256$"):
        return hmac.compare_digest(password, encoded)
    _, salt, expected = encoded.split("$", 2)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 120_000).hex()
    return hmac.compare_digest(digest, expected)


SCHEMA = [
    """CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY, username VARCHAR(64) UNIQUE NOT NULL,
        password VARCHAR(128) NOT NULL, display_name VARCHAR(128) NOT NULL,
        role VARCHAR(24) NOT NULL, language VARCHAR(24) DEFAULT 'zh',
        status VARCHAR(24) DEFAULT 'active', created_at VARCHAR(40) NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS guide_sessions (
        id VARCHAR(64) PRIMARY KEY, visitor_name VARCHAR(128), language VARCHAR(24),
        location VARCHAR(255), status VARCHAR(24), summary TEXT, risk_level VARCHAR(24),
        created_at VARCHAR(40) NOT NULL, updated_at VARCHAR(40) NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY, session_id VARCHAR(64), role VARCHAR(24),
        input_type VARCHAR(24), question TEXT, answer TEXT, sources_json LONGTEXT,
        reliable TINYINT DEFAULT 0, model VARCHAR(128), provider VARCHAR(64),
        created_at VARCHAR(40) NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS model_call_logs (
        id VARCHAR(64) PRIMARY KEY, request_id VARCHAR(64), capability VARCHAR(48),
        provider VARCHAR(64), model VARCHAR(128), prompt_summary TEXT, latency_ms INT,
        status VARCHAR(24), error_message TEXT, created_at VARCHAR(40) NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS review_tasks (
        id VARCHAR(64) PRIMARY KEY, object_type VARCHAR(48), object_id VARCHAR(64),
        title VARCHAR(255), content LONGTEXT, source VARCHAR(255), tags_json TEXT,
        status VARCHAR(24), reviewer VARCHAR(128), comment TEXT,
        created_at VARCHAR(40) NOT NULL, updated_at VARCHAR(40) NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS terms (
        id VARCHAR(64) PRIMARY KEY, zh_name VARCHAR(128), language VARCHAR(24),
        translation VARCHAR(255), scene VARCHAR(128), status VARCHAR(24),
        created_at VARCHAR(40) NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS training_records (
        id VARCHAR(64) PRIMARY KEY, scenario VARCHAR(255), question TEXT, answer TEXT,
        score INT, metrics_json TEXT, feedback_json TEXT, judge_mode VARCHAR(64),
        created_at VARCHAR(40) NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS guide_corrections (
        id VARCHAR(64) PRIMARY KEY, record_id VARCHAR(64), mode VARCHAR(24),
        guide_note TEXT, optimized_answer LONGTEXT, status VARCHAR(24),
        created_at VARCHAR(40) NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS feedback (
        id VARCHAR(64) PRIMARY KEY, message_id VARCHAR(64), rating INT,
        content TEXT, status VARCHAR(24), created_at VARCHAR(40) NOT NULL)""",
]


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


class RuntimeStore:
    def __init__(self) -> None:
        self.lock = RLock()
        self.memory = {name: [] for name in ("users", "guide_sessions", "messages", "model_call_logs", "review_tasks", "terms", "training_records", "guide_corrections", "feedback")}
        self.mysql_ok = self._ensure_schema()
        self._seed_users()
        self._seed_terms()

    def _ensure_schema(self) -> bool:
        if settings.runtime_backend != "mysql":
            return False
        try:
            with store._connect() as connection, connection.cursor() as cursor:
                for statement in SCHEMA:
                    cursor.execute(statement)
                connection.commit()
            return True
        except Exception:
            return False

    def _all(self, table: str, limit: int = 200) -> list[dict[str, Any]]:
        if self.mysql_ok:
            try:
                with store._connect() as connection, connection.cursor() as cursor:
                    cursor.execute(f"SELECT * FROM `{table}` ORDER BY created_at DESC LIMIT %s", (limit,))
                    return list(cursor.fetchall())
            except Exception:
                self.mysql_ok = False
        return list(reversed(self.memory[table][-limit:]))

    def _insert(self, table: str, item: dict[str, Any]) -> dict[str, Any]:
        with self.lock:
            if self.mysql_ok:
                try:
                    with store._connect() as connection, connection.cursor() as cursor:
                        columns = list(item)
                        marks = ",".join(["%s"] * len(columns))
                        cursor.execute(f"INSERT INTO `{table}` ({','.join(f'`{key}`' for key in columns)}) VALUES ({marks})", list(item.values()))
                        connection.commit()
                        return item
                except Exception:
                    self.mysql_ok = False
            self.memory[table].append(item)
            return item

    def _update(self, table: str, item_id: str, changes: dict[str, Any]) -> dict[str, Any]:
        if self.mysql_ok:
            with store._connect() as connection, connection.cursor() as cursor:
                cursor.execute(f"UPDATE `{table}` SET {','.join(f'`{key}`=%s' for key in changes)} WHERE id=%s", [*changes.values(), item_id])
                connection.commit()
            return {"id": item_id, **changes}
        for item in self.memory[table]:
            if item["id"] == item_id:
                item.update(changes)
                return item
        raise KeyError(item_id)

    def _delete(self, table: str, item_id: str) -> None:
        if self.mysql_ok:
            with store._connect() as connection, connection.cursor() as cursor:
                cursor.execute(f"DELETE FROM `{table}` WHERE id=%s", (item_id,))
                connection.commit()
            return
        self.memory[table] = [item for item in self.memory[table] if item["id"] != item_id]

    def _seed_users(self) -> None:
        if self._all("users"):
            return
        for username, role in (("student", "student"), ("guide", "guide"), ("admin", "admin")):
            self._insert("users", {"id": uuid.uuid4().hex, "username": username, "password": _hash_password("123456"), "display_name": username, "role": role, "language": "zh", "status": "active", "created_at": _now()})

    def _seed_terms(self) -> None:
        if self._all("terms"):
            return
        for zh, en, scene in (("大理古城", "Dali Ancient Town", "景点"), ("丽江古城", "Lijiang Old Town", "景点"), ("白族", "Bai ethnic group", "民族"), ("三道茶", "Three-course Tea Ceremony", "礼仪"), ("泼水节", "Water Splashing Festival", "节庆"), ("过桥米线", "Crossing-the-Bridge Rice Noodles", "饮食")):
            self.add_term(zh, "en", en, scene)

    def login(self, username: str, password: str) -> dict[str, Any] | None:
        for user in self._all("users"):
            if user["username"] == username and _verify_password(password, user["password"]) and user["status"] == "active":
                if not user["password"].startswith("pbkdf2_sha256$"):
                    self._update("users", user["id"], {"password": _hash_password(password)})
                return {key: user[key] for key in ("id", "username", "display_name", "role", "language")}
        return None

    def add_user(self, username: str, password: str, display_name: str, role: str, language: str = "zh") -> dict[str, Any]:
        if role not in ("tourist", "student", "guide", "admin"):
            raise ValueError(role)
        return self._insert("users", {"id": uuid.uuid4().hex, "username": username, "password": _hash_password(password), "display_name": display_name or username, "role": role, "language": language, "status": "active", "created_at": _now()})

    def create_session(self, language: str = "zh", location: str | None = None, visitor_name: str = "匿名游客") -> dict[str, Any]:
        now = _now()
        return self._insert("guide_sessions", {"id": uuid.uuid4().hex, "visitor_name": visitor_name, "language": language, "location": location or "", "status": "active", "summary": "", "risk_level": "normal", "created_at": now, "updated_at": now})

    def get_session(self, session_id: str) -> dict[str, Any]:
        for item in self._all("guide_sessions"):
            if item["id"] == session_id:
                return item
        raise KeyError(session_id)

    def list_sessions(self) -> list[dict[str, Any]]:
        sessions = self._all("guide_sessions")
        messages = self._all("messages", 1000)
        for session in sessions:
            related = [message for message in messages if message["session_id"] == session["id"]]
            session["messages"] = related
            session["last_question"] = next((message["question"] for message in related if message.get("question")), "")
        return sessions

    def record_message(self, session_id: str, role: str, input_type: str, question: str = "", answer: str = "", sources: list[dict[str, Any]] | None = None, reliable: bool = False, model: str = "", provider: str = "") -> dict[str, Any]:
        return self._insert("messages", {"id": uuid.uuid4().hex, "session_id": session_id, "role": role, "input_type": input_type, "question": question, "answer": answer, "sources_json": json.dumps(sources or [], ensure_ascii=False), "reliable": int(reliable), "model": model, "provider": provider, "created_at": _now()})

    def log_model(self, capability: str, provider: str, model: str, prompt: str, latency_ms: int, status: str = "success", error: str = "") -> dict[str, Any]:
        return self._insert("model_call_logs", {"id": uuid.uuid4().hex, "request_id": uuid.uuid4().hex, "capability": capability, "provider": provider, "model": model, "prompt_summary": prompt[:500], "latency_ms": latency_ms, "status": status, "error_message": error, "created_at": _now()})

    def create_review(self, object_type: str, object_id: str, title: str, content: str, source: str = "", tags: list[str] | None = None) -> dict[str, Any]:
        now = _now()
        return self._insert("review_tasks", {"id": uuid.uuid4().hex, "object_type": object_type, "object_id": object_id, "title": title, "content": content, "source": source, "tags_json": json.dumps(tags or [], ensure_ascii=False), "status": "pending", "reviewer": "", "comment": "", "created_at": now, "updated_at": now})

    def create_document_reviews(self, title: str, content: str, source: str, tags: list[str]) -> dict[str, Any]:
        document_id = uuid.uuid4().hex
        blocks = [block.strip() for block in content.replace("\r", "").split("\n\n") if block.strip()]
        chunks: list[str] = []
        for block in blocks or [content]:
            while len(block) > 700:
                chunks.append(block[:700])
                block = block[650:]
            if block:
                chunks.append(block)
        tasks = [self.create_review("document", f"{document_id}-{index + 1}", f"{title} #{index + 1}", chunk, source, tags) for index, chunk in enumerate(chunks)]
        return {"document_id": document_id, "title": title, "source": source, "chunk_count": len(tasks), "tasks": tasks, "status": "pending_review"}

    def decide_review(self, task_id: str, status: str, reviewer: str, comment: str) -> dict[str, Any]:
        if status not in ("approved", "rejected", "offline"):
            raise ValueError(status)
        task = next((item for item in self._all("review_tasks") if item["id"] == task_id), None)
        if not task:
            raise KeyError(task_id)
        if task["status"] != "pending":
            raise RuntimeError("review task already decided")
        self._update("review_tasks", task_id, {"status": status, "reviewer": reviewer, "comment": comment, "updated_at": _now()})
        if status == "approved" and task["object_type"] in ("document", "correction"):
            store.add_knowledge({"title": task["title"], "content": task["content"], "tags": json.loads(task["tags_json"])})
        return {**task, "status": status, "reviewer": reviewer, "comment": comment}

    def add_term(self, zh_name: str, language: str, translation: str, scene: str = "") -> dict[str, Any]:
        return self._insert("terms", {"id": uuid.uuid4().hex, "zh_name": zh_name, "language": language, "translation": translation, "scene": scene, "status": "approved", "created_at": _now()})

    def update_term(self, term_id: str, zh_name: str, language: str, translation: str, scene: str = "") -> dict[str, Any]:
        return self._update("terms", term_id, {"zh_name": zh_name, "language": language, "translation": translation, "scene": scene})

    def add_training_record(self, scenario: str, question: str, answer: str, report: dict[str, Any]) -> dict[str, Any]:
        return self._insert("training_records", {"id": uuid.uuid4().hex, "scenario": scenario, "question": question, "answer": answer, "score": report["total"], "metrics_json": json.dumps(report["metrics"], ensure_ascii=False), "feedback_json": json.dumps(report["feedback"], ensure_ascii=False), "judge_mode": report["judge_mode"], "created_at": _now()})

    def create_correction(self, record_id: str, mode: str, guide_note: str, optimized_answer: str) -> dict[str, Any]:
        correction = self._insert("guide_corrections", {"id": uuid.uuid4().hex, "record_id": record_id, "mode": mode, "guide_note": guide_note, "optimized_answer": optimized_answer, "status": "pending", "created_at": _now()})
        self.create_review("correction", correction["id"], f"导游修正 {record_id}", optimized_answer, "导游端修正", ["导游修正", mode])
        return correction

    def add_feedback(self, message_id: str, rating: int, content: str) -> dict[str, Any]:
        return self._insert("feedback", {"id": uuid.uuid4().hex, "message_id": message_id, "rating": rating, "content": content, "status": "open", "created_at": _now()})


runtime = RuntimeStore()
