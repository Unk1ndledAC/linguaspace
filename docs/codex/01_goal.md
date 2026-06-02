# 01. 前端建设目标

## 1. 总目标

实现一套真实可用、可联调、可展示的 LinguaSpace 前端系统。

该系统不是 5 个单页，而是 5 个一级模块下的多子页面 Web App：

1. 项目介绍模块
2. 游客端模块
3. 导游端模块
4. 知识库维护模块
5. 系统管理模块

具体页面结构以 `docs/LinguaSpace_frontend_page_design.md` 为准。

## 2. 核心要求

1. 前端必须接入真实后端接口。
2. 页面结构必须遵守 `docs/LinguaSpace_frontend_page_design.md`。
3. 视觉风格必须结合 `docs/references.md`。
4. 项目介绍、游客端、导游端采用文旅沉浸式风格。
5. 知识库维护、系统管理采用简洁科技风格。
6. 不允许把 mock data 当正式数据源。
7. 缺失接口必须明确标注为“接口待接入”。
8. 最终效果需要适合比赛答辩展示、录屏和真实联调。

## 3. 具体页面设计来源

具体页面怎么做，不写在本文件中。

请以以下文件为准：

- `docs/LinguaSpace_frontend_page_design.md`：页面结构、功能、路由、验收标准。
- `docs/references.md`：参考网页、参考风格、视觉借鉴方向。
- 当前后端接口文档 / OpenAPI / 路由代码：真实接口依据。

## 4. 最终产物

最终项目应包含：

1. 可运行的前端工程。
2. 完整路由系统。
3. 双视觉体系。
4. 统一 API 层。
5. 真实后端接口接入。
6. loading / empty / error / api pending 状态。
7. `docs/frontend-implementation-plan.md`。
8. `docs/reference-analysis.md`。
9. `docs/image-prompts.md`。
10. 更新后的 `README.md`。
