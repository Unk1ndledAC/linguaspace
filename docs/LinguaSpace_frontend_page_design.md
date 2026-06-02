# 语界 LinguaSpace 前端多端多页面设计说明书

> 用途：本文件用于指导 Codex / 前端开发者分阶段构建“语界 LinguaSpace”真实可用前端系统。  
> 重点：不要把系统做成 5 个单页，而是做成 5 个一级模块 + 多个子页面的真实 Web App。  
> 原则：前台文旅沉浸式，后台科技工程化；业务数据优先接真实后端接口；图片资源通过后续生成，不联网找版权图。

---

## 0. 设计总目标

语界 LinguaSpace 前端不是普通旅游官网，也不是普通后台模板，而是一个面向比赛答辩、真实联调和后续产品化的综合系统。

整体目标：

1. **项目介绍模块**：用于比赛展示，强调项目价值、技术路线、应用场景和建设路线。
2. **游客端模块**：模拟外国游客在云南旅游时使用多语 AI 导览助手。
3. **导游端模块**：体现真人导游与 AI 协同服务游客、修正 AI 回答、回流优质知识。
4. **知识库维护模块**：体现 RAG 文旅知识库、文化知识图谱、审核、术语表、检索测试等技术核心。
5. **系统管理模块**：体现用户权限、服务健康、模型调用日志、指标监控和系统配置。

视觉原则：

- `/intro`、`/tourist`、`/guide`：沉浸式文旅风格。
- `/knowledge`、`/system`：简洁科技风格。
- 所有页面都要适合比赛现场演示、录屏展示和真实后端联调。
- 所有新增、编辑、删除、审核、上传、接管、回复等操作，优先接真实后端接口。
- 后端缺失接口时，页面显示“接口待接入”或禁用按钮，并在 README 中列出缺失接口清单。

---

## 1. 信息架构与路由设计

### 1.1 一级模块

| 一级模块 | 路由前缀 | 视觉风格 | 主要用户 | 核心目标 |
|---|---|---|---|---|
| 项目介绍 | `/intro` | 文旅沉浸式 | 评委、观众、投资人 | 展示项目定位、架构、能力、场景与路线 |
| 游客端 | `/tourist` | 文旅沉浸式 | 游客 | 多语问答、语音导览、拍照识别、路线推荐 |
| 导游端 | `/guide` | 文旅工作台 | 真人导游、专家 | 会话监控、人工接管、回答修正、案例回流 |
| 知识库维护 | `/knowledge` | 简洁科技风 | 管理员、专家 | RAG、图谱、审核、术语、检索测试 |
| 系统管理 | `/system` | 简洁科技风 | 管理员、运维 | 用户权限、服务健康、日志、指标、配置 |

### 1.2 完整路由表

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

---

## 2. 全局布局设计

### 2.1 RootLayout

适用：整个应用。

职责：

- 提供全局路由出口。
- 提供全局 Toast / Message / Modal 容器。
- 提供 QueryClientProvider。
- 提供 AuthProvider。
- 提供全局错误边界。
- 根据当前路由切换 TourismLayout 或 AdminLayout。

组件建议：

```text
src/layouts/RootLayout.tsx
src/layouts/TourismLayout.tsx
src/layouts/AdminLayout.tsx
src/layouts/ModuleLayout.tsx
src/components/navigation/PrimaryNav.tsx
src/components/navigation/SecondaryNav.tsx
src/components/navigation/Breadcrumbs.tsx
src/components/navigation/RoleSwitcher.tsx
```

### 2.2 TourismLayout

适用：`/intro`、`/tourist`、`/guide`。

视觉特点：

- 顶部横向主导航。
- 当前模块的二级导航可以是顶部二级 Tab 或半透明悬浮导航。
- 背景可以使用柔和山水渐变、民族纹样淡纹、页面顶部大图。
- 卡片可使用玻璃拟态、半透明背景、柔和阴影。
- 页面要有旅行杂志感和呼吸感。

结构建议：

```text
顶部主导航
  Logo / 项目名
  一级模块入口
  当前用户 / 角色切换 / 登录状态

当前模块二级导航
  如：游客首页、多语问答、语音导览、拍照识别...

页面内容区
  可使用大图 Banner
  可使用 12 栅格布局
  卡片与图文模块交错展示
```

### 2.3 AdminLayout

适用：`/knowledge`、`/system`。

视觉特点：

- 左侧 Sidebar。
- 顶部状态栏。
- 右侧主内容区。
- 信息密度高，但留足间距。
- 表格、图表、状态卡片、筛选器统一风格。
- 不使用大面积风景图。
- 色彩克制，偏深墨色、青绿色、灰白、少量暖金强调。

结构建议：

```text
左侧 Sidebar
  一级模块标题
  当前模块子页面菜单

顶部状态栏
  面包屑
  搜索
  后端连接状态
  用户信息

主内容区
  页面标题
  操作按钮
  筛选工具条
  数据区
```

---

## 3. 全局视觉规范

### 3.1 文旅风格视觉规范

适用页面：项目介绍、游客端、导游端。

关键词：

```text
immersive tourism website
travel magazine layout
large scenic hero image
Yunnan cultural tourism
ancient town architecture
misty mountains
ethnic cultural patterns
glassmorphism overlay
warm teal and soft gold
cinematic, premium, elegant
```

建议配色：

| 用途 | 颜色建议 |
|---|---|
| 主色 | 孔雀蓝 / 青绿色 |
| 强调色 | 暖金色 |
| 背景色 | 米白、浅雾绿、深墨蓝 |
| 卡片 | 半透明白 / 半透明深色 |
| 标签 | 青绿色、金色、浅蓝、浅红 |

交互效果：

- Banner 淡入。
- 卡片 hover 上浮。
- 处理链路状态逐步点亮。
- 聊天消息轻微滑入。
- 图片卡片 hover 放大 1.02 倍。
- 不要使用过于花哨或廉价的动画。

### 3.2 科技风视觉规范

适用页面：知识库维护、系统管理。

关键词：

```text
clean AI dashboard
enterprise admin UI
knowledge engineering platform
system observability dashboard
graph management interface
minimal, structured, professional
```

建议配色：

| 用途 | 颜色建议 |
|---|---|
| 主色 | 深墨色、青绿色 |
| 背景 | #F7FAFA / #0F172A 暗色可选 |
| 卡片 | 白色或深色面板 |
| 分割线 | 低饱和灰 |
| 状态正常 | 绿色 |
| 状态告警 | 橙色 |
| 状态异常 | 红色 |
| 信息强调 | 蓝色 / 青色 |

