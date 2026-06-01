from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any

from .config import settings


class CacheAdapter:
    def __init__(self) -> None:
        import redis

        self.client = redis.from_url("redis://127.0.0.1:6379/0", socket_connect_timeout=3)
        self.client.ping()

    @property
    def backend(self) -> str:
        return "redis"

    def get(self, key: str) -> Any | None:
        raw = self.client.get(key)
        return json.loads(raw) if raw else None

    def set(self, key: str, value: Any, ttl: int = 600) -> None:
        self.client.setex(key, ttl, json.dumps(value, ensure_ascii=False))


class ObjectStorageAdapter:
    def __init__(self) -> None:
        from minio import Minio
        from urllib3 import PoolManager, Timeout

        http_client = PoolManager(timeout=Timeout(connect=3, read=3), retries=False)
        self.client = Minio("127.0.0.1:9000", access_key="linguaspace", secret_key="linguaspace-local", secure=False, http_client=http_client)
        if not self.client.bucket_exists("linguaspace"):
            self.client.make_bucket("linguaspace")

    @property
    def backend(self) -> str:
        return "minio"

    def save(self, category: str, filename: str, content: bytes) -> dict[str, str]:
        from io import BytesIO

        safe_name = f"{category}-{uuid.uuid4().hex}{Path(filename).suffix}"
        path = settings.media_dir / safe_name
        path.write_bytes(content)
        object_name = f"{category}/{safe_name}"
        self.client.put_object("linguaspace", object_name, BytesIO(content), len(content))
        return {"url": f"minio://linguaspace/{object_name}", "local_path": str(path), "backend": self.backend}


class GraphMirrorAdapter:
    def __init__(self) -> None:
        from neo4j import GraphDatabase

        self.driver = GraphDatabase.driver("bolt://127.0.0.1:7687", auth=("neo4j", "linguaspace"), connection_timeout=3)
        self.driver.verify_connectivity()

    @property
    def backend(self) -> str:
        return "neo4j"

    def upsert(self, source: str, relation: str, target: str) -> None:
        with self.driver.session() as session:
            session.run("MERGE (a:CultureEntity {name: $source}) MERGE (b:CultureEntity {name: $target}) MERGE (a)-[r:RELATED {type: $relation}]->(b)", source=source, target=target, relation=relation)


cache = CacheAdapter()
objects = ObjectStorageAdapter()
graph_mirror = GraphMirrorAdapter()
