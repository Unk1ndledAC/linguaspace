# 05. 双视觉体系与图片资源

## 1. 双视觉体系

项目必须形成两套明显不同但风格统一的视觉体系。

## 2. 文旅沉浸式风格

适用于：

- 项目介绍模块
- 游客端模块
- 导游端模块

设计方向：

- 大幅风景图
- 沉浸式 Hero Banner
- 山水、古城、民族文化、旅行场景
- 旅游杂志式布局
- 半透明浮层卡片
- 景点卡片
- 路线卡片
- 文化提醒卡片
- 图文混排
- 柔和渐变
- 玻璃拟态
- 适合比赛答辩展示和录屏

关键词：

- immersive tourism website
- travel magazine layout
- Yunnan cultural tourism
- scenic hero banner
- ancient town architecture
- misty mountains
- ethnic cultural patterns
- glassmorphism
- warm teal and soft gold
- premium editorial style

## 3. 简洁科技风格

适用于：

- 知识库维护模块
- 系统管理模块

设计方向：

- 简洁
- 克制
- 专业
- 信息密度高
- 表格、图表、图谱、日志、状态卡片为核心
- 不使用大面积文旅图片
- 低饱和配色
- 清晰的导航和筛选
- 统一的状态标签和操作按钮

关键词：

- clean AI dashboard
- enterprise admin UI
- knowledge engineering platform
- system observability dashboard
- graph management interface
- minimal
- structured
- professional

## 4. references.md 使用要求

必须读取：

`docs/references.md`

并从中提炼：

- 页面结构
- 首屏构图
- 导航方式
- 卡片样式
- 图文比例
- 色彩气质
- 内容层级
- 动效特点
- 留白方式
- 图片使用方式
- 适合迁移到 LinguaSpace 的布局模式

## 5. reference-analysis.md

必须创建或更新：

`docs/reference-analysis.md`

该文件用于说明：

1. 参考网页来源概览
2. 参考网页类型分类
3. 文旅页面参考提炼
4. 科技后台页面参考提炼
5. 每个核心页面对应的参考来源
6. 可借鉴内容
7. 不可照搬内容
8. LinguaSpace 原创转化方案

## 6. 图片使用原则

不要联网下载图片，不要使用随机网络图片，不要使用版权图片。

前端中可以先使用：

1. CSS 渐变占位
2. SVG 抽象纹理
3. 图片容器骨架
4. 本地占位组件
5. 色块 + 图标组合

## 7. image-prompts.md

必须创建或更新：

`docs/image-prompts.md`

格式：

```md
| 模块 | 子页面 | 模块位置 | 建议文件名 | 建议比例 | 图片生成 Prompt | 风格关键词 |
| --- | --- | --- | --- | --- | --- | --- |
```

要求：

1. 至少 35 条图片生成 Prompt。
2. 覆盖项目介绍、游客端、导游端、公共纹理、必要背景。
3. Prompt 要结合 `docs/references.md` 中对应参考类型。
4. Prompt 要可直接复制到图像生成模型使用。
5. 不出现真实品牌。
6. 不出现真实 Logo。
7. 不出现可读文字。
8. 不出现乱码文字。
9. 不出现水印。
10. 不出现真实名人。
11. 风格高级、干净、适合比赛展示。

## 8. Prompt 推荐要素

文旅类：

- Yunnan cultural tourism
- ancient town architecture
- misty mountains
- ethnic cultural elements
- lakes
- terraces
- premium digital illustration
- cinematic lighting
- soft teal and warm gold color palette
- elegant composition

科技类：

- clean AI dashboard background
- glowing knowledge graph
- abstract data network
- dark slate and teal palette
- subtle grid
- professional enterprise platform
- no text
- no logo

## 9. 同步更新规则

每实现或调整一个带图片位的页面，都要同步检查并更新：

`docs/image-prompts.md`
