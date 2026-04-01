# 语界 LinguaSpace

LinguaSpace 是面向云南文旅场景的单机可演示系统。当前版本已经把前端 Demo 接入真实 FastAPI 后端，并提供 RAG 问答、Ollama 模型调用、图片问答占位、文化知识图谱、路线推荐、AI 导游实训评分和 AI + 真人导游协同接口。

## 本地一键启动

前置条件：

- Docker Desktop
- Python 3.12
- Node.js 18+
- Ollama

双击根目录的 `start-linguaspace.bat` 即可一键拉起服务。

也可以用 PowerShell：

```powershell
.\scripts\start-linguaspace.ps1
```

停止前后端：

```powershell
.\stop-linguaspace.bat
```

启动后访问：

- 前端：http://localhost:5173
- 游客端：http://localhost:5173/visitor
- 学生端：http://localhost:5173/student
- 导游端：http://localhost:5173/guide
- 管理端：http://localhost:5173/admin
- 后端健康检查：http://localhost:8000/api/health
- 技术架构审计：http://localhost:8000/api/architecture/audit
- MinIO 控制台：http://localhost:9001
- Neo4j Browser：http://localhost:7474

如果只想启动依赖服务：

```powershell
docker compose up -d
```

如果 Ollama 没有模型：

```powershell
ollama pull qwen3.5:0.8b
# 或者
ollama pull qwen2.5:1.5b
```

## 手动启动前后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

前端 API 地址通过 `frontend/.env` 或环境变量配置：

```text
VITE_API_BASE_URL=http://localhost:8000
```

## API 能力

- `GET /api/health`：检查 API、Ollama、Postgres/pgvector、Redis、MinIO、Neo4j 配置状态。
- `GET /api/architecture/audit`：客观对照技术架构，返回各层达成状态和缺口。
- `POST /api/chat`：文本导览问答，先检索知识库，再调用 Ollama，返回答案和来源。
- `GET /api/knowledge`：管理端读取知识库内容。
- `POST /api/knowledge`：添加已审核知识。
- `POST /api/knowledge/search`：检索知识片段。
- `POST /api/audio/transcribe`、`POST /api/audio/ask`：语音接口占位，后续可接入 faster-whisper。
- `POST /api/image/ask`：调用 Ollama `qwen3-vl:4b` 做图片理解，再进入 RAG 问答。
- `POST /api/tts/synthesize`：调用 Windows SAPI 生成 WAV 语音文件，并通过 `/media/...` 返回。
- `POST /api/graph/query`：查询文化实体关系。
- `GET /api/graph`：管理端读取完整示例图谱关系。
- `POST /api/route/recommend`：路线推荐。
- `POST /api/training/score`：AI 导游实训评分。
- `POST /api/collaboration/summary`：AI + 真人导游协同摘要。
- `POST /api/collaboration/correction`：导游修正内容提交审核入库。

## 切换模型供应商

默认使用本机 Ollama：

```text
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3.5:0.8b
OLLAMA_FALLBACK_MODEL=qwen2.5:1.5b
```

后续切换 DeepSeek、Qwen API 或其他 OpenAI-compatible 服务：

```text
LLM_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_BASE_URL=https://api.example.com/v1
OPENAI_COMPATIBLE_API_KEY=your-key
OPENAI_COMPATIBLE_MODEL=your-model
```

业务代码只依赖 `LLMProvider` 抽象，不需要改前端或路由。

## 验证

前端构建：

```powershell
cd frontend
npm run build
```

后端测试：

```powershell
cd backend
python -m pytest
```

如果当前 Python 环境暂时没有 pytest，可先做轻量冒烟：

```powershell
cd backend
python -c "from fastapi.testclient import TestClient; from app.main import app; c=TestClient(app); print(c.get('/api/health').json()['status'])"
```

## 当前架构达成度

管理端 `/admin` 会直接读取 `/api/architecture/audit`。当前客观状态是“单机演示闭环已完成，生产级完整六阶段未完成”：

- 已完成：用户端/管理端拆分、Ollama LLM 接入、`qwen3-vl:4b` 图片理解、浏览器实时 ASR、Windows SAPI TTS、RAG 优先回答、来源追溯、知识库录入和检索 API、图谱查询 API、路线推荐、实训评分、协同摘要。
- 部分完成：PostgreSQL/pgvector、Redis、MinIO、Neo4j 已提供 Docker Compose 和健康检测，但运行时 RAG 仍以内存向量兜底。
- 仍待增强：服务端音频文件 ASR 尚未接入 faster-whisper/ffmpeg；TTS 当前依赖 Windows SAPI，后续可替换 Piper/MeloTTS；图片精确景点识别仍需依赖知识库校验。
