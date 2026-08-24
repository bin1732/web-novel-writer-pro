# 网文小说签约专家 1.0.3 — 跨模型导出指令集

本目录包含用于在不同 AI 平台上使用本 Skill 的导出文件。

## 支持的平台

| 平台 | 文件 | 部署方式 |
|------|------|----------|
| **ChatGPT** | `chatgpt-instructions.md` | Custom GPT → 粘贴指令 |
| **DeepSeek** | `deepseek-system-prompt.md` | API system prompt / 网页传知识库 |
| **Gemini** | `gemini-instructions.md` | Gem / AI Studio system instructions |
| **Kimi** | `kimi-instructions.md` | Kimi+ 智能体 → 传知识库 |
| **豆包/通义/智谱** | 复用 `chatgpt-instructions.md` | 各家"创建智能体" → 粘贴指令+知识库 |

## 1.0.3 更新

- 全攻击审查修复：移除 `adaptation_converter.py` U+201D 死条件，零死代码
- 版本单一事实源：deploy.mjs / blacklist_manager.mjs 从 manifest.json 动态读取版本
- 新增用户偏好记忆层：`state.mjs set-pref/get-pref` + `state/user_prefs.json`，越用越懂用户
- 健壮性提升：blacklist `top` 参数校验
- 数字一致性修复：本目录 4 份指令英文平台统一为"3大英文平台（Wattpad/Amazon KDP/Webnovel）"，与 SKILL.md 描述一致；`beginner-guide.md` 残留"100+位作家/8大中文平台"同步修正为"66位/11大中文平台"
- 冒烟测试增强：黑名单命令全覆盖 + 版本单一事实源断言 + 偏好用例

## 使用方式

本目录已预生成各平台系统提示词，直接复制对应文件内容到目标平台即可：

| 文件 | 目标平台 | 用法 |
|------|----------|------|
| `chatgpt-instructions.md` | ChatGPT / GPT-4 | 粘贴到 Custom Instructions 或 System Prompt |
| `deepseek-system-prompt.md` | DeepSeek | 粘贴到系统提示词 |
| `gemini-instructions.md` | Gemini | 粘贴到 System Instructions |
| `kimi-instructions.md` | Kimi | 粘贴到系统提示词 |

如需部署到 Claude Code / OpenClaw / Codex CLI，使用部署脚本：

```text
node scripts/deploy.mjs claude      # Claude Code
node scripts/deploy.mjs openclaw    # OpenClaw
node scripts/deploy.mjs codex       # Codex CLI
node scripts/deploy.mjs generic     # 通用说明
```
