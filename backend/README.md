# LinguaSpace Backend

FastAPI single-machine backend for the LinguaSpace Yunnan tourism platform.

## Run

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Optional server-side ASR:

```powershell
.\.venv\Scripts\python -m pip install -r requirements-asr.txt
```

Without `faster-whisper`, uploaded audio is stored and the API reports a clear degraded state. Browser SpeechRecognition remains available for real-time visitor input.

Optional Redis, MinIO and Neo4j adapters:

```powershell
.\.venv\Scripts\python -m pip install -r requirements-infra.txt
```

When the enhancement services are unavailable the backend automatically uses memory cache, local files and the MySQL/CSV graph store.

## Storage

- MySQL is the default runtime store for sessions, messages, logs, reviews, terms, training reports and corrections.
- CSV files under `app/data/csv/` are editable seed data and the offline fallback.
- PostgreSQL/pgvector, Redis, MinIO and Neo4j can be started by the root `docker-compose.yml` as enhancement services.

## Providers

Default local Ollama:

```text
LLM_PROVIDER=ollama
OLLAMA_MODEL=qwen3.5:0.8b
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
