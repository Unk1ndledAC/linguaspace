from __future__ import annotations

import csv
import os
from pathlib import Path

import pymysql

ROOT = Path(__file__).resolve().parents[1]
CSV_DIR = ROOT / "backend" / "app" / "data" / "csv"
TABLES = ("knowledge_items", "graph_relations", "guide_places", "guide_questions", "routes", "route_filters", "training_scenarios", "collaboration_cases")


def main() -> None:
    connection = pymysql.connect(host=os.getenv("MYSQL_HOST", "127.0.0.1"), user=os.getenv("MYSQL_USER", "root"), password=os.getenv("MYSQL_PASSWORD", ""), database=os.getenv("MYSQL_DATABASE", "linguaspace"), charset="utf8mb4")
    with connection, connection.cursor() as cursor:
        for table in TABLES:
            with (CSV_DIR / f"{table}.csv").open("r", encoding="utf-8-sig", newline="") as handle:
                rows = list(csv.DictReader(handle))
            if not rows:
                continue
            columns = list(rows[0])
            cursor.execute(f"DELETE FROM `{table}`")
            marks = ",".join(["%s"] * len(columns))
            cursor.executemany(f"INSERT INTO `{table}` ({','.join(f'`{item}`' for item in columns)}) VALUES ({marks})", [[row[column] or None for column in columns] for row in rows])
            print(f"{table}: {len(rows)}")
        connection.commit()


if __name__ == "__main__":
    main()
