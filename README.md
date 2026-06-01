# 语界 LinguaSpace

语界是面向云南文旅场景的单机可运行系统，包含游客端、学生端、导游端和管理端。当前版本使用本机 Ollama 提供 LLM 与视觉模型能力，CSV 文件作为可扩展种子数据，支持同步导入 MySQL。

## 一键启动

前置条件：

- Python 3.10+
- Node.js 18+
- Ollama，已安装 `qwen3.5:0.8b` 与 `qwen3-vl:4b`
- 可选：Docker Desktop，用于 PostgreSQL/pgvector、Redis、MinIO、Neo4j

双击 `start-linguaspace.bat`，或执行：

```powershell
.\scripts\start-linguaspace.ps1
```

启动脚本会自动读取根目录 `.env`。如需开启本机 Whisper、Redis/MinIO/Neo4j 适配器或角色鉴权，可先从 `.env.example` 复制一份 `.env`，再启用对应开关。开启 `ENFORCE_AUTH=true` 后，管理写操作和导游接管接口需要携带登录接口签发的 Bearer Token。

访问地址：

- 品牌介绍页：http://localhost:5173
- 游客端：http://localhost:5173/visitor
- 学生端：http://localhost:5173/student
- 导游端：http://localhost:5173/guide
- 管理端：http://localhost:5173/admin
- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/api/health

停止服务：

```powershell
.\scripts\stop-linguaspace.ps1
```

## 数据扩展

可编辑数据位于 `backend/app/data/csv/`。当前包含知识库、文化图谱、景点、常见问题、路线、路线筛选项、实训场景和导游协同案例。

将 CSV 同步到本机 MySQL：

```powershell
python .\scripts\import_csv_to_mysql.py
```

本机默认 MySQL 配置为 `root` 用户、空密码、数据库 `linguaspace`。

## 可选基础设施

```powershell
docker compose up -d
```

该命令拉起 PostgreSQL/pgvector、Redis、MinIO 和 Neo4j。单机演示在这些组件未启动时仍可使用 CSV 数据和本机 Ollama 运行核心闭环。

## 验证

```powershell
cd backend
python -m pytest
cd ..\frontend
npm run build
```

## 关键约束

- 文化类回答必须先检索知识库；没有可信来源时返回“暂无可靠资料”。
- 图片模型只负责识别与生成检索关键词，文化解释仍由 RAG 链路生成。
- 实训评分使用 LLM-as-Judge，同时以规则保护安全、礼仪和服务边界。
- 导游修正不会直接进入正式知识库，而是先提交审核任务。

## 后端能力

当前 FastAPI 后端实现完整单机闭环：

- 文本 RAG 问答、流式输出、无资料拒答、来源追踪和会话消息持久化。
- Ollama 文本模型、Ollama 视觉模型、可选 `faster-whisper` ASR、浏览器 ASR 降级、Windows SAPI TTS。
- OpenAI-compatible 文本 Provider，可通过环境变量切换 DeepSeek、Qwen 等云端 API。
- 知识文档上传、分片、待审核、通过发布、退回与下线。
- 文化知识图谱查询与 CRUD、路线推荐、术语表与基础多语一致性替换。
- AI 导游实训场景 CRUD、LLM-as-Judge 评分、安全规则限分、报告持久化。
- 游客会话、导游接管、人工回复、导游修正、修正审核与反馈闭环。
- 用户登录、用户管理、模型调用日志、健康检查、知识统计和架构审计。