页面特点：

- 表格要清晰。
- 操作按钮要收敛。
- 数据卡片要强调数值。
- 图表不宜过多装饰。
- 图谱区域要专业，避免用静态图片冒充。

---

## 4. API 接入总原则

前端必须真实接入后端。页面中不允许硬编码业务结果来假装接口成功。

### 4.1 API Client

文件建议：

```text
src/api/client.ts
src/api/auth.ts
src/api/tourist.ts
src/api/guide.ts
src/api/knowledge.ts
src/api/graph.ts
src/api/system.ts
src/api/upload.ts
src/api/types.ts
```

要求：

1. 使用 `VITE_API_BASE_URL` 配置后端地址。
2. 使用 axios 或 fetch 封装统一请求。
3. 统一处理 token、401、403、500、网络异常。
4. 文件上传统一处理 `multipart/form-data`。
5. 所有 API 返回类型尽量来自 OpenAPI / 后端 schema。
6. 页面组件不直接写散落请求。
7. 后端缺少接口时不要假造，创建 `TODO_BACKEND.md` 或在 README 中列出。

### 4.2 状态处理

每个真实请求页面都必须有：

- Loading 状态。
- Empty 状态。
- Error 状态。
- Retry 操作。
- 权限不足状态。
- 接口待接入状态。

### 4.3 交互反馈

所有写操作必须有明确反馈：

- 新增成功。
- 编辑成功。
- 删除确认。
- 审核通过。
- 审核驳回。
- 上传进度。
- 接管成功。
- 回复发送成功。
- 请求失败原因。

---

# 5. 项目介绍模块 `/intro`

项目介绍模块用于比赛答辩展示，整体采用文旅沉浸式风格。

---

## 5.1 `/intro/overview` 项目总览页

### 页面目标

让评委一眼看懂：

- 项目是什么。
- 服务谁。
- 技术亮点是什么。
- 为什么不是普通旅游网站或 ChatGPT 套壳。
- 可以进入游客端、导游端、知识库后台继续演示。

### 视觉风格

- 大幅 Hero 主视觉。
- 山水、古城、AI 光网、多语界面浮层。
- 半透明玻璃卡片。
- 大标题 + 副标题 + CTA。
- 下方为核心能力卡片和数据统计。

### 页面结构

```text
Hero 区
  左侧：项目名称、定位、CTA
  右侧：AI 文旅主视觉图 / 浮动能力卡片

数据概览区
  知识文档数 / 图谱实体数 / 今日问答数 / 支持语种数

核心能力区
  多语交互 / 拍照识别 / RAG / 图谱 / 导游协同 / 实训

技术壁垒区
  可信 RAG / 多语术语表 / 人工审核 / 全链路追踪

入口区
  进入游客端 / 进入导游端 / 进入知识库维护
```

### 组件建议

```text
TourismHero
TravelFeatureCard
GlassPanel
StatCard
TechBarrierCard
ScenicImagePlaceholder
```

### 数据来源

优先接入后端统计接口：

```text
GET /stats/overview
GET /api/stats/overview
```

若后端没有统计接口：

- 数值区域展示“统计接口待接入”。
- README 记录建议新增统计接口。

### 图片位

| 图片位 | 比例 | 用途 |
|---|---|---|
| 首页 Hero 主视觉 | 21:9 | 首屏大图 |
| 云南古城 + AI 光网 | 16:9 | 右侧或背景 |
| 民族纹样淡纹 | 16:9 | 分区背景 |
| 技术壁垒背景 | 16:9 | 科技与文旅融合 |

### 验收标准

- 首屏视觉冲击力强。
- CTA 明确。
- 三秒内能看懂系统定位。
- 能跳转到其他模块。
- 统计数据真实来自后端或明确标注接口待接入。

---

## 5.2 `/intro/architecture` 技术架构页

### 页面目标

展示系统不是简单调用大模型，而是包含多模态输入、AI 编排、RAG、知识图谱、审核回流和运维监控的完整架构。

### 页面结构

```text
页面头部 Banner
  标题：可信多语文旅 AI 系统架构
  简介：从游客输入到知识增强再到多语输出

系统分层架构
  客户端层
  业务服务层
  AI 能力层
  知识增强层
  数据与运维层

调用链路可视化
  语音 / 文字 / 图片 / 位置
      ↓
  ASR / 翻译 / 图像理解 / LLM
      ↓
  RAG / 图谱
      ↓
  多语输出 / TTS / 人工审核

数据闭环
  游客反馈 → 导游修正 → 专家审核 → 知识库更新
```

### 视觉风格

- 文旅背景 + 科技流程图。
- 使用半透明流程节点。
- 可用横向步骤条、卡片网格、连接线。
- 不要做成普通 PPT 截图，要做成网页可滚动展示。

### API 数据

该页面可主要为展示型。若后端有服务列表或模型列表，可显示真实模型服务状态。

### 图片位

| 图片位 | 比例 | 用途 |
|---|---|---|
| 架构页背景图 | 21:9 | 页面顶部 |
| AI 流程抽象图 | 16:9 | 调用链路区 |
| 数据闭环图背景 | 16:9 | 审核回流区 |

### 验收标准

- 架构层次清晰。
- 技术链路可读。
- 能体现 RAG 与图谱是核心，不是装饰。

---

## 5.3 `/intro/features` 核心功能页

### 页面目标

展示系统核心功能矩阵，让评委理解功能完整性。

### 页面结构

```text
功能总览 Banner

功能卡片网格
  多语问答
  语音导览
  拍照识别
  路线推荐
  文化提醒
  真人导游协同
  AI 导游实训
  知识库维护
  图谱管理
  系统监控

重点功能详情
  每个功能：
    场景说明
    技术支撑
    对应入口
    演示按钮
```

### 组件建议

```text
TravelFeatureCard
FeatureDetailPanel
ScenarioCard
ModuleEntryButton
```

### 交互

- 点击功能卡片，高亮右侧详情。
- 点击“去体验”跳转到对应子页面。
- 移动端改为纵向卡片。

### 图片位

- 多语导览概念图。
- 拍照识别概念图。
- 导游协同概念图。
- 知识图谱概念图。

---

## 5.4 `/intro/scenarios` 应用场景页

### 页面目标

按实际用户场景讲清楚系统价值。

### 场景列表

1. 外国游客到达景区后进行多语提问。
2. 游客拍摄建筑、菜单、路牌后获得识别与讲解。
3. 导游发现 AI 回答低置信后接管。
4. 专家审核导游修正内容并回流知识库。
5. 高校学生进行 AI 导游实训。
6. 管理员查看系统服务健康和模型调用日志。

