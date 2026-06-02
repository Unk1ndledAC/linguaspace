# 04. 前端工程架构与 API 接入

## 1. 推荐目录结构

可以根据已有项目微调，但应保持职责清晰。

```txt
src/
  api/
    client.ts
    auth.ts
    tourist.ts
    guide.ts
    knowledge.ts
    graph.ts
    system.ts
    upload.ts
    types.ts

  layouts/
    RootLayout.tsx
    TourismLayout.tsx
    AdminLayout.tsx
    ModuleLayout.tsx

  components/
    navigation/
      PrimaryNav.tsx
      SecondaryNav.tsx
      Breadcrumbs.tsx
      RoleSwitcher.tsx

    tourism/
      TourismHero.tsx
      ScenicBanner.tsx
      GlassPanel.tsx
      TravelFeatureCard.tsx
      RouteCard.tsx
      CulturalNoticeCard.tsx
      ScenicImagePlaceholder.tsx

    admin/
      AdminMetricCard.tsx
      DataToolbar.tsx
      HealthStatusCard.tsx
      TechSectionCard.tsx
      LogTable.tsx
      PermissionMatrix.tsx
      GraphDetailDrawer.tsx

    common/
      LoadingState.tsx
      ErrorState.tsx
      EmptyState.tsx
      ApiPendingState.tsx
      ConfirmDialog.tsx
      StatusBadge.tsx

  pages/
  hooks/
  store/
  utils/
  styles/
```

## 2. 路由架构

请使用 React Router 嵌套路由。

默认 `/` 跳转到项目介绍总览页。

一级模块：

1. 项目介绍
2. 游客端
3. 导游端
4. 知识库维护
5. 系统管理

具体子路由以 `docs/LinguaSpace_frontend_page_design.md` 为准。

## 3. Layout 架构

### TourismLayout

用于：

- 项目介绍模块
- 游客端模块
- 导游端模块

特点：

- 文旅沉浸式视觉
- 顶部导航
- 大图 Banner / Hero
- 玻璃拟态卡片
- 适合展示和交互

### AdminLayout

用于：

- 知识库维护模块
- 系统管理模块

特点：

- 左侧 Sidebar
- 顶部状态栏
- 表格、图表、状态卡片
- 高信息密度
- 科技后台风格

## 4. 导航架构

需要两级导航：

一级导航：

- 项目介绍
- 游客端
- 导游端
- 知识库维护
- 系统管理

二级导航：

- 根据当前一级模块动态变化
- 子页面配置应集中维护，避免散落在页面中

## 5. 统一 API 层

所有接口都必须通过 `src/api/` 下的模块调用。

禁止在页面组件中直接散落 fetch / axios。

建议模块：

- `client.ts`
- `auth.ts`
- `tourist.ts`
- `guide.ts`
- `knowledge.ts`
- `graph.ts`
- `system.ts`
- `upload.ts`
- `types.ts`

## 6. 环境变量

默认：

```txt
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

必须通过环境变量读取后端地址，不要硬编码在页面中。

## 7. API Client 要求

统一处理：

1. baseURL
2. timeout
3. token 注入
4. 401
5. 403
6. 500
7. 网络异常
8. 错误提示
9. 响应格式适配
10. 文件上传

## 8. 类型定义

类型优先来源：

1. OpenAPI
2. 后端 schema / DTO / Pydantic Model
3. 真实接口响应
4. 必要时在前端补充最小类型定义

不要杜撰字段。

## 9. 认证方式

根据真实后端认证方式实现。

### JWT

- 登录后保存 access_token
- 请求头添加 Authorization: Bearer token
- 支持退出登录
- 支持刷新后恢复登录态

### Session / Cookie

- axios 设置 withCredentials
- 按真实接口处理登录态

### 暂未启用认证

- 保留前端权限结构
- README 中说明当前后端未启用认证
- 不要假造登录接口

## 10. 缺失接口处理

如果页面需要的接口不存在：

1. 页面显示“接口待接入”。
2. 操作按钮禁用或明确提示。
3. 在 `docs/frontend-implementation-plan.md` 中记录。
4. 在 README 的缺失接口清单中记录。
5. 不要用假接口顶替。
