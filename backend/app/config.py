from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    app_name: str = "LinguaSpace API"
    data_dir: Path = Path(__file__).parent / "data" / "csv"
    media_dir: Path = Path(__file__).parent.parent / "media"
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "qwen3.5:0.8b")
    ollama_vision_model: str = os.getenv("OLLAMA_VISION_MODEL", "qwen3-vl:4b")
    llm_provider: str = os.getenv("LLM_PROVIDER", "ollama")
    openai_compatible_base_url: str = os.getenv("OPENAI_COMPATIBLE_BASE_URL", "")
    openai_compatible_api_key: str = os.getenv("OPENAI_COMPATIBLE_API_KEY", "")
    openai_compatible_model: str = os.getenv("OPENAI_COMPATIBLE_MODEL", "")
    mysql_url: str = os.getenv("MYSQL_URL", "mysql+pymysql://root@127.0.0.1:3306/linguaspace")
    data_backend: str = os.getenv("DATA_BACKEND", "mysql")
    runtime_backend: str = os.getenv("RUNTIME_BACKEND", "mysql")
    enable_llm_judge: bool = os.getenv("ENABLE_LLM_JUDGE", "true").lower() == "true"
    whisper_model: str = os.getenv("WHISPER_MODEL", "small")
    enforce_auth: bool = os.getenv("ENFORCE_AUTH", "false").lower() == "true"
    app_secret: str = os.getenv("APP_SECRET", "linguaspace-local-demo-secret")


settings = Settings()
settings.media_dir.mkdir(parents=True, exist_ok=True)