### 页面结构

```text
沉浸式场景 Banner
场景时间线
场景卡片
场景详情
相关功能入口
```

### 交互

- 场景卡片点击后切换详情。
- 每个场景提供“进入演示页面”按钮。
- 如果真实接口未接入，对应按钮显示“接口待接入”。

### 图片位

- 外国游客使用手机导览图。
- 真人导游服务场景图。
- 导游实训课堂图。
- 文化知识资产沉淀概念图。

---

## 5.5 `/intro/roadmap` 建设路线页

### 页面目标

展示系统开发阶段和未来计划，让项目显得可落地、有路线。

### 页面结构

```text
建设路线 Hero

路线时间轴
  第一阶段：文本版 RAG 导览
  第二阶段：语音与翻译
  第三阶段：图片识别
  第四阶段：文化知识图谱
  第五阶段：AI 导游实训
  第六阶段：真人导游协同

当前完成度
  已完成 / 进行中 / 待建设

下一步计划
  多语评测集
  图谱扩展
  实时动态信息
  移动端适配
```

### 视觉风格

- 文旅风 + 产品路线图。
- 用横向时间线或纵向里程碑。
- 每个阶段可以配小图标或卡片背景。

### API 数据

若后端提供版本或任务状态，可展示真实完成度；否则为静态说明。

---

# 6. 游客端模块 `/tourist`

游客端是最重要的体验端，要体现“游客正在云南旅行中使用 AI 导览助手”。

---

## 6.1 `/tourist/home` 游客首页

### 页面目标

游客进入后能快速选择语言、看到当前位置、进入问答/语音/拍照/路线/文化提醒。

### 视觉风格

- 顶部景区 Banner。
- 大图背景 + 半透明卡片。
- 旅游感强，操作入口清晰。
- 更像移动导览服务的 Web/H5 入口。

### 页面结构

```text
景区 Banner
  当前景区名称
  天气/位置/语言选择
  快捷操作按钮

快捷入口区
  多语问答
  语音导览
  拍照识别
  路线推荐
  文化提醒

今日推荐
  景点卡片
  非遗体验卡片
  美食卡片

热门问题
  游客常问问题列表

最近会话
  最近一条问答 / 最近识别记录
```

### API 数据

可能接口：

```text
GET /tourist/profile
GET /tourist/location
GET /tourist/recommendations
GET /tourist/hot-questions
GET /tourist/sessions/recent
```

若无接口：

- 快捷入口可正常跳转。
- 推荐内容显示“接口待接入”或来自后端已有景点接口。
- 不要硬编码为真实后端数据。

### 交互

- 语言选择后写入用户偏好。
- 快捷入口跳转对应页面。
- 热门问题点击后进入 `/tourist/chat` 并预填问题。

### 图片位

- 游客端顶部景区 Banner。
- 推荐路线卡片图。
- 美食文化卡片图。
- 民族文化卡片图。

---

## 6.2 `/tourist/chat` 多语问答页

### 页面目标

实现真实多语文本问答，展示 RAG 来源、图谱增强、置信度和人工接管入口。

### 视觉风格

- 文旅背景 + 中心聊天窗口。
- 聊天面板可为半透明玻璃卡片。
- 来源引用区域要专业清晰。
- 不要像普通客服聊天窗口太廉价。

### 页面结构

```text
顶部区域
  当前语言
  当前地点
  会话状态
  创建/切换会话

主体区域
  左侧：问题建议 / 热门问题 / 文化提醒
  中间：聊天窗口
  右侧：回答来源 / RAG 命中 / 图谱关系 / 置信度

底部输入区
  文本输入框
  发送按钮
  人工接管按钮
```

### 必须展示的回答信息

如果后端返回，尽量展示：

- AI 回答正文。
- 用户原始问题。
- 标准化问题。
- 目标语言。
- 来源文档。
- 命中 chunk。
- 相似度分数。
- rerank 分数。
- 图谱补充关系。
- 置信度。
- 是否触发审核。
- request_id。

### API 数据

可能接口：

```text
POST /tourist/sessions
GET /tourist/sessions/:id/messages
POST /tourist/chat
POST /tourist/handoff
```

以真实后端为准。

### 交互

- 进入页面自动创建或恢复会话。
- 发送问题后显示 loading。
- Loading 期间展示链路状态：
  `翻译中 → 检索中 → 图谱增强 → 生成回答 → 翻译回目标语言`
- 请求成功后消息追加到聊天区。
- 请求失败展示错误和重试。
- 低置信回答显示“建议人工导游接管”。
- 点击来源展开详情抽屉。

### Empty / Error

- 空会话：显示示例问题。
- 无可靠资料：显示后端返回的拒答文案。
- 接口失败：显示失败原因，不要伪造回答。

---

## 6.3 `/tourist/voice` 语音导览页

### 页面目标

实现录音/上传音频、ASR 识别、翻译、RAG 问答、TTS 播放的真实链路。

### 视觉风格

- 顶部为语音导览场景图。
- 中心使用大号录音按钮。
- 右侧/下方显示处理链路状态。
- 结果区以讲解卡片形式呈现。

### 页面结构

```text
页面头部
  标题：语音导览
  当前语言
  当前地点

录音区
  录音按钮
  上传音频
  录音时长
  音频波形占位

处理链路区
  录音完成
  ASR 转写
  翻译标准问题
  RAG 检索
  图谱增强
  生成回答
  TTS 合成

结果区
  ASR 文本
  翻译文本
  AI 回答
  来源引用
  TTS 播放器
```

### API 数据

可能接口：

```text
POST /tourist/voice/asr
POST /tourist/voice/chat
POST /tourist/tts
```

或后端提供统一语音问答接口：

```text
POST /tourist/voice
```

以前端扫描到的真实接口为准。

### 交互

- 浏览器录音权限提示。
- 录音中显示计时。
- 上传音频显示文件名和进度。
- ASR 结果可编辑后继续提问。
- TTS 返回音频 URL 时展示播放器。
- 后端不支持 TTS 时，结果区显示“语音播报接口待接入”。

### 验收标准

- 语音输入链路可真实调用。
- 识别结果和回答都来自后端。
- 链路状态清晰。
- 错误可定位到 ASR / 翻译 / RAG / TTS 阶段。

---

## 6.4 `/tourist/image` 拍照识别页

### 页面目标

实现图片上传、视觉识别、OCR、实体识别、基于知识库的文化讲解。

### 视觉风格

