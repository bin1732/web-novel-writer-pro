#!/usr/bin/env node
/**
 * deploy.mjs — 网文小说签约专家 一键部署（跨平台 Node.js）
 * 替代 deploy.sh，Windows/macOS/Linux 全兼容
 *
 * 用法:
 *   node scripts/deploy.mjs <target>   (target: claude | openclaw | codex | generic)
 *   node scripts/deploy.mjs --dry-run <target>  仅预览不写入
 * 示例:
 *   node scripts/deploy.mjs claude
 *   node scripts/deploy.mjs openclaw
 *   node scripts/deploy.mjs codex
 */
import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_DIR = resolve(__dirname, '..');
const SKILL_NAME = 'web-novel-writer-pro';
// 版本单一事实源：从 manifest.json 读取，避免升级时漏改硬编码版本
const VERSION = (() => {
  try {
    const manifestPath = join(SKILL_DIR, 'manifest.json');
    if (existsSync(manifestPath)) {
      return JSON.parse(readFileSync(manifestPath, 'utf8')).version || 'unknown';
    }
  } catch {}
  return 'unknown';
})();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const target = args.filter(a => !a.startsWith('--'))[0] || 'generic';

function ensureDir(p) {
  if (dryRun) { return; }
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function write(file, content) {
  if (dryRun) {
    console.log(`[dry-run] 将写入: ${file}`);
    return;
  }
  writeFileSync(file, content, 'utf8');
  console.log(`✅ 已写入: ${file}`);
}

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  ensureDir(dest);
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else {
      if (dryRun) console.log(`[dry-run] 将复制: ${d}`);
      else { copyFileSync(s, d); }
    }
  }
}

function deployClaude() {
  console.log('🎯 部署到 Claude Code');
  const claudeFile = join(SKILL_DIR, 'CLAUDE.md');
  const content = `# CLAUDE.md — 网文小说签约专家 ${VERSION} (自动部署)

## Skill 引用
加载 SKILL.md: ${SKILL_DIR}/SKILL.md
参考文件: ${SKILL_DIR}/references/
引擎协议: ${SKILL_DIR}/engine/
检查脚本: ${SKILL_DIR}/scripts/quality_check.py
状态脚本: ${SKILL_DIR}/scripts/state.mjs
黑名单: ${SKILL_DIR}/scripts/blacklist_manager.mjs

## 核心斜杠命令
- /novel-write    极速创作
- /novel-start    从头创作
- /novel-deslop   自然度优化润色
- /novel-deconstruct 拆书分析
- /novel-distill  风格蒸馏
- /novel-imitate  作家仿写
- /novel-continue 续写章节
- /novel-diagnose 诊断优化
- /novel-english  英文创作
- /novel-adapt    跨媒体改编
- /novel-ethics   AI伦理审查
- /novel-status   项目进度
- /novel-check    质量检查
- /novel-platform 平台信息
- /novel-help     帮助
- /novel-guide    新人引导

## Agent 引用
Agent 配置: ${SKILL_DIR}/.claude/agents/
`;
  write(claudeFile, content);
  // 确认 agents 已就位（Claude Code 从 .claude/agents/ 直接读取，无需复制）
  const agentsDir = join(SKILL_DIR, '.claude', 'agents');
  if (existsSync(agentsDir)) {
    const agentFiles = readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    console.log(`✅ Agents 已就位: ${agentFiles.length} 个`);
  } else {
    console.log('⚠️  .claude/agents/ 目录不存在，请检查');
  }
}

function deployOpenclaw() {
  console.log('🎯 部署到 OpenClaw');
  const openclawDir = join(homedir(), '.openclaw', 'skills', SKILL_NAME);
  ensureDir(openclawDir);
  // 复制核心文件
  const items = ['SKILL.md', 'AGENTS.md', 'CHANGELOG.md', 'manifest.json', '_meta.json'];
  for (const item of items) {
    const src = join(SKILL_DIR, item);
    if (existsSync(src)) {
      if (dryRun) console.log(`[dry-run] 将复制: ${join(openclawDir, item)}`);
      else { copyFileSync(src, join(openclawDir, item)); }
    }
  }
  // 复制目录
  for (const dir of ['references', 'scripts', 'engine', 'exports', 'test', '.claude']) {
    const src = join(SKILL_DIR, dir);
    if (existsSync(src)) copyDir(src, join(openclawDir, dir));
  }
  console.log('✅ OpenClaw 部署完成');
  console.log('💡 重启 OpenClaw 会话后生效');
}

function deployCodex() {
  console.log('🎯 部署到 Codex CLI');
  // AGENTS.md 已存在，仅确认
  const agentsFile = join(SKILL_DIR, 'AGENTS.md');
  if (existsSync(agentsFile)) {
    console.log(`✅ AGENTS.md 已存在: ${agentsFile}`);
  }
  // Codex TOML agents
  const codexAgentsDir = join(SKILL_DIR, '.codex', 'agents');
  ensureDir(codexAgentsDir);
  const agentNames = ['plot-architect', 'character-designer', 'narrative-writer', 'consistency-checker', 'adaptation-specialist', 'ethics-reviewer'];
  for (const agent of agentNames) {
    const toml = `name = "${agent}"
description = "${SKILL_NAME} ${agent} agent"
developer_instructions = "You are the ${agent} agent for web novel writing. Load rules from SKILL.md and references/."
`;
    write(join(codexAgentsDir, `${agent}.toml`), toml);
  }
  console.log('✅ Codex agents 已写入');
}

function deployGeneric() {
  console.log('📋 通用部署说明：\n');
  console.log('  步骤 1：将整个目录复制到你的项目目录');
  console.log(`    ${SKILL_DIR} → /your/project/novel-skill/\n`);
  console.log('  步骤 2：在 AI 中加载 SKILL.md');
  console.log('    告诉 AI: "请加载 SKILL.md 和 references/ 目录作为创作参考"\n');
  console.log('  步骤 3：开始使用');
  console.log('    说 "帮我写个修仙爽文" → 极速创作');
  console.log('    说 "帮我把这段文字润色得更自然" → 自然度优化润色');
  console.log('    说 "拆解这部作品" → 拆书分析\n');
  console.log('  步骤 4：可选 - 质量检查');
  console.log('    python3 scripts/quality_check.py chapters/001.md\n');
}

console.log(`📦 部署 Skill: ${SKILL_NAME} v${VERSION}`);
console.log(`🎯 目标: ${target}${dryRun ? ' (dry-run)' : ''}\n`);

try {
  switch (target) {
    case 'claude': deployClaude(); break;
    case 'openclaw': deployOpenclaw(); break;
    case 'codex': deployCodex(); break;
    case 'generic': deployGeneric(); break;
    default:
      console.error(`❌ 未知目标: ${target}`);
      console.error('支持: claude | openclaw | codex | generic');
      process.exit(1);
  }
  console.log('\n✅ 部署完成！');
} catch (err) {
  console.error(`❌ 部署失败: ${err.message}`);
  process.exit(1);
}
