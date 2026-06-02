# LinguaSpace Codex /goal 文档包

用途：把原本很长的 `/goal` Prompt 拆成多个 Markdown 文件，让 Codex 读取文档后逐步实现前端。

建议放置到项目中：

```txt
docs/codex/
  README.md
  00_goal_prompt.md
  01_goal.md
  02_context_and_constraints.md
  03_workflow.md
  04_architecture_and_api.md
  05_visual_and_assets.md
  06_validation_and_done.md
```

使用方式：

1. 确保项目中已有：
   - `docs/LinguaSpace_frontend_page_design.md`
   - `docs/references.md`
2. 把本文件夹放入项目的 `docs/codex/`。
3. 在 Codex `/goal` 模式中粘贴 `00_goal_prompt.md`。
4. 让 Codex 按这些文档逐步执行。

分工：

- `docs/LinguaSpace_frontend_page_design.md`：写具体每个页面怎么做。
- `docs/references.md`：写不同类型页面的参考网页。
- `docs/codex/*.md`：写 Codex 的构建规则、流程、限制、验证标准。