- 拍照识别场景图。
- 上传区要像移动端拍照入口。
- 识别结果卡片要有科技感，但整体仍是文旅风。

### 页面结构

```text
顶部 Banner
  拍照识别，发现文化故事

上传区
  拍照 / 上传图片
  图片预览
  上传进度

识别结果区
  场景类型
  可能实体
  OCR 文本
  位置提示
  置信度
  是否需要用户确认

文化讲解区
  基于识别结果的 RAG 回答
  来源引用
  图谱关系

确认区
  如果置信度低：
    “我可能识别到这是白族民居的照壁，请问是否正确？”
```

### API 数据

可能接口：

```text
POST /tourist/image/recognize
POST /tourist/image/question
POST /tourist/image
```

### 交互

- 上传后立即预览。
- 图片识别 loading。
- 如果识别置信度高，自动生成文化讲解。
- 如果识别置信度低，要求用户确认后再问答。
- 可输入“我想了解这张图中的文化含义”。

### 验收标准

- 图片上传真实可用。
- 识别结果来自后端。
- 不由视觉模型直接生成文化解释，文化解释应通过 RAG/知识库接口。
- 来源和置信度可见。

---

## 6.5 `/tourist/routes` 路线推荐页

### 页面目标

为游客提供不同主题路线推荐。

### 页面结构

```text
顶部景区横幅
筛选条件
  游览时长
  游客类型
  兴趣主题
  语言
路线卡片网格
  轻量路线
  亲子路线
  非遗体验路线
  美食路线
  摄影路线
路线详情抽屉
  路线节点
  预计耗时
  推荐原因
  注意事项
  文化讲解点
```

### API 数据

可能接口：

```text
GET /tourist/routes
GET /tourist/routes/:id
POST /tourist/routes/recommend
```

若后端无路线推荐接口：

- 该页面保留 UI。
- 显示“路线推荐接口待接入”。
- 不要伪造后端动态数据。

### 图片位

每类路线至少预留一张卡片图：

- 古城漫游。
- 非遗体验。
- 美食探索。
- 摄影路线。
- 亲子研学。

---

## 6.6 `/tourist/culture-tips` 文化提醒页

### 页面目标

提供民族礼仪、宗教场所礼仪、拍照禁忌、饮食禁忌、跨文化表达提醒。

### 页面结构

```text
文化提醒 Banner

分类筛选
  民族礼仪
  宗教礼仪
  拍照禁忌
  饮食禁忌
  跨文化表达
  景区规则

提醒卡片列表
  标题
  适用地点
  风险等级
  目标游客类型
  多语说明
  来源
```

### API 数据

可能接口：

```text
GET /tourist/culture-tips
GET /knowledge/tips
GET /graph/risks
```

### 交互

- 点击卡片查看详情。
- 按语言切换多语内容。
- 高风险提醒使用醒目标识。
- 来源可展开查看。

### 验收标准

- 内容优先来自后端知识库或图谱。
- 不要把敏感民族/宗教内容写死在前端。
- 高风险内容显示来源和审核状态。

---

## 6.7 `/tourist/history` 游客历史页

### 页面目标

展示游客历史会话、识别记录、收藏讲解、反馈记录。

### 页面结构

```text
历史记录总览
  会话数
  图片识别数
  收藏数
  反馈数

Tabs
  问答历史
  语音历史
  图片识别历史
  收藏讲解
  反馈记录

详情抽屉
  原问题
  AI 回答
  来源
  置信度
  反馈
```

### API 数据

可能接口：

```text
GET /tourist/history
GET /tourist/sessions
GET /tourist/favorites
GET /tourist/feedback
```

### 验收标准

- 历史数据真实来自后端。
- 支持搜索、筛选、查看详情。
- 支持再次提问或继续会话。

---

# 7. 导游端模块 `/guide`

导游端是文旅服务工作台。它应保留文旅气质，但比游客端更专业、信息密度更高。

---

## 7.1 `/guide/dashboard` 导游工作台

### 页面目标

让导游快速了解今日服务情况、待处理事项和风险会话。

### 页面结构

```text
轻量文旅 Banner
今日指标卡片
  服务游客数
  待接管会话
  低置信回答
  待审核修正
  热门问题数

风险提醒区
  高风险会话
  敏感问题
  翻译异常

当前会话概览
  正在 AI 服务
  需要导游接管
  导游接管中

快捷入口
  会话列表
  人工接管
  AI 回答修正
  案例库
```

### API 数据

可能接口：

```text
GET /guide/dashboard
GET /guide/sessions/summary
GET /guide/alerts
```

### 验收标准

- 能看到导游当前最重要待办。
- 指标来自真实后端。
- 风格是文旅服务工作台，不是纯 admin。

---

## 7.2 `/guide/sessions` 游客会话列表

### 页面目标

让导游查看所有游客会话并筛选需要接管的会话。

### 页面结构

```text
筛选工具栏
  语言
  景区
  风险等级
  会话状态
  是否需要接管

会话表格/卡片列表
  游客编号
  语言
  位置
  最近问题
  最近时间
  风险等级
  状态
  操作

右侧预览
  选中会话摘要
```

### API 数据

```text
GET /guide/sessions
```

### 交互

- 点击行进入 `/guide/sessions/:id`。
- 高风险会话置顶或高亮。
- 支持搜索和分页。
- 支持“只看待接管”。

---

## 7.3 `/guide/sessions/:id` 会话详情页

### 页面目标

展示某个游客会话的完整上下文、AI 回答依据和导游操作。

### 页面结构

```text
顶部会话信息
  游客语言
  位置
  当前状态
  风险等级
  接管按钮

左侧聊天记录
  游客消息
  AI 回复
  导游回复

右侧证据面板
  RAG 命中 chunk
  图谱关系
  置信度
  敏感内容
  request_id

底部操作区
  导游回复
  修正 AI 回答
  标记为案例
```

### API 数据

```text
GET /guide/sessions/:id
POST /guide/sessions/:id/takeover
POST /guide/sessions/:id/reply
POST /guide/sessions/:id/release
```

### 验收标准

- 会话详情真实可查。
- AI 来源证据清晰。
- 接管和回复真实调用后端。
- 低置信/敏感内容明显提示。

---

## 7.4 `/guide/takeover` 人工接管页

### 页面目标

集中管理导游正在接管或待接管的会话。

### 页面结构

```text
接管队列
  待接管
  已接管
  已释放

实时回复区
  当前会话
  常用回复模板
  输入框
  发送按钮
  释放接管按钮

接管记录
  开始时间
  结束时间
  导游
  原因
```

