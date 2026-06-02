# LinguaSpace 前端实施计划

> 最后更新：2026-06-02  
> 权威依据：页面结构以 `docs/LinguaSpace_frontend_page_design.md` 为准，接口以 `backend/app/main.py` 为准。设计文档中的接口名仅作为需求提示，真实后端路由优先。

## 1. 已读取资料

- `docs/LinguaSpace_frontend_page_design.md`
- `docs/references.md`
- `docs/codex/01_goal.md`
- `docs/codex/02_context_and_constraints.md`
- `docs/codex/03_workflow.md`
- `docs/codex/04_architecture_and_api.md`
- `docs/codex/05_visual_and_assets.md`
- `docs/codex/06_validation_and_done.md`
- `backend/app/main.py`
- `backend/app/runtime_store.py`
- `backend/app/store.py`
- `backend/app/auth.py`
- `backend/README.md`
- `backend/tests/test_api.py`
- 现有 `frontend/src/`、`frontend/package.json` 与根目录 `README.md`

参考网页清单：

- 文旅沉浸式：`https://www.avoriaz.com/`
- 文旅沉浸式：`https://badruttspalace.com/en/winter/`
- 文旅沉浸式：`https://www.66nord.com/`
- 后台科技风：`https://preview.colorlib.com/theme/adminator/index.html`
- 后台科技风：`https://preview.tabler.io/`
- 图谱交互：`http://graphvis.cn/graphvis/apps/index.html`
- 图谱交互：Neo4j 原生图谱可视化方案

## 2. 当前代码盘点

现有前端是早期版本：使用 `window.location.pathname` 手写分发，包含首页、游客问答、图片识别、路线推荐、学生实训、导游问答、管理总览、健康、知识库、图谱和日志等少量页面。已有真实 API 调用，但缺少设计文档要求的 React Router 嵌套路由、双 Layout、集中导航、统一认证、统一错误模型、通用状态组件，以及大量子页面。

现有本地图片位于 `frontend/public/assets/`。这些资源仅作为项目本地资产使用；新增图片需求统一登记到 `docs/image-prompts.md`，不联网下载素材。

## 3. 真实后端能力映射

### 已存在的真实能力

| 能力 | 真实接口 |
| --- | --- |
| 健康检查 | `GET /api/health` |
| 架构审计 | `GET /api/architecture/audit` |
| 登录 | `POST /api/auth/login` |
| 用户列表、新增、状态更新 | `GET /api/users`、`POST /api/users`、`PUT /api/users/:id/status` |
| 会话创建、列表、画像 | `POST /api/sessions`、`GET /api/sessions`、`GET /api/sessions/:id/profile` |
| 游客问答 | `POST /api/chat`、`POST /api/chat/stream` |
| 路线内容与推荐 | `GET /api/content/routes`、`POST /api/route/recommend` |
| 图片问答 | `POST /api/image/ask`、`POST /api/image/ask/stream` |
| 音频识别与问答 | `POST /api/audio/transcribe`、`POST /api/audio/ask` |
| TTS | `POST /api/tts/synthesize` |
| 知识 CRUD、检索、统计 | `GET/POST /api/knowledge`、`PUT/DELETE /api/knowledge/:id`、`POST /api/knowledge/search`、`GET /api/knowledge/stats` |
| 文档上传与审核切片 | `GET/POST /api/knowledge/documents` |
| 图谱 CRUD 与查询 | `GET/POST /api/graph`、`PUT/DELETE /api/graph/:id`、`POST /api/graph/query` |
| 审核任务 | `GET /api/review/tasks`、`POST /api/review/tasks/:id/decision` |
| 术语 CRUD | `GET/POST /api/terms`、`PUT/DELETE /api/terms/:id` |
| 导游协同 | `GET /api/collaboration/sessions`、`GET /api/collaboration/cases`、`GET /api/collaboration/corrections`、`POST /api/collaboration/summary`、`POST /api/collaboration/correction` |
| 导游接管与回复 | `POST /api/sessions/:id/takeover`、`POST /api/sessions/:id/guide-reply` |
| 模型与请求日志 | `GET /api/logs/model-calls`、`GET /api/logs/request-traces` |
| 反馈 | `GET/POST /api/feedback` |

### 缺失或不完整能力

