# Changelog

## 1.0.0 - 2026-06-01

- 从损坏 Git 历史中全量重构 LinguaSpace 单机 MVP。
- 恢复 CSV/MySQL 数据链路、Ollama 文本与视觉适配器、RAG 问答和流式输出。
- 重建游客端、学生端、导游端、管理端与品牌介绍页。
- 增加动态图谱、实训 LLM-as-Judge 安全兜底、导游修正审核、健康监测与模型日志。
- 增加一键启动、停止脚本和 Docker Compose 基础设施。
- 按最终验收口径移除运行时降级：MySQL、Redis、MinIO、Neo4j、Ollama 模型和服务端 ASR 均作为真实依赖校验。