### API 数据

```text
GET /guide/takeover/sessions
POST /guide/sessions/:id/takeover
POST /guide/sessions/:id/reply
POST /guide/sessions/:id/release
GET /guide/takeover/logs
```

### 交互

- 接管后状态立即刷新。
- 多导游冲突时显示后端错误。
- 释放接管需确认。

---

## 7.5 `/guide/corrections` AI 回答修正页

### 页面目标

导游修正 AI 错误回答，并提交专家审核池。

### 页面结构

```text
修正任务列表
  原问题
  原 AI 回答
  错误类型
  风险等级
  状态
  更新时间

修正编辑区
  原回答
  来源片段
  导游修正版本
  修正原因
  提交审核

审核状态
  待审核
  通过
  驳回
```

### API 数据

```text
GET /guide/corrections
POST /guide/corrections
PUT /guide/corrections/:id
```

### 验收标准

- 修正内容真实提交后端。
- 修正后进入审核池。
- 不直接写入正式知识库。

---

## 7.6 `/guide/cases` 讲解案例库

### 页面目标

展示优秀讲解案例和常见错误案例，支持回流教学或知识库。

### 页面结构

```text
案例筛选
  景区
  主题
  语种
  类型：优秀案例 / 错误案例

案例卡片
  标题
  讲解摘要
  适用场景
  语种
  审核状态
  操作

案例详情
  原始问题
  推荐讲解
  知识点
  易错点
  来源
```

### API 数据

```text
GET /guide/cases
POST /guide/cases
PUT /guide/cases/:id
```

### 交互

- 案例可标记为优秀。
- 错误案例可转为教学提醒。
- 通过审核后可回流知识库候选。

---

## 7.7 `/guide/profile` 导游个人中心

### 页面目标

展示导游个人服务情况和贡献。

### 页面结构

```text
个人信息
  姓名
  角色
  擅长语种
  擅长景区

服务统计
  服务游客数
  接管次数
  修正次数
  通过审核次数
  案例贡献数

贡献记录
  修正记录
  案例记录
  审核记录
```

### API 数据

```text
GET /guide/profile
GET /guide/profile/stats
GET /guide/profile/contributions
```

---

# 8. 知识库维护模块 `/knowledge`

知识库维护模块是技术核心。整体应是简洁科技风，体现知识工程平台。

---

## 8.1 `/knowledge/documents` 文档管理页

### 页面目标

管理知识库原始文档：上传、查看、切分、审核、向量化。

### 页面结构

```text
页面标题
  文档管理
  上传文档按钮

统计卡片
  文档总数
  已审核
  待处理
  向量化完成

筛选工具栏
  来源类型
  景区
  审核状态
  切分状态
  向量化状态
  搜索

文档表格
  文档名
  来源
  类型
  景区
  上传人
  审核状态
  切分状态
  向量化状态
  更新时间
  操作

详情抽屉
  文档信息
  原文预览
  切分记录
  处理日志
```

### API 数据

```text
GET /knowledge/documents
POST /knowledge/documents/upload
GET /knowledge/documents/:id
DELETE /knowledge/documents/:id
POST /knowledge/documents/:id/split
POST /knowledge/documents/:id/vectorize
```

### 交互

- 上传显示进度。
- 上传后自动刷新列表。
- 删除需二次确认。
- 切分/向量化可显示任务状态。
- 后端支持异步任务时轮询任务状态。

---

## 8.2 `/knowledge/chunks` 知识切片管理页

### 页面目标

管理 RAG 检索使用的知识 chunk。

### 页面结构

```text
统计卡片
  chunk 总数
  已审核
  敏感内容
  向量化失败

筛选工具栏
  景区
  城市
  主题
  内容类型
  审核状态
  敏感等级
  向量化状态

chunk 表格
  chunk_id
  标题/主题
  景区
  城市
  内容类型
  审核状态
  敏感等级
  向量化状态
  更新时间
  操作

右侧详情抽屉
  chunk 内容
  来源文档
  元数据
  向量化信息
  审核记录
```

### API 数据

```text
GET /knowledge/chunks
POST /knowledge/chunks
GET /knowledge/chunks/:id
PUT /knowledge/chunks/:id
DELETE /knowledge/chunks/:id
POST /knowledge/chunks/:id/review
POST /knowledge/chunks/:id/vectorize
```

### 交互

- 表格支持分页、搜索、排序。
- 新增/编辑使用 Drawer 或 Dialog。
- 审核操作需记录审核意见。
- 敏感等级高的内容使用醒目标识。

---

## 8.3 `/knowledge/graph` 文化知识图谱页

### 页面目标

可视化管理文化知识图谱节点和关系。

### 页面结构

```text
顶部工具栏
  搜索实体
  实体类型筛选
  关系类型筛选
  新增实体
  新增关系
  重新布局

左侧实体列表
  节点类型
  节点名称
  关联数量

中间图谱画布
  React Flow 图谱
  节点颜色按类型区分
  边标签显示关系类型

右侧详情抽屉
  节点属性
  关联关系
  编辑节点
  删除节点
  添加关系
```

### 节点类型

- 景点
- 城市
- 民族
- 节庆
- 非遗
- 建筑
- 饮食
- 禁忌
- 路线
- 游客类型

### 关系类型

- 位于
- 关联
- 拥有
- 适合讲解
- 存在禁忌
- 推荐路线
- 适合游客类型

### API 数据

```text
GET /graph/nodes
GET /graph/edges
GET /graph/search
POST /graph/nodes
PUT /graph/nodes/:id
DELETE /graph/nodes/:id
POST /graph/edges
DELETE /graph/edges/:id
```

### 交互

- 点击节点显示详情。
- 点击边显示关系详情。
- 新增关系时选择起点、关系类型、终点。
- 删除节点前提示关联关系影响。
- 图谱数据必须来自真实后端，不要静态假图。

### 验收标准

- 图谱能真实加载。
- 节点与边可交互。
- CRUD 真实调用后端。
- 图谱复杂时仍可操作。

---

## 8.4 `/knowledge/review` 审核工作台

### 页面目标

审核知识内容、导游修正、低置信 AI 回答和敏感内容。

### 页面结构

```text
审核统计
  待审核
  已通过
  已驳回
  高风险

Tabs
  待审核知识
  导游修正
  低置信回答
  敏感内容
  审核历史

任务列表
  类型
  标题
  来源
  风险等级
  提交人
  提交时间
  状态
  操作

审核详情
  原内容
  修改内容
  来源证据
  风险提示
  审核意见
  通过 / 驳回 / 编辑后通过
```