- 首页综合统计没有专用 `/api/stats/overview`，可使用真实 `GET /api/knowledge/stats` 展示其已覆盖字段，未覆盖字段显示“接口待接入”。
- 会话详情没有独立接口；`GET /api/collaboration/sessions` 返回会话及消息，可在前端筛选当前会话。
- 游客首页推荐、热门问题、当前位置和偏好写入没有专用接口；可使用 `GET /api/content/guide`、`GET /api/content/routes` 展示真实内容，缺失项标注待接入。
- 文化提醒没有专用接口；先标注待接入，不从前端编造敏感内容。
- 文档详情、删除、重新切片、向量化和独立 chunk CRUD 未提供；文档上传后的审核任务可真实展示。
- 图谱接口返回关系三元组，不提供独立节点 CRUD；前端从真实关系派生可视节点。
- 角色、权限、指标趋势、系统设置没有后端接口；页面必须显示“接口待接入”，写操作禁用。
- 导游释放接管、导游资料、案例 CRUD 没有接口；页面显示待接入。

## 4. 完整路由树

```text
/
  redirect -> /intro/overview

/intro
  /intro/overview
  /intro/architecture
  /intro/features
  /intro/scenarios
  /intro/roadmap

/tourist
  /tourist/home
  /tourist/chat
  /tourist/voice
  /tourist/image
  /tourist/routes
  /tourist/culture-tips
  /tourist/history

/guide
  /guide/dashboard
  /guide/sessions
  /guide/sessions/:id
  /guide/takeover
  /guide/corrections
  /guide/cases
  /guide/profile

/knowledge
  /knowledge/documents
  /knowledge/chunks
  /knowledge/graph
  /knowledge/review
  /knowledge/terms
  /knowledge/rag-test
  /knowledge/statistics

/system
  /system/dashboard
  /system/users
  /system/roles
  /system/permissions
  /system/health
  /system/logs
  /system/metrics
  /system/settings
```

## 5. 页面实施矩阵

状态说明：`未开始`、`进行中`、`已完成`、`接口待接入`、`需要复查`。

