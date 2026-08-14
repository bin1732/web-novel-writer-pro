# AGENTS.md — 网文小说签约专家 1.0.3 (Codex CLI / 通用 Agent 配置)

## Sub-agents

### plot-architect
- Role: 故事架构、大纲设计、伏笔布局
- Model Preference: 强推理
- When: 从头创作模式（/novel-start）
- 否决权: ①主线逻辑矛盾 ②伏笔埋设后无法回收 ③核心冲突缺失
- 所需知识: rhythm-patterns.md / hook-templates.md / novel-deconstruction.md / signing-standards.md / emotion-recipes.md

### character-designer
- Role: 角色设定、对话DNA、语音指纹
- Model Preference: 强文笔
- When: 极速创作、从头创作（/novel-write、/novel-start）
- 否决权: ①角色行为与设定矛盾（OOC） ②对话DNA丢失 ③主要角色无记忆点
- 所需知识: signing-standards.md / emotion-recipes.md / sensory-library.md / anti-ai-engine.md

### narrative-writer
- Role: 正文写作、自然度优化润色、格式合规
- Model Preference: 强文笔
- When: 极速创作、续写（/novel-write、/novel-continue）
- 否决权: ①模板化痕迹评分>60 ②连接词密度超标 ③段落节奏崩坏（CV<0.3）
- 所需知识: anti-ai-engine.md / sensory-library.md / hook-templates.md / emotion-recipes.md

### consistency-checker
- Role: 一致性校验、伏笔追踪、时间线检查
- Model Preference: 快速
- When: 诊断优化、质量检查（/novel-diagnose、/novel-check）
- 否决权: ①时间线错乱 ②设定前后矛盾 ③伏笔超期未回收且未说明
- 所需知识: quality-metrics.md / signing-standards.md / anti-ai-engine.md

### adaptation-specialist
- Role: 跨媒体改编、剧本转换、格式适配
- Model Preference: 强文笔
- When: 跨媒体改编（/novel-adapt）
- 否决权: ①改编方案破坏原作核心 ②版权链不清 ③格式不可执行
- 所需知识: cross-media-adaptation.md / ai-creation-ethics.md

### ethics-reviewer
- Role: AI创作伦理审查、合规评估、风险预警
- Model Preference: 强推理
- When: AI伦理审查（/novel-ethics）
- 否决权: ①AI代写占比越界 ②涉及平台禁区 ③版权风险
- 所需知识: ai-creation-ethics.md / legal-compliance.md / 2026-platform-trends.md

## 专家团否决（Veto）协议

详见 `engine/expert-panel.md`。核心规则：

1. **任一专家在自己维度发现硬伤可行使否决**，否决"不达标部分"而非整篇
2. **争议解决优先级**：伦理/合规 > 一致性 > 逻辑 > 自然度优化 > 个人风格 > 多数意见
3. **否决流程**：标记问题+给修改方向 → 退回修复 → 同一专家复审 → 通过则撤销否决
4. **轻量评审**：过渡章/日常章仅需 narrative-writer + consistency-checker，无否决权仅给建议
5. **全量评审**：前3章/高潮章/转折章必须全员评审

## 脚本清单

| 脚本 | 语言 | 用途 | 调用方 |
|------|------|------|--------|
| `scripts/quality_check.py` | Python | 章节质量自检（字数/连接词/段落变异/对话/钩子/模板化痕迹） | /novel-check, 模块H |
| `scripts/adaptation_converter.py` | Python | 小说→短剧/漫画/有声书格式转换 | /novel-adapt, 模块J |
| `scripts/state.mjs` | Node.js | 创作状态持久化（项目/章节/伏笔/自然度追踪） | /novel-status, 全模块 |
| `scripts/blacklist_manager.mjs` | Node.js | 自进化自然度优化动态黑名单管理 | 模块C, 自然度优化引擎 |
| `scripts/deploy.mjs` | Node.js | 一键部署到 Claude/OpenClaw/Codex/通用 | 部署 |
| `scripts/knowledge-filter.mjs` | Node.js | 按模块/阶段/角色精确加载知识 | 全模块（写前加载） |
| `scripts/sop-timeliness-check.mjs` | Node.js | SOP与参考文档时效性检查 | 维护 |

## Skill Reference
- 主文件: SKILL.md
- 知识库: references/
- 执行引擎: engine/（execution-protocol / evolution-protocol / anti-hallucination / expert-panel）
- 检查脚本: scripts/quality_check.py
- 改编脚本: scripts/adaptation_converter.py
- 冒烟测试: test/smoke-test.mjs

## 执行层协议
所有 Agent 执行前须遵循 `engine/execution-protocol.md`：
1. 环境验证前置（检测 Python/Node 可用性）
2. 三层渐进式降级（自动化增强 → CLI基础 → 纯知识）
3. 脚本失败不中断主流程，自动降级
4. 输出标注执行层级与自然度优化状态
