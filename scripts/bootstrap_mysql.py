from __future__ import annotations

import csv
import os
from pathlib import Path

import pymysql

ROOT = Path(__file__).resolve().parents[1]
CSV_DIR = ROOT / "backend" / "app" / "data" / "csv"
TABLES = {
    "knowledge_items": "id VARCHAR(128) PRIMARY KEY, title VARCHAR(255), content TEXT, tags VARCHAR(1000), sort_order INT, updated_at VARCHAR(40)",
    "graph_relations": "id VARCHAR(128) PRIMARY KEY, source VARCHAR(255), relation VARCHAR(255), target VARCHAR(255), sort_order INT, updated_at VARCHAR(40)",
    "guide_places": "id VARCHAR(128) PRIMARY KEY, name VARCHAR(255), image_key VARCHAR(128), tags VARCHAR(1000), sort_order INT, updated_at VARCHAR(40)",
    "guide_questions": "id INT PRIMARY KEY, question VARCHAR(1000), sort_order INT",
    "routes": "route_key VARCHAR(128) PRIMARY KEY, name VARCHAR(255), match_terms VARCHAR(1000), mode VARCHAR(255), reason TEXT, nodes TEXT, sort_order INT, updated_at VARCHAR(40)",
    "route_filters": "id INT PRIMARY KEY, filter_type VARCHAR(64), value VARCHAR(255), sort_order INT",
    "training_scenarios": "id VARCHAR(128) PRIMARY KEY, language VARCHAR(64), scene VARCHAR(255), visitor_type VARCHAR(255), question VARCHAR(1000), reference_answers TEXT, sort_order INT, updated_at VARCHAR(40)",
    "collaboration_cases": "id INT PRIMARY KEY, case_type VARCHAR(255), question VARCHAR(1000), strategy TEXT, guide_note TEXT, sort_order INT, updated_at VARCHAR(40)",
}


def main() -> None:
    host = os.getenv("MYSQL_HOST", "127.0.0.1")
    port = int(os.getenv("MYSQL_PORT", "3307"))
    user = os.getenv("MYSQL_USER", "linguaspace")
    password = os.getenv("MYSQL_PASSWORD", "linguaspace")
    database = os.getenv("MYSQL_DATABASE", "linguaspace")
    force_bootstrap = os.getenv("BOOTSTRAP_FORCE", "").lower() in ("1", "true", "yes")
    connection = pymysql.connect(host=host, port=port, user=user, password=password, charset="utf8mb4")
    with connection, connection.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        cursor.execute(f"USE `{database}`")
        for table, columns in TABLES.items():
            cursor.execute(f"CREATE TABLE IF NOT EXISTS `{table}` ({columns})")
            cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
            if cursor.fetchone()[0] and not force_bootstrap:
                continue
            if force_bootstrap:
                cursor.execute(f"DELETE FROM `{table}`")
            with (CSV_DIR / f"{table}.csv").open("r", encoding="utf-8-sig", newline="") as handle:
                rows = list(csv.DictReader(handle))
            if rows:
                keys = list(rows[0])
                marks = ",".join(["%s"] * len(keys))
                cursor.executemany(f"INSERT INTO `{table}` ({','.join(f'`{key}`' for key in keys)}) VALUES ({marks})", [[row[key] or None for key in keys] for row in rows])
            print(f"{table}: {len(rows)}")
        connection.commit()


if __name__ == "__main__":
    main()