| 页面 | 设计章节 | 参考类型 | 真实接口映射 | 接口差异 | 主要图片位 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `/intro/overview` | 5.1 | 文旅 Hero | `GET /api/knowledge/stats` | 部分统计待接入 | 首页 Hero、技术壁垒背景 | 已完成 |
| `/intro/architecture` | 5.2 | 文旅 + 科技流程 | `GET /api/architecture/audit`、`GET /api/health` | 可完整适配 | 架构 Banner、流程背景 | 已完成 |
| `/intro/features` | 5.3 | 文旅卡片 | 展示型，入口链接 | 无需伪造接口 | 功能概念图 | 已完成 |
| `/intro/scenarios` | 5.4 | 文旅时间线 | 展示型，入口链接 | 无需伪造接口 | 场景图 | 已完成 |
| `/intro/roadmap` | 5.5 | 文旅时间线 | 展示型 | 无任务状态接口 | 路线背景 | 已完成 |
| `/tourist/home` | 6.1 | 文旅 H5 入口 | `GET /api/content/guide`、`GET /api/content/routes`、`GET /api/sessions` | 位置、偏好待接入 | 景区 Banner、推荐卡片 | 已完成 |
| `/tourist/chat` | 6.2 | 文旅玻璃聊天 | `POST /api/sessions`、`POST /api/chat`、`POST /api/chat/stream` | 无历史详情接口 | 聊天背景 | 已完成 |
| `/tourist/voice` | 6.3 | 文旅语音交互 | `POST /api/audio/transcribe`、`POST /api/audio/ask`、`POST /api/tts/synthesize` | 浏览器内录音交互待接入 | 语音导览图 | 需要复查 |
| `/tourist/image` | 6.4 | 文旅上传交互 | `POST /api/image/ask` | OCR/实体为识别摘要 | 识别场景、建筑细节 | 已完成 |
| `/tourist/routes` | 6.5 | 文旅路线卡片 | `GET /api/content/routes`、`POST /api/route/recommend` | 可适配 | 路线卡片图 | 已完成 |
| `/tourist/culture-tips` | 6.6 | 文旅提醒卡片 | 无 | 专用接口待接入 | 礼仪、美食图 | 接口待接入 |
| `/tourist/history` | 6.7 | 文旅历史列表 | `GET /api/sessions`、`GET/POST /api/feedback` | 收藏接口待接入 | 无 | 已完成 |
| `/guide/dashboard` | 7.1 | 文旅工作台 | `GET /api/collaboration/sessions`、`GET /api/collaboration/corrections` | 告警接口待接入 | 工作台 Banner | 已完成 |
| `/guide/sessions` | 7.2 | 文旅工作台 | `GET /api/collaboration/sessions` | 可适配 | 会话背景 | 已完成 |
| `/guide/sessions/:id` | 7.3 | 文旅工作台 | `GET /api/collaboration/sessions`、`POST /api/sessions/:id/takeover`、`POST /api/sessions/:id/guide-reply` | 释放接口待接入 | 无 | 已完成 |
| `/guide/takeover` | 7.4 | 文旅工作台 | `GET /api/collaboration/sessions`、`POST /api/sessions/:id/takeover`、`POST /api/sessions/:id/guide-reply` | 日志、释放待接入 | 接管场景图 | 已完成 |
| `/guide/corrections` | 7.5 | 文旅工作台 | `GET /api/collaboration/corrections`、`POST /api/guide/questions/review`、`POST /api/collaboration/correction` | 编辑接口待接入 | 修正概念图 | 已完成 |
| `/guide/cases` | 7.6 | 文旅案例库 | `GET /api/collaboration/cases` | CRUD 待接入 | 案例图 | 已完成 |
| `/guide/profile` | 7.7 | 文旅资料页 | 无 | 全部待接入 | 导游贡献背景 | 接口待接入 |
| `/knowledge/documents` | 8.1 | 科技后台 | `GET/POST /api/knowledge/documents` | 删除、重切片、向量化待接入 | 科技纹理 | 已完成 |
| `/knowledge/chunks` | 8.2 | 科技后台 | `GET /api/review/tasks` | 独立 chunk CRUD 待接入 | 无 | 已完成 |
| `/knowledge/graph` | 8.3 | 图谱工作台 | `GET/POST /api/graph`、`PUT/DELETE /api/graph/:id`、`POST /api/graph/query` | 节点从关系派生 | 图谱纹理 | 已完成 |
| `/knowledge/review` | 8.4 | 科技后台 | `GET /api/review/tasks`、`POST /api/review/tasks/:id/decision` | 详情用列表项 | 无 | 已完成 |
| `/knowledge/terms` | 8.5 | 科技后台 | `GET/POST /api/terms`、`PUT/DELETE /api/terms/:id` | 导入、检查待接入 | 无 | 已完成 |
| `/knowledge/rag-test` | 8.6 | 科技后台 | `POST /api/knowledge/search`、`POST /api/chat`、`POST /api/graph/query` | 可适配 | 检索链路背景 | 已完成 |
| `/knowledge/statistics` | 8.7 | 科技后台 | `GET /api/knowledge/stats` | 趋势与覆盖率待接入 | 无 | 已完成 |
| `/system/dashboard` | 9.1 | 科技后台 | `GET /api/health`、`GET /api/knowledge/stats`、`GET /api/logs/model-calls` | 告警接口待接入 | 运维背景 | 已完成 |
| `/system/users` | 9.2 | 科技后台 | `GET/POST /api/users`、`PUT /api/users/:id/status` | 删除、编辑资料待接入 | 无 | 已完成 |
| `/system/roles` | 9.3 | 科技后台 | 无 | 全部待接入 | 无 | 接口待接入 |
| `/system/permissions` | 9.4 | 科技后台 | 无 | 全部待接入 | 无 | 接口待接入 |
| `/system/health` | 9.5 | 科技后台 | `GET /api/health` | 可完整适配 | 服务健康背景 | 已完成 |
| `/system/logs` | 9.6 | 科技后台 | `GET /api/logs/model-calls`、`GET /api/logs/request-traces` | 页面兼容旧运行实例缺少请求链路接口的情况 | 日志背景 | 已完成 |
| `/system/metrics` | 9.7 | 科技后台 | 无 | 趋势接口待接入 | 无 | 接口待接入 |
| `/system/settings` | 9.8 | 科技后台 | 无 | 全部待接入，只读展示环境说明 | 无 | 接口待接入 |

## 6. 分阶段计划

