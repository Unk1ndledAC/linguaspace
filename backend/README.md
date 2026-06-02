# LinguaSpace Backend

FastAPI backend for the LinguaSpace Yunnan tourism platform. The backend is intended to run through the repository-level one-click startup script so all real infrastructure is available before the API process starts.

## Run

Use the root startup script:

```powershell
..\scripts\start-linguaspace.ps1
```

The script installs required backend dependencies, starts Docker infrastructure, checks Ollama models, bootstraps MySQL seed data, and then starts Uvicorn. Running the backend alone is not an acceptance path because MySQL, Redis, MinIO and Neo4j are required at import/runtime.

## Required adapters

```powershell
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m pip install -r requirements-infra.txt
.\.venv\Scripts\python -m pip install -r requirements-asr.txt
```

Redis, MinIO, Neo4j and faster-whisper are required adapters. If any required service or adapter is unavailable, startup or the corresponding request fails instead of falling back to memory, local files or browser-only ASR.

## Storage

- MySQL is the required data and runtime store for seed content, sessions, messages, logs, reviews, terms, training reports and corrections.
- CSV files under `app/data/csv/` are seed input for `scripts/bootstrap_mysql.py`; they are not a runtime fallback.
- PostgreSQL/pgvector, Redis, MinIO and Neo4j are started by the root `docker-compose.yml` as required infrastructure.

## Providers

Default local Ollama:

```text
LLM_PROVIDER=ollama
OLLAMA_MODEL=qwen3.5:9b
OLLAMA_VISION_MODEL=qwen3-vl:4b
```

OpenAI-compatible text provider:

```text
LLM_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_BASE_URL=https://api.example.com/v1
OPENAI_COMPATIBLE_API_KEY=...
OPENAI_COMPATIBLE_MODEL=...
```

Vision remains independently configurable through Ollama.