### API 数据

```text
GET /review/tasks
GET /review/tasks/:id
POST /review/tasks/:id/approve
POST /review/tasks/:id/reject
PUT /review/tasks/:id
GET /review/history
```

### 交互

- 通过/驳回必须输入或保存审核意见。
- 编辑后通过要保存修改版。
- 高风险内容二次确认。
- 操作成功后刷新任务列表。

---

## 8.5 `/knowledge/terms` 多语术语表页

### 页面目标

维护文旅专有名词在多语种中的统一翻译，避免小语种翻译不一致。

### 页面结构

```text
统计卡片
  术语总数
  强制替换数
  待校验数
  异常术语数

工具栏
  新增术语
  批量导入
  术语一致性校验
  语种筛选
  类型筛选

术语表格
  中文名
  英文
  泰语
  越南语
  印尼语
  别名
  类型
  是否强制替换
  更新时间
  操作

校验结果
  缺失语种
  翻译冲突
  别名冲突
```

### API 数据

```text
GET /terms
POST /terms
PUT /terms/:id
DELETE /terms/:id
POST /terms/check
POST /terms/import
```

### 交互

- 新增/编辑术语使用表单。
- 强制替换开关真实保存。
- 校验结果可跳转到对应术语。
- 批量导入支持文件上传时展示进度。

---

## 8.6 `/knowledge/rag-test` RAG 检索测试页

### 页面目标

让管理员/专家测试某个问题的检索链路，定位回答问题来自翻译、检索、图谱还是生成。

### 页面结构

```text
测试输入区
  问题输入
  语言选择
  景区/主题筛选
  是否启用图谱
  是否启用 rerank
  测试按钮

链路 Timeline
  语言识别
  问题标准化
  实体识别
  向量召回
  rerank
  图谱补充
  生成回答

结果区
  标准化问题
  命中实体
  召回 chunks
  rerank 分数
  图谱关系
  最终回答
  置信度
  总耗时
  request_id
```

### API 数据

```text
POST /rag/test
POST /rag/search
POST /rag/answer
```

以真实后端为准。若后端只有统一测试接口，前端按统一接口展示。

### 交互

- 测试按钮显示 loading。
- 每个阶段显示耗时。
- chunk 可展开查看内容。
- 图谱关系可跳转到图谱页。
- request_id 可跳转系统日志。

### 验收标准

- 能真实看到检索链路。
- 不是只显示最终回答。
- 对比赛答辩非常关键，应重点打磨。

---

## 8.7 `/knowledge/statistics` 知识统计页

### 页面目标

展示知识库质量和覆盖度。

### 页面结构

```text
概览指标
  文档数
  chunk 数
  图谱实体数
  图谱关系数
  审核通过率
  RAG 命中率

图表区
  各景区知识覆盖度
  内容类型分布
  审核状态分布
  敏感等级分布
  低置信问题分布
  术语覆盖情况

问题列表
  高频未命中问题
  低置信问题
  待补充知识点
```

### API 数据

```text
GET /knowledge/statistics
GET /knowledge/statistics/coverage
GET /knowledge/statistics/rag
```

### 验收标准

- 展现知识库是否“够用、可靠、可维护”。
- 图表真实来自后端统计。

---

# 9. 系统管理模块 `/system`

系统管理模块是运维控制台，采用简洁科技风。

---

## 9.1 `/system/dashboard` 系统总览页

### 页面目标

管理员进入后快速看到系统整体健康情况。

### 页面结构

```text
核心指标
  今日请求量
  平均响应时延
  错误率
  RAG 命中率
  在线服务数
  告警数

服务健康概览
  ASR
  翻译
  图像理解
  LLM
  Milvus
  Neo4j
  PostgreSQL
  Redis
  MinIO

趋势图
  请求量趋势
  错误率趋势
  平均延迟趋势

告警摘要
  低置信回答过多
  接口延迟升高
  某语种翻译失败率升高
```

### API 数据

```text
GET /system/dashboard
GET /system/health
GET /system/alerts
```

### 交互

- 定时刷新健康数据。
- 点击服务卡片进入 `/system/health`。
- 点击告警进入日志或详情。

---

## 9.2 `/system/users` 用户管理页

### 页面目标

管理平台用户。

### 页面结构

```text
工具栏
  新增用户
  搜索
  角色筛选
  状态筛选

用户表格
  用户名
  姓名
  邮箱
  角色
  状态
  最近登录
  创建时间
  操作

用户表单
  基础信息
  角色
  状态
```

### API 数据

```text
GET /users
POST /users
PUT /users/:id
DELETE /users/:id
POST /users/:id/disable
```

### 交互

- 新增、编辑使用 Dialog。
- 删除或禁用需要确认。
- 用户角色来自真实角色接口。
- 当前用户不能删除自己。

---

## 9.3 `/system/roles` 角色管理页

### 页面目标

展示和管理角色。

### 页面结构

```text
角色卡片/表格
  游客
  学生
  导游
  专家
  管理员

角色详情
  角色说明
  绑定用户数
  权限摘要
```

### API 数据

```text
GET /roles
POST /roles
PUT /roles/:id
DELETE /roles/:id
```

若角色固定不可改，页面显示只读。

---

## 9.4 `/system/permissions` 权限管理页

### 页面目标

展示和配置角色权限。

### 页面结构

```text
权限矩阵
  行：页面/功能
  列：角色
  单元格：可访问 / 可操作

权限分类
  页面访问权限
  数据查看权限
  操作权限
  审核权限
  系统配置权限
```

### API 数据

```text
GET /permissions
GET /roles/:id/permissions
POST /roles/:id/permissions
```

### 交互

- 修改权限需确认。
- 管理员关键权限不能随意取消，需二次确认。
- 无权限接口时显示只读权限矩阵。

---

## 9.5 `/system/health` 接口健康监控页

### 页面目标

监控各服务健康状态。

### 页面结构

```text
服务状态卡片
  ASR 服务
  翻译服务
  图像理解服务
  LLM 服务
  Milvus
  Neo4j
  PostgreSQL
  Redis
  MinIO

每张卡片展示
  状态
  延迟
  今日调用量
  错误率
  最近检查时间

详情表格
  服务名
  endpoint
  状态
  p95 延迟
  错误率
  最近错误
```

### API 数据

```text
GET /system/health
GET /system/services
GET /system/services/:id
```

### 交互

- 定时刷新。
- 支持手动刷新。
- 异常服务高亮。
- 点击服务查看详情。

---

## 9.6 `/system/logs` 模型调用日志页