| 阶段 | 范围 | 状态 | 完成证据 |
| --- | --- | --- | --- |
| 第一阶段：工程基础 | React Router、Root/Tourism/Admin Layout、集中导航、API Client、认证框架、状态组件、两份计划文档 | 已完成 | `npm run build` 已通过；全部设计路由已进入集中路由树 |
| 第二阶段：核心展示与游客功能 | `/intro/overview`、`/tourist/home`、`/tourist/chat`、`/tourist/voice`、`/tourist/image` | 需要复查 | 构建通过；首页、问答、图片、TTS 已真实联调；语音问答仍需有效音频样本复查 |
| 第三阶段：知识库核心 | documents、chunks、graph、review、terms、rag-test、statistics | 已完成 | 构建通过；真实 API 读取通过；浏览器确认真实图谱画布 |
| 第四阶段：导游端 | dashboard、sessions、session detail、takeover、corrections、cases、profile | 已完成 | 会话读取、接管、真人回复真实联调通过；资料页明确待接入 |
| 第五阶段：系统管理 | dashboard、users、roles、permissions、health、logs、metrics、settings | 已完成 | 可用接口已接入；角色、权限、指标、设置明确标注待接入 |
| 第六阶段：统一打磨 | 补齐介绍页、游客完整业务页、响应式、README、image prompts、验证 | 已完成 | build、pytest、浏览器检查、路由审计与文档审计通过 |

## 7. 当前阻塞与处理方式

- 参考站点可能存在加载较慢或地区网络差异。处理方式：只提炼可验证的公开视觉方向，并以 `docs/references.md` 指定分类为准，不依赖远程资源运行前端。
- 后端基础设施依赖 Docker、MySQL、Redis、MinIO、Neo4j、Ollama。前端构建不受影响；真实运行联调阶段按根目录启动脚本验证。
- 多个设计建议接口尚未实现。处理方式：优先适配现有真实接口；无法适配的页面展示“接口待接入”，按钮禁用并说明原因。

## 8. 下一步

1. 进入第二阶段核心展示与游客功能。
2. 完成 `/tourist/home`、`/tourist/chat`、`/tourist/voice`、`/tourist/image` 的真实接口联调。
3. 同步创建并维护 `docs/image-prompts.md`。

## 9. 阶段验证记录

### 第一阶段：工程基础

- 2026-06-02：新增 React Router 嵌套路由、`RootLayout`、`TourismLayout`、`AdminLayout`、集中式一级/二级导航。
- 2026-06-02：新增统一 API Client，集中处理 `VITE_API_BASE_URL`、Bearer Token、JSON 请求、文件上传、流式响应、网络错误和 HTTP 错误。
- 2026-06-02：新增 `auth`、`tourist`、`guide`、`knowledge`、`graph`、`system`、`upload` API 模块。
- 2026-06-02：新增 loading、empty、error、api pending 和状态标签组件。
- 2026-06-02：`npm run build` 通过。项目当前没有独立 `typecheck` 或 `lint` script，构建命令已包含 `tsc -b`。

### 第二阶段：核心展示与游客功能

- 2026-06-02：完成 `/intro/overview`，真实读取 `GET /api/knowledge/stats`，未覆盖统计显示“接口待接入”。
- 2026-06-02：完成 `/tourist/home`，真实读取 17 个景点、16 个常见问题和游客会话。
- 2026-06-02：完成 `/tourist/chat` 浏览器联调。使用未知问题验证后端拒答路径，页面展示“暂无可靠资料”、可靠性阈值、来源数量和图谱关系数量。
- 2026-06-02：完成 `/tourist/image` 接口联调。`POST /api/image/ask` 返回成功；当视觉摘要为空时页面明确提示，不伪造摘要。
- 2026-06-02：完成 `/tourist/voice` 上传链路与 TTS 接入。`POST /api/tts/synthesize` 已验证成功；`POST /api/audio/ask` 仍需有效音频文件复查。
- 2026-06-02：创建 `docs/image-prompts.md`，当前包含 43 条可直接用于后续生成的图片 Prompt。
- 2026-06-02：发现后端 `POST /api/knowledge/search` 对“大理”短查询返回空结果。前端保持真实空状态，后续知识库阶段继续复查后端检索表现。
- 2026-06-02：`npm run build` 再次通过。

### 第三阶段：知识库核心

