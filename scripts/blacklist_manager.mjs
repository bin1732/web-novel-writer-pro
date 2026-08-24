#!/usr/bin/env node
/**
 * blacklist_manager.mjs — 自进化自然度优化动态黑名单管理（跨平台 Node.js）
 * 替代 blacklist_manager.sh，修复命令注入 + 跨平台兼容
 *
 * 用法:
 *   node scripts/blacklist_manager.mjs stats                  查看统计
 *   node scripts/blacklist_manager.mjs top [N]                查看TOP N高频命中
 *   node scripts/blacklist_manager.mjs add <词>               添加新词到动态库
 *   node scripts/blacklist_manager.mjs remove <词>            从动态库移除
 *   node scripts/blacklist_manager.mjs hit <词>               记录一次命中
 *   node scripts/blacklist_manager.mjs reset                  重置动态库
 *   node scripts/blacklist_manager.mjs check <文本|文件路径>   扫描文本
 *   node scripts/blacklist_manager.mjs evolve                 自进化（学习新AI模式）
 *   node scripts/blacklist_manager.mjs export [json|txt] [输出] 导出
 *   node scripts/blacklist_manager.mjs sync                   同步社区黑名单
 *   node scripts/blacklist_manager.mjs report                 进化报告
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

const DATA_DIR = process.env.SKILL_DIR ? join(process.env.SKILL_DIR, '.blacklist') : join(SKILL_ROOT, '.blacklist');
const STATIC_FILE = join(DATA_DIR, 'static.txt');
const DYNAMIC_FILE = join(DATA_DIR, 'dynamic.txt');
const HIT_LOG = join(DATA_DIR, 'hit_log.txt');
const RECENT_LOG = join(DATA_DIR, 'recent_scan.txt');

// 版本单一事实源：从 manifest.json 读取，避免升级时漏改硬编码版本
const VERSION = (() => {
  try {
    const manifestPath = join(SKILL_ROOT, 'manifest.json');
    if (existsSync(manifestPath)) {
      return JSON.parse(readFileSync(manifestPath, 'utf8')).version || 'unknown';
    }
  } catch {}
  return 'unknown';
})();

// 静态库初始内容（14大类核心禁用词，每行一类用 | 分隔，与anti-ai-engine.md对齐）
const STATIC_SEED = [
  '然而|因此|此外|综上所述|总而言之|总的来说',
  '值得注意的是|不可否认|毋庸置疑|显而易见',
  '首先|其次|最后|第一|第二|第三',
  '换言之|换而言之|换句话说|也就是说',
  '在一定程度上|某种程度上|从某种意义上说',
  '这体现了|这标志着|这反映了|这说明了',
  '不禁|不由|忍不住|情不自禁',
  '仿佛|好像|如同|宛如|犹如',
  '感到|觉得|意识到|注意到',
  '非常|极其|异常|十分|无比',
  '完全|绝对|一定|必然|肯定|所有|一切|任何',
  '价值|意义|本质|核心|关键|维度|层面|赋能|闭环|底层逻辑',
  '在当今|随着|众所周知|我们都知道',
  '真的|确实|实在|的确|其实|说实话|老实说'
].join('\n') + '\n';

function ensureData() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(STATIC_FILE)) writeFileSync(STATIC_FILE, STATIC_SEED, 'utf8');
  if (!existsSync(DYNAMIC_FILE)) writeFileSync(DYNAMIC_FILE, '', 'utf8');
  if (!existsSync(HIT_LOG)) writeFileSync(HIT_LOG, '', 'utf8');
}

function readLines(filePath) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function readStaticPatterns() {
  // 静态库每行用 | 分隔多个词
  return readLines(STATIC_FILE).flatMap(line => line.split('|').map(w => w.trim()).filter(Boolean));
}

function countLines(filePath) {
  return readLines(filePath).length;
}

function strictness(dynamicCount) {
  return dynamicCount < 50 ? '标准' : dynamicCount < 100 ? '较严格' : '严格';
}

function stats() {
  ensureData();
  const staticCount = readStaticPatterns().length;
  const dynamicCount = countLines(DYNAMIC_FILE);
  const totalHits = countLines(HIT_LOG);
  console.log('📊 黑名单统计');
  console.log(`  静态库词数: ${staticCount}`);
  console.log(`  动态库词数: ${dynamicCount}`);
  console.log(`  累计命中次数: ${totalHits}`);
  console.log(`  严格度: ${strictness(dynamicCount)}`);
}

function top(n) {
  if (!Number.isInteger(n) || n <= 0) { console.error('❌ 用法: blacklist_manager.mjs top <正整数>'); process.exit(1); }
  ensureData();
  const hits = readLines(HIT_LOG);
  if (hits.length === 0) { console.log('⚠️  无命中记录'); return; }
  const freq = {};
  for (const w of hits) freq[w] = (freq[w] || 0) + 1;
  const ranked = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n);
  console.log(`🏆 TOP ${n} 高频命中词`);
  for (const [w, c] of ranked) console.log(`  ${c}  ${w}`);
}

function add(word) {
  if (!word) { console.error('❌ 用法: blacklist_manager.mjs add <词>'); process.exit(1); }
  ensureData();
  const cleanWord = word.replace(/[\r\n]/g, '');
  appendFileSync(DYNAMIC_FILE, cleanWord + '\n', 'utf8');
  console.log(`✅ 已添加到动态库: ${cleanWord}`);
}

function remove(word) {
  if (!word) { console.error('❌ 用法: blacklist_manager.mjs remove <词>'); process.exit(1); }
  ensureData();
  const lines = readLines(DYNAMIC_FILE).filter(w => w !== word);
  writeFileSync(DYNAMIC_FILE, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');
  console.log(`✅ 已从动态库移除: ${word}`);
}

function hit(word) {
  if (!word) { console.error('❌ 用法: blacklist_manager.mjs hit <词>'); process.exit(1); }
  ensureData();
  const cleanWord = word.replace(/[\r\n]/g, '');
  appendFileSync(HIT_LOG, cleanWord + '\n', 'utf8');
}

function reset() {
  ensureData();
  writeFileSync(DYNAMIC_FILE, '', 'utf8');
  console.log('✅ 动态库已重置');
}

function loadText(arg) {
  // 若为文件路径则读取，否则视为文本
  if (existsSync(arg)) return readFileSync(arg, 'utf8');
  return arg;
}

function check(arg) {
  if (!arg) { console.error('❌ 用法: blacklist_manager.mjs check <文本|文件路径>'); process.exit(1); }
  ensureData();
  const text = loadText(arg);
  const staticPatterns = readStaticPatterns();
  const dynamicPatterns = readLines(DYNAMIC_FILE);
  console.log('🔍 扫描中...');
  let totalHits = 0;
  const found = [];
  for (const p of staticPatterns) {
    const count = countOccurrences(text, p);
    if (count > 0) {
      console.log(`  ❌ 命中: ${p} (${count}次)`);
      found.push({ word: p, count, type: 'static' });
      totalHits += count;
    }
  }
  for (const p of dynamicPatterns) {
    const count = countOccurrences(text, p);
    if (count > 0) {
      console.log(`  ⚠️ 动态命中: ${p} (${count}次)`);
      found.push({ word: p, count, type: 'dynamic' });
      totalHits += count;
    }
  }
  console.log(`  总命中: ${totalHits} 次`);
  // 追加记录命中词到 recent_scan 供 evolve 使用（累积多次扫描结果，evolve 后自动清空）
  const recentWords = found.map(f => f.word);
  const existingRecent = existsSync(RECENT_LOG) ? readLines(RECENT_LOG) : [];
  const merged = [...new Set([...existingRecent, ...recentWords])];
  writeFileSync(RECENT_LOG, merged.join('\n') + (merged.length ? '\n' : ''), 'utf8');
  // 同时累计到 hit_log
  for (const f of found) for (let i = 0; i < f.count; i++) appendFileSync(HIT_LOG, f.word + '\n', 'utf8');
}

function countOccurrences(text, pattern) {
  if (!pattern) return 0;
  let count = 0;
  let idx = text.indexOf(pattern);
  while (idx !== -1) { count++; idx = text.indexOf(pattern, idx + pattern.length); }
  return count;
}

function evolve() {
  ensureData();
  console.log('🧬 自进化：从最近扫描中学习新AI模式...');
  if (!existsSync(RECENT_LOG)) { console.log('⚠️  无最近扫描记录，请先使用 check 命令扫描文本'); return; }
  const recent = readLines(RECENT_LOG);
  if (recent.length === 0) { console.log('⚠️  无最近扫描记录，请先使用 check 命令扫描文本'); return; }
  const staticSet = new Set(readStaticPatterns());
  const dynamicSet = new Set(readLines(DYNAMIC_FILE));
  let newWords = 0;
  for (const word of recent) {
    if (!staticSet.has(word) && !dynamicSet.has(word)) {
      appendFileSync(DYNAMIC_FILE, word + '\n', 'utf8');
      console.log(`  🆕 新增: ${word}`);
      newWords++;
    }
  }
  console.log(`✅ 自进化完成，新增 ${newWords} 个动态规则`);
  writeFileSync(RECENT_LOG, '', 'utf8');
}

function exportData(format, output) {
  ensureData();
  format = format || 'json';
  output = output || join(DATA_DIR, `blacklist_export.${format}`);
  console.log(`📤 导出黑名单为 ${format} 格式...`);
  if (format === 'json') {
    const data = {
      static: readStaticPatterns(),
      dynamic: readLines(DYNAMIC_FILE),
      version: VERSION
    };
    writeFileSync(output, JSON.stringify(data, null, 2), 'utf8');
    console.log(`导出完成: ${output}`);
  } else if (format === 'txt') {
    let out = readFileSync(STATIC_FILE, 'utf8');
    out += '---DYNAMIC---\n';
    out += readLines(DYNAMIC_FILE).join('\n') + '\n';
    writeFileSync(output, out, 'utf8');
    console.log(`✅ 导出完成: ${output}`);
  } else {
    console.error('❌ 支持格式: json / txt');
    process.exit(1);
  }
}

function sync() {
  ensureData();
  console.log('🔄 同步社区黑名单...');
  const communityFile = join(DATA_DIR, 'community_sync.json');
  writeFileSync(communityFile, JSON.stringify({
    status: 'placeholder',
    message: '社区同步API尚未上线，请手动更新',
    updated_at: new Date().toISOString()
  }, null, 2), 'utf8');
  console.log('⚠️  社区同步功能尚未上线（预留接口）');
  console.log('  当前可使用: blacklist_manager.mjs add <词> 手动添加');
}

function report() {
  ensureData();
  const staticCount = readStaticPatterns().length;
  const dynamicCount = countLines(DYNAMIC_FILE);
  const totalHits = countLines(HIT_LOG);
  console.log('📊 黑名单进化报告');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  版本: ${VERSION}`);
  console.log(`  静态库词数: ${staticCount}`);
  console.log(`  动态库词数: ${dynamicCount}`);
  console.log(`  累计命中次数: ${totalHits}`);
  console.log(`  严格度: ${strictness(dynamicCount)}`);
  console.log('');
  console.log('📈 TOP 10 高频命中:');
  const hits = readLines(HIT_LOG);
  if (hits.length > 0) {
    const freq = {};
    for (const w of hits) freq[w] = (freq[w] || 0) + 1;
    Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .forEach(([w, c]) => console.log(`  ${c}  ${w}`));
  } else {
    console.log('  (无)');
  }
  console.log('');
  console.log('🧬 动态库最近添加:');
  const recent = readLines(DYNAMIC_FILE).slice(-10);
  if (recent.length > 0) recent.forEach(w => console.log(`  ${w}`));
  else console.log('  (空)');
  console.log('');
  console.log('💡 建议:');
  if (dynamicCount < 20) console.log('  动态库较少，建议使用 evolve 命令自动学习');
  if (dynamicCount >= 100) console.log('  动态库较多，建议检查是否有误添加的词');
  if (totalHits > 100) console.log('  命中次数较多，建议检查写作中的AI高频词使用');
}

function help() {
  console.log('用法:');
  console.log('  node blacklist_manager.mjs stats             查看统计');
  console.log('  node blacklist_manager.mjs top [N]           查看TOP N');
  console.log('  node blacklist_manager.mjs add <词>          添加');
  console.log('  node blacklist_manager.mjs remove <词>       移除');
  console.log('  node blacklist_manager.mjs hit <词>          记录命中');
  console.log('  node blacklist_manager.mjs reset             重置');
  console.log('  node blacklist_manager.mjs check <文本|文件> 扫描文本');
  console.log('  node blacklist_manager.mjs evolve            自进化（学习新AI模式）');
  console.log('  node blacklist_manager.mjs export [json|txt] [输出]  导出');
  console.log('  node blacklist_manager.mjs sync              同步社区黑名单');
  console.log('  node blacklist_manager.mjs report            进化报告');
}

// 主入口
const cmd = process.argv[2] || 'stats';
try {
  switch (cmd) {
    case 'stats': stats(); break;
    case 'top': top(parseInt(process.argv[3] || '10', 10)); break;
    case 'add': add(process.argv[3]); break;
    case 'remove': remove(process.argv[3]); break;
    case 'hit': hit(process.argv[3]); break;
    case 'reset': reset(); break;
    case 'check': check(process.argv[3]); break;
    case 'evolve': evolve(); break;
    case 'export': exportData(process.argv[3], process.argv[4]); break;
    case 'sync': sync(); break;
    case 'report': report(); break;
    case 'help':
    case '-h':
    case '--help': help(); break;
    default:
      console.error(`❌ 未知命令: ${cmd}`);
      help();
      process.exit(1);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