### 页面目标

追踪每次 AI 调用链路，排查错误来源。

### 页面结构

```text
筛选工具栏
  时间范围
  用户语言
  模型类型
  是否触发审核
  是否低置信
  request_id 搜索

日志表格
  request_id
  用户语言
  ASR 结果
  翻译结果
  检索 chunk
  图谱查询
  prompt 版本
  模型版本
  响应时延
  是否触发审核
  创建时间

详情抽屉
  完整请求
  标准化问题
  检索结果
  图谱结果
  prompt
  模型输出
  错误堆栈
```

### API 数据

```text
GET /logs/model-calls
GET /logs/requests
GET /logs/errors
GET /logs/:requestId
```

### 验收标准

- request_id 可以追踪完整链路。
- 对定位 AI 错误有帮助。
- 日志详情不要一屏挤爆，使用抽屉和折叠面板。

---

## 9.7 `/system/metrics` 指标分析页

### 页面目标

展示系统运行指标趋势。

### 页面结构

```text
指标图表
  请求量趋势
  各语言使用占比
  服务延迟排行
  错误率趋势
  RAG 命中率趋势
  低置信回答趋势

筛选条件
  时间范围
  服务类型
  语言
  景区
```

### API 数据

```text
GET /system/metrics
GET /system/metrics/requests
GET /system/metrics/languages
GET /system/metrics/latency
GET /system/metrics/errors
GET /system/metrics/rag
```

### 图表规范

- 趋势用折线图。
- 占比用饼图或环形图。
- 排名用横向柱状图。
- 图表标题明确，单位清晰。

---

## 9.8 `/system/settings` 系统设置页

### 页面目标

展示和配置系统级参数。

### 页面结构

```text
后端接口配置
  API Base URL
  WebSocket URL
  文件访问前缀

模型配置
  ASR 模型
  翻译模型
  LLM 模型
  向量模型
  视觉模型
  TTS 模型

审核策略
  置信度阈值
  敏感等级策略
  自动审核开关

文件上传配置
  允许格式
  大小限制
  存储位置

系统维护
  维护模式
  日志保留天数
```

### API 数据

```text
GET /system/settings
PUT /system/settings
```

如果后端不允许修改系统配置，则做只读展示。

---

# 10. 组件设计清单

## 10.1 文旅组件

```text
src/components/tourism/TourismHero.tsx
src/components/tourism/ScenicBanner.tsx
src/components/tourism/GlassPanel.tsx
src/components/tourism/TravelFeatureCard.tsx
src/components/tourism/RouteCard.tsx
src/components/tourism/CulturalNoticeCard.tsx
src/components/tourism/TravelStatCard.tsx
src/components/tourism/ScenicImagePlaceholder.tsx
src/components/tourism/LanguageSelector.tsx
src/components/tourism/ProcessingTimeline.tsx
```

### 设计要求

- 支持背景图 URL 或占位渐变。
- 支持标题、副标题、标签、操作按钮。
- 支持移动端。
- 风格统一，不要每个页面单独写一套样式。

## 10.2 后台科技组件

```text
src/components/admin/AdminMetricCard.tsx
src/components/admin/HealthStatusCard.tsx
src/components/admin/DataToolbar.tsx
src/components/admin/TechSectionCard.tsx
src/components/admin/LogTable.tsx
src/components/admin/PermissionMatrix.tsx
src/components/admin/StatusBadge.tsx
src/components/admin/EmptyState.tsx
src/components/admin/ErrorState.tsx
```

### 设计要求

- 支持 loading skeleton。
- 支持异常状态。
- 颜色统一。
- 表格工具栏可复用。
- 状态标签语义清晰。

## 10.3 图谱组件

```text
src/components/graph/KnowledgeGraphCanvas.tsx
src/components/graph/GraphNodeDrawer.tsx
src/components/graph/GraphToolbar.tsx
src/components/graph/GraphLegend.tsx
src/components/graph/RelationEditor.tsx
```

### 设计要求

- 使用真实后端节点和边。
- 节点颜色按类型区分。
- 边标签显示关系类型。
- 支持节点点击、关系点击。
- 支持筛选和搜索。
- 支持空图状态。

---

# 11. 图片资源规划与 docs/image-prompts.md

前端不联网下载图片，不使用版权图。页面中先使用渐变占位或本地占位组件，同时创建 `docs/image-prompts.md`，用于后续批量生成图片。

## 11.1 image-prompts.md 格式

```markdown
| 用途模块 | 子页面 | 模块位置 | 建议文件名 | 建议比例 | 详细图片生成 Prompt | 风格关键词 |
|---|---|---|---|---|---|---|
```

## 11.2 图片 Prompt 总要求

每条 Prompt 必须：

- 不出现真实品牌。
- 不出现真实 Logo。
- 不出现可读文字。
- 不出现乱码文字。
- 不出现真实名人。
- 不要水印。
- 风格高级、干净、适合比赛展示。
- 需要时包含 AI interface overlay，但不要出现可读 UI 文本。

统一关键词可参考：

```text
Yunnan cultural tourism, ancient town architecture, misty mountains, lakes, terraces, ethnic cultural elements, premium digital illustration, cinematic lighting, soft teal and warm gold color palette, elegant composition, glowing knowledge graph, AI interface overlay, no text, no logo, no watermark
```

## 11.3 建议图片清单