- 2026-06-02：完成文档上传、审核任务切片查看、审核工作台、术语维护、RAG 测试和真实统计页面。
- 2026-06-02：图谱页使用 `GET /api/graph` 的真实三元组生成节点和边；使用确定性前端布局，不使用随机 mock 或静态图冒充图谱。
- 2026-06-02：后端接口检查通过：图谱关系 210 条、术语 6 条、知识条目 63 条。
- 2026-06-02：`POST /api/auth/login` 管理员登录验证通过，可签发 Bearer Token。
- 2026-06-02：`npm run build` 通过。
- 2026-06-02：浏览器复查 `/knowledge/graph` 成功，页面渲染 1 个 SVG、34 个真实节点和 26 条可见边。

### 第四阶段：导游端

- 2026-06-02：完成导游工作台、会话列表、会话详情、人工接管、回答修正、案例库和个人中心页面。
- 2026-06-02：真实读取导游协同数据：当前会话 9 条、案例 16 条、修正记录 0 条。
- 2026-06-02：创建前端验收会话并真实调用接管与真人回复接口，返回 `taken_over` 和 `human-guide`。
- 2026-06-02：导游个人资料接口缺失，页面明确显示“接口待接入”，没有使用 mock。
- 2026-06-02：`npm run build` 通过。

### 第五阶段：系统管理与补齐业务页

- 2026-06-02：完成系统总览、用户管理、健康监控和日志页，接入真实健康、用户、知识统计和模型日志接口。
- 2026-06-02：角色、权限、指标趋势和系统设置没有真实后端接口，页面保留产品结构并明确显示“接口待接入”。
- 2026-06-02：旧运行实例曾对 `GET /api/logs/request-traces` 返回 404。日志页保留兼容降级；新进程上下文验证该路由返回 200 和 4 条记录。
- 2026-06-02：补齐介绍模块架构、功能、场景和路线图页面；补齐游客路线、文化提醒和历史页面。
- 2026-06-02：文化提醒没有专用接口，为避免硬编码敏感民族或宗教内容，页面明确标注待接入。
- 2026-06-02：`npm run build` 通过。

### 第六阶段：统一打磨与验证

- 2026-06-02：删除未使用的早期 `frontend/src/lib/api.ts` 与 `PageScaffold.tsx`，确保页面请求统一经过 `src/api/client.ts`。
- 2026-06-02：浏览器检查 `/intro/overview`、`/tourist/home`、`/tourist/chat`、`/knowledge/documents`、`/knowledge/graph`、`/system/health`。
- 2026-06-02：系统健康页浏览器确认渲染 13 个真实服务状态卡片。
- 2026-06-02：路由配置审计确认 34 个设计子页面全部存在。
- 2026-06-02：`docs/image-prompts.md` 审计确认 43 条 Prompt。
- 2026-06-02：修复后端无效音频上传未转换为 HTTP 错误的问题；`backend/.venv/Scripts/python -m pytest` 通过，结果为 `9 passed`。
- 2026-06-02：`npm run build` 通过，项目没有独立 `lint` script。

## 10. 最终复查项

- 有效音频文件的完整 ASR 问答仍建议在演示设备上做一次人工录音复查。
- 重启一键启动脚本后，旧 Uvicorn 进程会加载最新的 ASR 错误处理与请求链路日志路由。

## 11. 缺失接口补齐与前端升级

- 游客端：新增今日统计、首页聚合、文化提示、收藏、语言偏好和主动人工接管接口。
- 导游端：新增释放接管、接管日志、导游资料与贡献统计、修正编辑和案例 CRUD。
- 知识工程：文档上传形成真实文档与切片实体；新增删除、重新切片、向量化、切片 CRUD、术语导入检查和知识统计。
- 系统管理：新增用户编辑删除、角色权限、运行指标、系统设置和告警接口。
- 浏览器语音：新增 `MediaRecorder` 浏览器内录音上传链路。
- 指标加载：项目总览、游客首页、知识统计、系统总览、健康监控和系统指标页增加错误态与重试，不再无限转圈。

### 验证记录

- `backend/.venv/Scripts/python -m pytest -q`：`11 passed`。
- `frontend npm run build`：通过。
- 标准端口 `8000` 已重启；指标接口均返回 `200`。
- 浏览器复查 `http://127.0.0.1:5173`：关键指标页均退出加载态并显示真实数据。
