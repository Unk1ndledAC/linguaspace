from __future__ import annotations

import json
import re
import uuid
from datetime import datetime
from threading import RLock
from typing import Any
from urllib.parse import unquote, urlparse

import pymysql

from .config import settings
from .embeddings import cosine, hash_embedding, tokens


def _split(value: str) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
    except json.JSONDecodeError:
        pass
    return [item.strip() for item in re.split(r"[,，|]", value) if item.strip()]


class Store:
    def __init__(self) -> None:
        self.lock = RLock()
        self.reload()

    def reload(self) -> None:
        with self.lock:
            data = {name: self._load_table(name) for name in ("knowledge_items", "graph_relations", "guide_places", "routes", "route_filters", "training_scenarios", "collaboration_cases", "guide_questions")}
            self.knowledge = data["knowledge_items"]
            self.graph = data["graph_relations"]
            self.places = data["guide_places"]
            self.routes = data["routes"]
            self.filters = data["route_filters"]
            self.scenarios = data["training_scenarios"]
            self.cases = data["collaboration_cases"]
            self.questions = data["guide_questions"]
            self.logs: list[dict[str, Any]] = []
            self.reviews: list[dict[str, Any]] = []

    def list_knowledge(self) -> list[dict[str, Any]]:
        return [self._knowledge_view(item) for item in self.knowledge]

    def search_knowledge(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        terms = [part for part in re.split(r"\W+", query.lower()) if part]
        keyword_terms = [part for part in re.split(r"[\s,，|]+", query) if part]
        graph_relations = self.graph_query(query)
        graph_terms = {item["source"] for item in graph_relations} | {item["target"] for item in graph_relations}
        graph_terms = {term for term in graph_terms if term and term not in keyword_terms}
        query_tokens = tokens(query)
        query_vector = hash_embedding(query)
        scored: list[tuple[float, dict[str, str], list[str], dict[str, float]]] = []
        for item in self.knowledge:
            haystack = f"{item.get('title', '')} {item.get('content', '')} {item.get('tags', '')}".lower()
            keyword_score = sum(2 if term in item.get("title", "").lower() else 1 for term in terms if term in haystack)
            # Chinese queries often have no whitespace; reward direct title/tag occurrences.
            keyword_score += sum(3 for tag in _split(item.get("tags", "")) if tag and tag in query)
            match_terms = [term for term in keyword_terms if term and term in haystack]
            keyword_score += len(match_terms) * 0.8
            graph_matches = [term for term in graph_terms if term and term in haystack]
            graph_score = len(graph_matches) * 1.1
            overlap = len(query_tokens & tokens(haystack))
            if keyword_score or overlap or graph_score:
                similarity = cosine(query_vector, hash_embedding(haystack))
                total_score = keyword_score + overlap * 1.5 + similarity * 2.0 + graph_score
                breakdown = {"keyword": keyword_score, "overlap": overlap, "vector": similarity, "graph": graph_score}
                scored.append((total_score, item, match_terms + graph_matches, breakdown))
        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [self._knowledge_view(item, score, match_terms, breakdown) for score, item, match_terms, breakdown in scored[:top_k]]

    def add_knowledge(self, payload: dict[str, Any]) -> dict[str, Any]:
        with self.lock:
            item = {
                "id": payload.get("id") or f"kb-{uuid.uuid4().hex[:10]}",
                "title": payload["title"],
                "content": payload["content"],
                "tags": json.dumps(payload.get("tags", []), ensure_ascii=False),
                "sort_order": str(len(self.knowledge) + 1),
                "updated_at": datetime.now().isoformat(timespec="seconds"),
            }
            self.knowledge.append(item)
            self._persist("knowledge_items", self.knowledge)
            return self._knowledge_view(item)

    def update_knowledge(self, doc_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        with self.lock:
            item = self._find(self.knowledge, doc_id)
            item.update(title=payload["title"], content=payload["content"], tags=json.dumps(payload.get("tags", []), ensure_ascii=False))
            item["updated_at"] = datetime.now().isoformat(timespec="seconds")
            self._persist("knowledge_items", self.knowledge)
            return self._knowledge_view(item)

    def delete_knowledge(self, doc_id: str) -> None:
        with self.lock:
            self.knowledge.remove(self._find(self.knowledge, doc_id))
            self._persist("knowledge_items", self.knowledge)

    def list_graph(self, keyword: str = "") -> list[dict[str, str]]:
        rows = self.graph
        if keyword:
            rows = [item for item in rows if keyword in f"{item.get('source', '')}{item.get('relation', '')}{item.get('target', '')}"]
        return [{"id": item["id"], "source": item["source"], "relation": item["relation"], "target": item["target"]} for item in rows]

    def add_graph(self, payload: dict[str, str]) -> dict[str, str]:
        with self.lock:
            item = {"id": f"rel-{uuid.uuid4().hex[:10]}", **payload, "sort_order": str(len(self.graph) + 1), "updated_at": datetime.now().isoformat(timespec="seconds")}
            self.graph.append(item)
            self._persist("graph_relations", self.graph)
            return self.list_graph(item["id"])[0] if False else {key: item[key] for key in ("id", "source", "relation", "target")}

    def update_graph(self, relation_id: str, payload: dict[str, str]) -> dict[str, str]:
        with self.lock:
            item = self._find(self.graph, relation_id)
            item.update(payload)
            item["updated_at"] = datetime.now().isoformat(timespec="seconds")
            self._persist("graph_relations", self.graph)
            return {key: item[key] for key in ("id", "source", "relation", "target")}

    def delete_graph(self, relation_id: str) -> None:
        with self.lock:
            self.graph.remove(self._find(self.graph, relation_id))
            self._persist("graph_relations", self.graph)

    def graph_query(self, entity: str) -> list[dict[str, str]]:
        return [item for item in self.list_graph() if entity in item["source"] or entity in item["target"]][:40]

    def add_scenario(self, payload: dict[str, Any]) -> dict[str, Any]:
        with self.lock:
            item = {"id": payload.get("id") or f"scenario-{uuid.uuid4().hex[:10]}", "language": payload.get("language", "中文"), "scene": payload["scene"], "visitor_type": payload["visitor_type"], "question": payload["question"], "reference_answers": json.dumps(payload.get("reference_answers", []), ensure_ascii=False), "sort_order": str(len(self.scenarios) + 1), "updated_at": datetime.now().isoformat(timespec="seconds")}
            self.scenarios.append(item)
            self._persist("training_scenarios", self.scenarios)
            return item

    def update_scenario(self, scenario_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        with self.lock:
            item = self._find(self.scenarios, scenario_id)
            item.update(language=payload.get("language", item["language"]), scene=payload["scene"], visitor_type=payload["visitor_type"], question=payload["question"], reference_answers=json.dumps(payload.get("reference_answers", []), ensure_ascii=False), updated_at=datetime.now().isoformat(timespec="seconds"))
            self._persist("training_scenarios", self.scenarios)
            return item

    def delete_scenario(self, scenario_id: str) -> None:
        with self.lock:
            self.scenarios.remove(self._find(self.scenarios, scenario_id))
            self._persist("training_scenarios", self.scenarios)

    @staticmethod
    def _find(rows: list[dict[str, Any]], item_id: str) -> dict[str, Any]:
        for item in rows:
            if str(item.get("id")) == str(item_id):
                return item
        raise KeyError(item_id)

    @staticmethod
    def _knowledge_view(
        item: dict[str, str],
        score: float | None = None,
        match_terms: list[str] | None = None,
        score_breakdown: dict[str, float] | None = None,
    ) -> dict[str, Any]:
        return {
            "id": item["id"],
            "title": item["title"],
            "snippet": item["content"],
            "content": item["content"],
            "tags": _split(item.get("tags", "")),
            "score": score,
            "match_terms": match_terms or [],
            "score_breakdown": score_breakdown or {},
        }

    def _connect(self):
        parsed = urlparse(settings.mysql_url.replace("mysql+pymysql://", "mysql://"))
        return pymysql.connect(host=parsed.hostname or "127.0.0.1", port=parsed.port or 3306, user=unquote(parsed.username or "linguaspace"), password=unquote(parsed.password or "linguaspace"), database=(parsed.path or "/linguaspace").lstrip("/"), charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor, connect_timeout=3)

    def _load_table(self, name: str) -> list[dict[str, str]]:
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(f"SELECT * FROM `{name}` ORDER BY 1")
            return [{key: "" if value is None else str(value) for key, value in row.items()} for row in cursor.fetchall()]

    def _persist(self, name: str, rows: list[dict[str, Any]]) -> None:
        with self._connect() as connection, connection.cursor() as cursor:
            cursor.execute(f"DELETE FROM `{name}`")
            if rows:
                columns = list(rows[0])
                marks = ",".join(["%s"] * len(columns))
                cursor.executemany(f"INSERT INTO `{name}` ({','.join(f'`{item}`' for item in columns)}) VALUES ({marks})", [[row.get(column) or None for column in columns] for row in rows])
            connection.commit()


store = Store()