| 编号 | 用途模块 | 子页面 | 模块位置 | 建议文件名 | 比例 |
|---|---|---|---|---|---|
| 1 | 项目介绍 | overview | Hero 主视觉 | intro-hero-yunnan-ai.png | 21:9 |
| 2 | 项目介绍 | overview | 技术壁垒背景 | intro-tech-barrier.png | 16:9 |
| 3 | 项目介绍 | architecture | 架构页头图 | intro-architecture-banner.png | 21:9 |
| 4 | 项目介绍 | architecture | AI 调用链路背景 | intro-ai-pipeline.png | 16:9 |
| 5 | 项目介绍 | features | 多语导览概念图 | feature-multilingual-guide.png | 4:3 |
| 6 | 项目介绍 | features | 拍照识别概念图 | feature-image-recognition.png | 4:3 |
| 7 | 项目介绍 | features | RAG 知识库概念图 | feature-rag-knowledge.png | 4:3 |
| 8 | 项目介绍 | features | 文化知识图谱概念图 | feature-cultural-graph.png | 4:3 |
| 9 | 项目介绍 | scenarios | 外国游客导览场景 | scenario-foreign-tourist.png | 16:9 |
| 10 | 项目介绍 | scenarios | AI 导游实训课堂 | scenario-ai-training-class.png | 16:9 |
| 11 | 项目介绍 | roadmap | 建设路线背景 | intro-roadmap-bg.png | 16:9 |
| 12 | 游客端 | home | 顶部景区 Banner | tourist-home-banner.png | 21:9 |
| 13 | 游客端 | home | 今日推荐景点图 | tourist-recommend-scenic.png | 4:3 |
| 14 | 游客端 | chat | 多语聊天背景 | tourist-chat-bg.png | 16:9 |
| 15 | 游客端 | voice | 语音导览场景 | tourist-voice-guide.png | 16:9 |
| 16 | 游客端 | image | 拍照识别场景 | tourist-image-capture.png | 16:9 |
| 17 | 游客端 | image | 古建筑细节图 | tourist-architecture-detail.png | 4:3 |
| 18 | 游客端 | routes | 古城漫游路线 | route-old-town.png | 4:3 |
| 19 | 游客端 | routes | 非遗体验路线 | route-heritage.png | 4:3 |
| 20 | 游客端 | routes | 美食探索路线 | route-food.png | 4:3 |
| 21 | 游客端 | routes | 摄影路线 | route-photography.png | 4:3 |
| 22 | 游客端 | culture-tips | 民族礼仪提醒 | tips-ethnic-etiquette.png | 4:3 |
| 23 | 游客端 | culture-tips | 宗教场所礼仪 | tips-temple-etiquette.png | 4:3 |
| 24 | 游客端 | culture-tips | 美食文化提醒 | tips-food-culture.png | 4:3 |
| 25 | 导游端 | dashboard | 导游工作台 Banner | guide-dashboard-banner.png | 21:9 |
| 26 | 导游端 | sessions | 游客会话背景 | guide-sessions-bg.png | 16:9 |
| 27 | 导游端 | takeover | 真人导游接管场景 | guide-takeover.png | 16:9 |
| 28 | 导游端 | corrections | AI 回答修正概念图 | guide-correction.png | 16:9 |
| 29 | 导游端 | cases | 优秀讲解案例图 | guide-case-library.png | 4:3 |
| 30 | 导游端 | profile | 导游贡献背景图 | guide-profile-bg.png | 16:9 |
| 31 | 知识库 | documents | 科技背景纹理 | knowledge-docs-bg.png | 16:9 |
| 32 | 知识库 | graph | 图谱背景纹理 | knowledge-graph-bg.png | 16:9 |
| 33 | 知识库 | rag-test | 检索链路背景 | knowledge-rag-test-bg.png | 16:9 |
| 34 | 系统管理 | dashboard | 运维控制台背景 | system-dashboard-bg.png | 16:9 |
| 35 | 系统管理 | health | 服务健康抽象图 | system-health-bg.png | 16:9 |
| 36 | 系统管理 | logs | 调用链路日志背景 | system-logs-bg.png | 16:9 |
| 37 | 公共 | all | 浅色民族纹样 | common-ethnic-pattern-light.png | 16:9 |
| 38 | 公共 | all | 深色民族纹样 | common-ethnic-pattern-dark.png | 16:9 |
| 39 | 公共 | all | 山水淡纹背景 | common-misty-mountain-bg.png | 16:9 |
| 40 | 公共 | auth | 登录页背景 | auth-yunnan-ai-bg.png | 16:9 |

---

# 12. README 必须说明的内容

README 中至少包含：

1. 项目启动方式。
2. 环境变量配置。
3. 后端接口地址配置。
4. 完整路由表。
5. 五个一级模块说明。
6. 每个子页面说明。
7. 文旅风与科技风的视觉分工。
8. API 接入说明。
9. 已接入接口列表。
10. 缺失接口清单。
11. 图片资源使用方式。
12. `docs/image-prompts.md` 的用途。
13. 真实联调注意事项。
14. 后续优化建议。

---

# 13. 开发优先级

由于页面较多，不要一次性追求所有页面完美。按以下顺序实现。

## 第一阶段：骨架与真实 API 层

1. React Router 嵌套路由。
2. RootLayout / TourismLayout / AdminLayout。
3. API Client。
4. 登录与权限框架。
5. 一级导航 + 二级导航。
6. 每个子页面先有清晰骨架。

## 第二阶段：核心演示页

优先打磨：

1. `/intro/overview`
2. `/tourist/chat`
3. `/tourist/image`
4. `/guide/sessions/:id`
5. `/knowledge/graph`
6. `/knowledge/rag-test`
7. `/system/dashboard`

这些页面最适合比赛演示。

## 第三阶段：完整业务页

继续完善：

1. 游客历史。
2. 路线推荐。
3. 文化提醒。
4. 导游案例库。
5. 文档管理。
6. chunk 管理。
7. 审核工作台。
8. 术语表。
9. 用户/角色/权限。
10. 健康/日志/指标/设置。

## 第四阶段：视觉与图片资源

1. 文旅页面替换生成图。
2. 后台页面统一图表和状态卡片。
3. 细化动效。
4. 响应式适配。
5. 完善 `docs/image-prompts.md`。

---

# 14. 关键验收标准

最终前端必须满足：

1. 不是 5 个单页，而是多端多页面系统。
2. 文旅端和后台端视觉明显不同。
3. 游客端问答、语音、图片识别优先接真实后端。
4. 导游端接管、回复、修正优先接真实后端。
5. 知识库维护具备 RAG、chunk、图谱、审核、术语、检索测试页面。
6. 系统管理具备用户权限、服务健康、日志、指标页面。
7. 所有接口错误都有明确提示。
8. 所有页面都有 Loading / Empty / Error 状态。
9. 图片不使用网络版权图，图片 Prompt 单独管理。
10. 适合比赛答辩现场展示、录屏和后续产品化。

---

# 15. 不要做的事

1. 不要把所有功能塞进 5 个页面。
2. 不要用 mock data 假装后端成功。
3. 不要联网下载随机图片。
4. 不要用静态图冒充知识图谱。
5. 不要把知识库页做成旅游宣传页。
6. 不要把游客页做成普通后台表单。
7. 不要所有页面都用一个模板。
8. 不要为了页面数量创建空页面。
9. 不要在前端写死敏感民族/宗教内容。
10. 不要忽略错误状态和权限状态。

---

## 结语

这份设计说明书的目标是让前端从“单页演示 Demo”升级为“多端多页面真实系统”。  
如果 Codex 分阶段执行，应先完成路由、布局、API 层和核心页面，再逐步完善全部子页面、图片资源和视觉细节。
