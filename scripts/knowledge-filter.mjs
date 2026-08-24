#!/usr/bin/env node
/**
 * knowledge-filter.mjs — 按模块/阶段/角色精确加载知识文件
 * 避免一次性加载全部 references 导致上下文浪费。
 *
 * 用法:
 *   node scripts/knowledge-filter.mjs --module A                 极速创作所需知识
 *   node scripts/knowledge-filter.mjs --module B --stage outline  签约创作大纲阶段
 *   node scripts/knowledge-filter.mjs --role narrative-writer     叙事写手所需知识
 *   node scripts/knowledge-filter.mjs --list                      列出全部知识文件
 *   node scripts/knowledge-filter.mjs --module C --json           JSON输出
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');
const REF_DIR = join(SKILL_ROOT, 'references');

// 模块 → 必需知识文件映射
const MODULE_MAP = {
  'A': { name: '极速创作', files: ['anti-ai-engine.md', 'hook-templates.md', 'sensory-library.md', 'emotion-recipes.md'] },
  'B': { name: '签约创作', files: ['anti-ai-engine.md', 'signing-standards.md', 'platform-guide.md', 'quality-metrics.md', 'rhythm-patterns.md', 'hook-templates.md'] },
  'C': { name: '润色优化', files: ['anti-ai-engine.md', 'platform-guide.md'] },
  'D': { name: '拆书分析', files: ['novel-deconstruction.md', 'rhythm-patterns.md', 'hook-templates.md'] },
  'E': { name: '风格蒸馏', files: ['style-distillation.md', 'anti-ai-engine.md', 'writer-styles-expanded.md'] },
  'F': { name: '作家仿写', files: ['writer-styles-expanded.md', 'signing-standards.md', 'anti-ai-engine.md'] },
  'G': { name: '续写衔接', files: ['anti-ai-engine.md', 'sensory-library.md', 'emotion-recipes.md'] },
  'H': { name: '诊断优化', files: ['quality-metrics.md', 'anti-ai-engine.md', 'platform-guide.md'] },
  'I': { name: '英文创作', files: ['english-creation.md', 'anti-ai-engine.md', 'language-guide.md'] },
  'J': { name: '跨媒体改编', files: ['cross-media-adaptation.md', 'ai-creation-ethics.md'] },
  'K': { name: 'AI伦理审查', files: ['ai-creation-ethics.md', 'legal-compliance.md', '2026-platform-trends.md'] }
};

// 签约创作子阶段 → 追加知识
const STAGE_MAP = {
  'market': ['2026-platform-trends.md', 'platform-guide.md'],
  'outline': ['hook-templates.md', 'rhythm-patterns.md'],
  'character': ['emotion-recipes.md', 'sensory-library.md'],
  'worldview': ['signing-standards.md', 'anti-ai-engine.md', 'platform-guide.md'],
  'writing': ['anti-ai-engine.md', 'sensory-library.md'],
  'qa': ['quality-metrics.md', 'anti-ai-engine.md']
};

// 角色 → 必需知识
const ROLE_MAP = {
  'plot-architect': ['rhythm-patterns.md', 'hook-templates.md', 'novel-deconstruction.md', 'signing-standards.md', 'emotion-recipes.md'],
  'character-designer': ['signing-standards.md', 'emotion-recipes.md', 'sensory-library.md', 'anti-ai-engine.md'],
  'narrative-writer': ['anti-ai-engine.md', 'sensory-library.md', 'hook-templates.md', 'emotion-recipes.md'],
  'consistency-checker': ['quality-metrics.md', 'signing-standards.md', 'anti-ai-engine.md'],
  'adaptation-specialist': ['cross-media-adaptation.md', 'ai-creation-ethics.md'],
  'ethics-reviewer': ['ai-creation-ethics.md', 'legal-compliance.md', '2026-platform-trends.md']
};

function listReferences() {
  if (!existsSync(REF_DIR)) return [];
  return readdirSync(REF_DIR).filter(f => f.endsWith('.md')).sort();
}

function resolveFiles(fileNames) {
  const all = listReferences();
  const loaded = [];
  const missing = [];
  for (const f of fileNames) {
    if (all.includes(f)) {
      const path = join(REF_DIR, f);
      let size = 0;
      try { size = readFileSync(path, 'utf8').length; } catch {}
      loaded.push({ file: f, path, size });
    } else {
      missing.push(f);
    }
  }
  return { loaded, missing };
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const list = args.includes('--list');

  if (list) {
    const all = listReferences();
    if (json) console.log(JSON.stringify({ references: all, count: all.length }, null, 2));
    else { console.log(`📚 知识库文件 (${all.length}):`); all.forEach(f => console.log(`  - ${f}`)); }
    return;
  }

  const moduleIdx = args.indexOf('--module');
  const stageIdx = args.indexOf('--stage');
  const roleIdx = args.indexOf('--role');

  const module = moduleIdx >= 0 ? args[moduleIdx + 1] : null;
  const stage = stageIdx >= 0 ? args[stageIdx + 1] : null;
  const role = roleIdx >= 0 ? args[roleIdx + 1] : null;

  let needed = new Set();
  let context = {};

  if (module && MODULE_MAP[module.toUpperCase()]) {
    context.module = MODULE_MAP[module.toUpperCase()].name;
    MODULE_MAP[module.toUpperCase()].files.forEach(f => needed.add(f));
  }
  if (stage && STAGE_MAP[stage]) {
    context.stage = stage;
    STAGE_MAP[stage].forEach(f => needed.add(f));
  }
  if (role && ROLE_MAP[role]) {
    context.role = role;
    ROLE_MAP[role].forEach(f => needed.add(f));
  }

  if (needed.size === 0) {
    console.error('用法: knowledge-filter.mjs --module <A-K> [--stage <stage>] [--role <role>] [--json] [--list]');
    console.error('模块: A-K | 阶段: market/outline/character/worldview/writing/qa | 角色: plot-architect/character-designer/narrative-writer/consistency-checker/adaptation-specialist/ethics-reviewer');
    process.exit(1);
  }

  const { loaded, missing } = resolveFiles([...needed]);
  const result = {
    context,
    loaded,
    missing,
    count: loaded.length,
    total_size: loaded.reduce((s, f) => s + f.size, 0)
  };

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`📚 知识加载 [${Object.entries(context).map(([k,v])=>`${k}=${v}`).join(', ')}]`);
    console.log(`   加载 ${loaded.length} 个文件, 共 ${result.total_size} 字`);
    loaded.forEach(f => console.log(`   ✅ ${f.file} (${f.size}字)`));
    if (missing.length > 0) {
      console.log(`   ⚠️ 缺失: ${missing.join(', ')}`);
    }
  }
}

main();
