<div align="center">

# web-novel-writer-pro

**网文小说签约专家** — 签约级全流程创作系统，男频女频全品类

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.3-green.svg)](SKILL.md)
[![Modules](https://img.shields.io/badge/modules-11-purple.svg)](#核心模块)
[![Platforms](https://img.shields.io/badge/platforms-14-orange.svg)](#支持平台)
[![Languages](https://img.shields.io/badge/languages-中%2F%E8%8B%B1-brightgreen.svg)](#)

</div>

> 11 大模块自由入口的网文创作系统。写作自然度优化引擎贯穿所有模块并自进化学习，适配 11 大中文 + 3 大英文平台签约标准，帮助创作达到签约水准、具备商业价值的网文作品。

## ✨ 特性

- 📚 **11 大模块自由入口** — 需要什么用什么，不强制走完整流程
- 🧠 **自然度优化引擎** — 贯穿所有模块，含自进化反AI黑名单
- 🎯 **签约级质量** — 对标主流平台签约标准，14个平台深度适配
- 🌐 **中英双语** — 自动检测切换，中英网文创作全覆盖
- 🔬 **反幻觉机制** — 多专家模拟评审，质量保障
- ⚡ **三层渐进式降级** — 自动化增强 → CLI基础 → 纯知识，任何环境可用
- 👶 **新手友好** — 从零基础新人到成熟作者均可使用
- ✅ **伦理审查** — AI创作伦理与平台合规检查

## 🧩 核心模块

| 模块 | 功能说明 |
|------|----------|
| ⚡ 极速创作 | 快速生成章节/场景/片段，高效产出 |
| 📋 签约大纲 | 从头规划整本书，人物设定/世界观/剧情线/卖点 |
| ✍️ 自然度润色 | 去AI化润色，提升文本质感与可读性 |
| 🔍 拆书分析 | 深度拆解爆款作品结构、套路、节奏 |
| 🔬 风格蒸馏 | 提取目标作家/作品的写作风格特征 |
| 🎭 名家仿写 | 基于提取的风格进行定向仿写 |
| 📖 续写衔接 | 无缝衔接续写，保持风格与节奏一致 |
| 🩺 诊断优化 | 多维度诊断作品问题，针对性优化 |
| 🌍 英文创作 | 英文网文创作，适配Wattpad/KDP/Webnovel |
| 🎬 跨媒体改编 | 小说→短剧/漫画/有声书 改编方案 |
| ⚖️ 伦理审查 | AI创作伦理与平台合规性检查 |

## 📱 支持平台

| 语言 | 平台 |
|------|------|
| 🇨🇳 中文（11个） | 起点 / 番茄 / 晋江 / 七猫 / 长佩 / 刺猬猫 / 纵横 / 豆瓣 / 盐言故事 / 抖音故事 / 快手短剧 |
| 🇺🇸 英文（3个） | Wattpad / Amazon KDP / Webnovel |

## 🚀 快速开始

在支持 OpenClaw / Codex CLI / ChatGPT / Claude Code / DeepSeek / Gemini / Kimi 的环境中加载本技能后即可使用。

```
# 常见触发方式
- "写个都市修仙小说的开头"
- "帮我从零规划一本男频爽文"
- "把这段改得更像人写的"
- "拆解一下《诡秘之主》的结构"
- "提取我的写作风格"
- "用鲁迅风格写个短篇"
- "接着第10章继续写"
- "诊断一下我的小说为什么签不了约"
```

## 📁 项目结构

```
web-novel-writer-pro/
├── SKILL.md                          # 技能主文档
├── AGENTS.md                         # 多Agent协作说明
├── CHANGELOG.md                      # 变更日志
├── manifest.json                     # 清单文件
├── references/                       # 参考资料（15+ 份）
│   ├── signing-standards.md          # 签约标准
│   ├── platform-guide.md             # 平台指南
│   ├── style-distillation.md         # 风格蒸馏
│   ├── quality-metrics.md            # 质量指标
│   ├── hook-templates.md             # 钩子模板
│   ├── rhythm-patterns.md            # 节奏模式
│   ├── anti-ai-engine.md             # 反AI引擎
│   ├── legal-compliance.md           # 合规与伦理
│   └── ...
├── engine/                           # 执行引擎协议
│   ├── execution-protocol.md
│   ├── evolution-protocol.md
│   ├── expert-panel.md
│   └── ...
├── scripts/                          # 工具脚本
│   ├── quality_check.py              # 质量检测
│   ├── adaptation_converter.py       # 改编转换
│   ├── blacklist_manager.mjs         # 黑名单管理
│   └── ...
├── exports/                          # 各平台导出指令
│   ├── chatgpt-instructions.md
│   ├── deepseek-system-prompt.md
│   └── ...
├── .claude/agents/                   # Claude Code 专用 agents
│   ├── character-designer.md
│   ├── plot-architect.md
│   ├── narrative-writer.md
│   └── ...
└── test/                             # 测试脚本
    └── smoke-test.mjs
```

## License

MIT © bin1732
