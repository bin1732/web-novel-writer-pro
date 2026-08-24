#!/usr/bin/env node
/**
 * sop-timeliness-check.mjs — SOP 与参考文档时效性检查
 * 扫描 references/ 与 engine/ 中的 markdown，提取 sopMeta 元数据块，
 * 判断文档是否过期/即将过期/缺失元数据。
 *
 * sopMeta 格式（放在文档末尾）:
 *   <!-- sopMeta
 *   { "lastUpdate": "2026-01-15", "lastVerified": "2026-06-01", "verifyCycleDays": 90, "nextVerify": "2026-09-01" }
 *   -->
 *
 * 用法:
 *   node scripts/sop-timeliness-check.mjs                检查全部
 *   node scripts/sop-timeliness-check.mjs --dir references  仅检查某目录
 *   node scripts/sop-timeliness-check.mjs --json         JSON输出
 */
import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const jsonOut = args.includes('--json');
const dirIdx = args.indexOf('--dir');
const targetDir = dirIdx >= 0 ? args[dirIdx + 1] : null;

const SCAN_DIRS = targetDir ? [targetDir] : ['references', 'engine'];
const TODAY = new Date();

function parseSopMeta(content) {
  // 兼容未加引号的 key：{ lastUpdate: "..." } → { "lastUpdate": "..." }
  const blockMatch = content.match(/<!--\s*sopMeta\s*([\s\S]*?)-->/i);
  if (!blockMatch) return null;
  let body = blockMatch[1].trim();
  // 宽松修复：key 加引号
  body = body.replace(/(\{|\,)\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, (_, pre, key) => `${pre}"${key}":`);
  // 宽松修复：尾逗号
  body = body.replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(body); } catch { return { __malformed: true }; }
}

function parseDate(str) {
  if (!str || typeof str !== 'string') return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a, b) {
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const meta = parseSopMeta(content);
  const stat = statSync(filePath);
  const fileMtime = stat.mtime;

  if (!meta) {
    return { file: basename(filePath), status: 'missing-meta', mtime: fileMtime.toISOString().slice(0, 10) };
  }
  if (meta.__malformed) {
    return { file: basename(filePath), status: 'malformed-date', mtime: fileMtime.toISOString().slice(0, 10) };
  }

  const lastVerified = parseDate(meta.lastVerified);
  const cycle = meta.verifyCycleDays || 90;
  const nextVerify = parseDate(meta.nextVerify) || (lastVerified ? new Date(lastVerified.getTime() + cycle * 86400000) : null);

  if (!lastVerified) {
    return { file: basename(filePath), status: 'missing-meta', mtime: fileMtime.toISOString().slice(0, 10) };
  }

  let status = 'ok';
  if (nextVerify) {
    const diff = daysBetween(TODAY, nextVerify);
    if (diff < 0) status = 'overdue';
    else if (diff < 14) status = 'due-soon';
  }

  return {
    file: basename(filePath),
    status,
    lastUpdate: meta.lastUpdate || null,
    lastVerified: meta.lastVerified,
    nextVerify: nextVerify ? nextVerify.toISOString().slice(0, 10) : null,
    cycleDays: cycle
  };
}

function basename(p) { return p.split(/[/\\]/).pop(); }

function collectMd(dir) {
  const abs = resolve(SKILL_ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter(f => f.endsWith('.md'))
    .map(f => join(abs, f));
}

function main() {
  const files = SCAN_DIRS.flatMap(collectMd);
  const results = files.map(checkFile);

  const summary = {
    ok: results.filter(r => r.status === 'ok').length,
    'due-soon': results.filter(r => r.status === 'due-soon').length,
    overdue: results.filter(r => r.status === 'overdue').length,
    'missing-meta': results.filter(r => r.status === 'missing-meta').length,
    'malformed-date': results.filter(r => r.status === 'malformed-date').length
  };

  const output = { date: TODAY.toISOString().slice(0, 10), scanned: results.length, summary, results };

  if (jsonOut) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`📋 SOP 时效性检查 (${output.date})`);
    console.log(`   扫描 ${results.length} 个文档\n`);
    console.log('   汇总:');
    console.log(`     ✅ ok: ${summary.ok}`);
    console.log(`     ⏰ due-soon: ${summary['due-soon']}`);
    console.log(`     ❌ overdue: ${summary.overdue}`);
    console.log(`     ⚠️ missing-meta: ${summary['missing-meta']}`);
    console.log(`     🔧 malformed: ${summary['malformed-date']}`);
    console.log('');
    for (const r of results) {
      const icon = r.status === 'ok' ? '✅' : r.status === 'due-soon' ? '⏰' : r.status === 'overdue' ? '❌' : r.status === 'missing-meta' ? '⚠️' : '🔧';
      let line = `   ${icon} ${r.file} [${r.status}]`;
      if (r.lastVerified) line += ` (lastVerified: ${r.lastVerified}, nextVerify: ${r.nextVerify})`;
      else if (r.mtime) line += ` (mtime: ${r.mtime})`;
      console.log(line);
    }
  }

  // 非零退出码：有 overdue 或 malformed
  const hasIssue = summary.overdue > 0 || summary['malformed-date'] > 0;
  process.exit(hasIssue ? 1 : 0);
}

main();
