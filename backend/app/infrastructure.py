from __future__ import annotations

import json
import time
import uuid
from pathlib import Path
from typing import Any

from .config import settings


class CacheAdapter:
    def __init__(self) -> None:
        self.memory: dict[str, tuple[float, str]] = {}
        self.client = None
        try:
            import redis

            self.client = redis.from_url("redis://127.0.0.1:6379/0", socket_connect_timeout=0.3)
            self.client.ping()
        except Exception:
            self.client = None

    @property
    def backend(self) -> str:
        return "redis" if self.client else "memory"

    def get(self, key: str) -> Any | None:
        if self.client:
            raw = self.client.get(key)
            return json.loads(raw) if raw else None
        item = self.memory.get(key)
        if not item or item[0] < time.time():
            return None
        return json.loads(item[1])

    def set(self, key: str, value: Any, ttl: int = 600) -> None:
        raw = json.dumps(value, ensure_ascii=False)
        if self.client:
            self.client.setex(key, ttl, raw)
        else:
            self.memory[key] = (time.time() + ttl, raw)


class ObjectStorageAdapter:
    def __init__(self) -> None:
        self.client = None
        try:
            from minio import Minio
            from urllib3 import PoolManager, Timeout

            http_client = PoolManager(timeout=Timeout(connect=0.3, read=0.3), retries=False)
            self.client = Minio("127.0.0.1:9000", access_key="linguaspace", secret_key="linguaspace-local", secure=False, http_client=http_client)
            if not self.client.bucket_exists("linguaspace"):
                self.client.make_bucket("linguaspace")
        except Exception:
            self.client = None

    @property
    def backend(self) -> str:
        return "minio" if self.client else "local-filesystem"

    def save(self, category: str, filename: str, content: bytes) -> dict[str, str]:
        safe_name = f"{category}-{uuid.uuid4().hex}{Path(filename).suffix}"
        path = settings.media_dir / safe_name
        path.write_bytes(content)
        if self.client:
            from io import BytesIO

            object_name = f"{category}/{safe_name}"
            self.client.put_object("linguaspace", object_name, BytesIO(content), len(content))
            return {"url": f"minio://linguaspace/{object_name}", "local_path": str(path), "backend": self.backend}
        return {"url": f"/media/{safe_name}", "local_path": str(path), "backend": self.backend}


class GraphMirrorAdapter:
    def __init__(self) -> None:
        self.driver = None
        try:
            from neo4j import GraphDatabase

            self.driver = GraphDatabase.driver("bolt://127.0.0.1:7687", auth=("neo4j", "linguaspace"), connection_timeout=0.4)
            self.driver.verify_connectivity()
        except Exception:
            if self.driver:
                self.driver.close()
            self.driver = None

    @property
    def backend(self) -> str:
        return "neo4j" if self.driver else "mysql-csv"

    def upsert(self, source: str, relation: str, target: str) -> None:
        if not self.driver:
            return
        with self.driver.session() as session:
            session.run("MERGE (a:CultureEntity {name: $source}) MERGE (b:CultureEntity {name: $target}) MERGE (a)-[r:RELATED {type: $relation}]->(b)", source=source, target=target, relation=relation)


cache = CacheAdapter()
objects = ObjectStorageAdapter()
graph_mirror = GraphMirrorAdapter()
