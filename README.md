# 语界 LinguaSpace

语界是面向云南文旅场景的单机可运行系统，包含游客端、学生端、导游端和管理端。当前版本按最终验收口径启动：Docker 基础设施、MySQL、PostgreSQL/pgvector、Redis、MinIO、Neo4j 与本机 Ollama 模型必须真实可用，不做离线或本地模拟降级。

## 一键启动

前置条件：

- Python 3.10+
- Node.js 18+
- Ollama，已安装 `qwen3.5:0.8b` 与 `qwen3-vl:4b`
- Docker Desktop，用于一次性拉起 MySQL、PostgreSQL/pgvector、Redis、MinIO、Neo4j

双击 `start-linguaspace.bat`，或执行：

```powershell
.\scripts\start-linguaspace.ps1
```

启动脚本会自动读取根目录 `.env`，然后强制执行完整启动链路：`docker compose up -d` 拉起基础设施，等待 MySQL/PostgreSQL/Redis/MinIO/Neo4j/Ollama 可连接，校验 `OLLAMA_MODEL` 与 `OLLAMA_VISION_MODEL` 已安装，初始化 MySQL 种子数据，最后启动 FastAPI 与前端。任一关键依赖不可用时启动会直接失败。开启 `ENFORCE_AUTH=true` 后，管理写操作和导游接管接口需要携带登录接口签发的 Bearer Token。

访问地址（前端端口会自动选择空闲端口，以下以 5186 为例，实际以启动输出为准）：

- 品牌介绍页：http://localhost:5186
- 游客端：http://localhost:5186/visitor
- 学生端：http://localhost:5186/student
- 导游端：http://localhost:5186/guide
- 管理端：http://localhost:5186/admin
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

若需要强制用 CSV 重新覆盖 MySQL（例如更新图谱语义关系），可先设置：

```powershell
$env:BOOTSTRAP_FORCE="1"
```

本机默认 MySQL 配置为 `linguaspace` 用户、密码 `linguaspace`、数据库 `linguaspace`，由 `docker-compose.yml` 中的 MySQL 容器提供。若 3306 已被占用，会映射到 3307。若 MySQL root 密码不是 `linguaspace-root`，请在 `.env` 或环境变量中设置 `MYSQL_ROOT_PASSWORD`。

## 基础设施

```powershell
docker compose up -d
```

该命令拉起 MySQL、PostgreSQL/pgvector、Redis、MinIO 和 Neo4j。一键启动脚本会自动执行该命令并做端口与模型校验；后端不再使用 CSV、内存缓存、本地文件或 MySQL/CSV 图谱作为运行时降级链路。

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
- 混合检索（向量 + 关键词 + 图谱语义扩展）与可解释的检索得分。
- 图谱语义增强：讲解关系、游客类型适配、禁忌/风险提示、时空属性。
- Ollama 文本模型、Ollama 视觉模型、`faster-whisper` ASR、Windows SAPI TTS。
- OpenAI-compatible 文本 Provider，可通过环境变量切换 DeepSeek、Qwen 等云端 API。
- 知识文档上传、分片、待审核、通过发布、退回与下线。
- 文化知识图谱查询与 CRUD、路线推荐、术语表与基础多语一致性替换。
- AI 导游实训场景 CRUD、LLM-as-Judge 评分、安全规则限分、报告持久化。
- 游客会话、导游接管、人工回复、导游修正、修正审核与反馈闭环。
- 用户登录、用户管理、模型调用日志、健康检查、知识统计和架构审计。
