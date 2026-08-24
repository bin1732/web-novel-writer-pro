#!/usr/bin/env node
/**
 * smoke-test.mjs — 网文小说签约专家 1.0.3 冒烟测试
 * 全量覆盖：文件结构/元数据一致性/脚本语法/功能验证/引用一致性
 *
 * 用法: node test/smoke-test.mjs
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, unlinkSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

let pass = 0, fail = 0;
const failures = [];

function assert(name, cond) {
  if (cond) { pass++; }
  else { fail++; failures.push(name); console.log(`  ❌ ${name}`); }
}

function exists(rel) { return existsSync(join(SKILL_ROOT, rel)); }
function read(rel) { return readFileSync(join(SKILL_ROOT, rel), 'utf8'); }

function runNode(scriptRel, args = []) {
  try {
    const out = execFileSync('node', [join(SKILL_ROOT, scriptRel), ...args], {
      encoding: 'utf8', timeout: 15000, cwd: SKILL_ROOT
    });
    return { ok: true, out, code: 0 };
  } catch (e) {
    return { ok: false, out: e.stdout || '', code: e.status, err: e.message };
  }
}

function runPython(scriptRel, args = []) {
  // 依序尝试 python3 / python。Windows 上 python3 可能是无效的商店别名
  // （App Execution Alias stub，退出码 9009 或输出 "Python was not found"），
  // 启动失败时回退到 python，保证各环境可运行。
  for (const cmd of ['python3', 'python']) {
    try {
      const out = execFileSync(cmd, [join(SKILL_ROOT, scriptRel), ...args], {
        encoding: 'utf8', timeout: 15000, cwd: SKILL_ROOT
      });
      return { ok: true, out, code: 0 };
    } catch (e) {
      // 解释器无法启动（不存在/别名无效/系统错误）→ 换下一个
      const launchFailed =
        e.code === 'ENOENT' || e.code === 'EACCES' || e.status === undefined ||
        e.status > 0x10000000 || e.status === 9009 ||
        /was not found|not recognized|not installed|No such file|No Python|Manage App Execution Aliases/i
          .test(`${e.stderr || ''}${e.message || ''}`);
      if (launchFailed) {
        continue;
      }
      // 脚本正常执行但返回非零退出码（如检测不通过）→ 返回结果（含stdout）
      return { ok: false, out: e.stdout || '', err: e.stderr || '', code: e.status };
    }
  }
  return { ok: false, out: '', err: 'python3/python 均不可用', code: null };
}

console.log('═══════════════════════════════════════');
console.log('🧪 网文小说签约专家 1.0.3 冒烟测试');
console.log('═══════════════════════════════════════\n');

// ========== 1. 文件结构 ==========
console.log('📦 1. 文件结构');
const mustExist = [
  'SKILL.md', 'AGENTS.md', 'CHANGELOG.md', 'manifest.json', '_meta.json',
  'scripts/quality_check.py', 'scripts/adaptation_converter.py',
  'scripts/state.mjs', 'scripts/blacklist_manager.mjs', 'scripts/deploy.mjs',
  'scripts/knowledge-filter.mjs', 'scripts/sop-timeliness-check.mjs',
  'engine/execution-protocol.md', 'engine/evolution-protocol.md',
  'engine/anti-hallucination.md', 'engine/expert-panel.md',
  'engine/market-validation.md',
  'references/anti-ai-engine.md', 'references/platform-guide.md',
  'references/signing-standards.md', 'references/2026-platform-trends.md',
  'references/ai-creation-ethics.md', 'references/cross-media-adaptation.md',
  'references/legal-compliance.md',
  'test/smoke-test.mjs', 'exports/README.md'
];
for (const f of mustExist) {
  assert(`存在 ${f}`, exists(f));
}

// .sh 不应存在
const mustNotExist = [
  'scripts/state.sh', 'scripts/blacklist_manager.sh',
  'scripts/deploy.sh', 'scripts/quality_check.sh',
  'LICENSE', 'scripts/__pycache__'
];
for (const f of mustNotExist) {
  assert(`不存在 ${f}`, !exists(f));
}
console.log('');

// ========== 2. 元数据一致性 ==========
console.log('📋 2. 元数据一致性');
const manifest = JSON.parse(read('manifest.json'));
const meta = JSON.parse(read('_meta.json'));
const skillContent = read('SKILL.md');

assert('manifest.json version=1.0.3', manifest.version === '1.0.3');
assert('_meta.json version=1.0.3', meta.version === '1.0.3');
assert('SKILL.md frontmatter version=1.0.3', /version:\s*1\.0\.3/.test(skillContent));
assert('SKILL.md 标题含1.0.3', /网文小说签约专家 1\.0\.3/.test(skillContent));
assert('manifest 脚本数=7', manifest.scripts.length === 7);
assert('manifest Agent数=6', manifest.agents.length === 6);
assert('manifest 模块数=11', manifest.modules.length === 11);
assert('_meta.json 无license', meta.license === null);
assert('manifest 无license字段', manifest.license === null || manifest.license === undefined);

// 三方 tags 一致性：manifest.tags == _meta.json.openclaw.tags == SKILL.md frontmatter tags == SKILL.md metadata.openclaw.tags
const skillFrontmatterTags = (skillContent.match(/^tags: \[(.*?)\]/m) || [])[1]?.split(/,\s*/).map(t => t.trim().replace(/^\[|\]$/g, '')) || [];
const skillMetaTags = (skillContent.match(/^    tags: \[(.*?)\]/m) || [])[1]?.split(/,\s*/).map(t => t.trim().replace(/^\[|\]$/g, '')) || [];
const manifestTags = manifest.tags || [];
const metaOpenclawTags = meta.openclaw?.tags || [];
assert('tags: manifest=12', manifestTags.length === 12);
assert('tags: _meta.openclaw=12', metaOpenclawTags.length === 12);
assert('tags: SKILL.md frontmatter=12', skillFrontmatterTags.length === 12);
assert('tags: SKILL.md metadata.openclaw=12', skillMetaTags.length === 12);
assert('tags: manifest==_meta.openclaw', JSON.stringify(manifestTags) === JSON.stringify(metaOpenclawTags));
assert('tags: manifest==SKILL.md frontmatter', JSON.stringify(manifestTags) === JSON.stringify(skillFrontmatterTags));
assert('tags: manifest==SKILL.md metadata.openclaw', JSON.stringify(manifestTags) === JSON.stringify(skillMetaTags));
console.log('');

// ========== 3. 脚本语法检查 ==========
console.log('🔧 3. 脚本语法检查');

// .mjs 语法：用 node --check
const mjsScripts = ['scripts/state.mjs', 'scripts/blacklist_manager.mjs', 'scripts/deploy.mjs',
  'scripts/knowledge-filter.mjs', 'scripts/sop-timeliness-check.mjs'];
for (const s of mjsScripts) {
  try {
    execFileSync('node', ['--check', join(SKILL_ROOT, s)], { encoding: 'utf8', timeout: 10000 });
    assert(`语法OK ${s}`, true);
  } catch {
    assert(`语法OK ${s}`, false);
  }
}

// .py 语法：用 ast.parse（不产生 __pycache__）
for (const s of ['scripts/quality_check.py', 'scripts/adaptation_converter.py']) {
  try {
    execFileSync('python3', ['-c', `import ast; ast.parse(open(r'${join(SKILL_ROOT, s)}', encoding='utf-8').read())`], { encoding: 'utf8', timeout: 10000 });
    assert(`语法OK ${s}`, true);
  } catch {
    try {
      execFileSync('python', ['-c', `import ast; ast.parse(open(r'${join(SKILL_ROOT, s)}', encoding='utf-8').read())`], { encoding: 'utf8', timeout: 10000 });
      assert(`语法OK ${s}`, true);
    } catch {
      assert(`语法OK ${s}`, false);
    }
  }
}
console.log('');

// ========== 4. .mjs 脚本功能验证 ==========
console.log('⚙️ 4. 脚本功能验证');

// blacklist_manager.mjs stats
let r = runNode('scripts/blacklist_manager.mjs', ['stats']);
assert('blacklist stats 正常运行', r.ok && r.out.includes('黑名单统计'));
assert('blacklist 静态库词数>0', r.out.includes('静态库词数:') && !/静态库词数:\s*0/.test(r.out));

// blacklist_manager.mjs report
r = runNode('scripts/blacklist_manager.mjs', ['report']);
assert('blacklist report 正常运行', r.ok && r.out.includes('进化报告'));
assert('blacklist report 版本与manifest一致', r.ok && r.out.includes(`版本: ${manifest.version}`));

// blacklist_manager.mjs hit / evolve / sync / export / reset / top 参数校验
r = runNode('scripts/blacklist_manager.mjs', ['hit', '测试命中词']);
assert('blacklist hit 正常运行', r.ok);
r = runNode('scripts/blacklist_manager.mjs', ['evolve']);
assert('blacklist evolve 正常运行（无记录时提示不崩溃）', r.ok || (r.err && r.err.includes('无最近扫描记录')));
r = runNode('scripts/blacklist_manager.mjs', ['sync']);
assert('blacklist sync 预留接口正常运行', r.ok && r.out.includes('尚未上线'));
const blacklistExportPath = join(SKILL_ROOT, 'test', '.tmp_blacklist_export.json');
r = runNode('scripts/blacklist_manager.mjs', ['export', 'json', blacklistExportPath]);
assert('blacklist export json 正常运行', r.ok && existsSync(blacklistExportPath));
if (existsSync(blacklistExportPath)) {
  try {
    const bd = JSON.parse(readFileSync(blacklistExportPath, 'utf8'));
    assert('blacklist export 版本与manifest一致', bd.version === manifest.version);
  } catch { assert('blacklist export JSON可解析', false); }
  unlinkSync(blacklistExportPath);
}
r = runNode('scripts/blacklist_manager.mjs', ['reset']);
assert('blacklist reset 正常运行', r.ok);
r = runNode('scripts/blacklist_manager.mjs', ['top', 'abc']);
assert('blacklist top 非法参数报错', !r.ok);

// state.mjs 用户偏好记忆层
const prefTestDir = join(SKILL_ROOT, 'test', '.tmp_pref_proj');
r = runNode('scripts/state.mjs', ['set-pref', prefTestDir, 'pacing', '快节奏']);
assert('state set-pref 正常运行', r.ok && r.out.includes('已记录偏好'));
r = runNode('scripts/state.mjs', ['get-pref', prefTestDir, 'pacing']);
assert('state get-pref 读取正常', r.ok && r.out.includes('快节奏'));
r = runNode('scripts/state.mjs', ['set-pref', prefTestDir, '1badkey', 'x']);
assert('state set-pref 非法键拒绝', !r.ok);
if (existsSync(prefTestDir)) rmSync(prefTestDir, { recursive: true, force: true });

// state.mjs help
r = runNode('scripts/state.mjs', ['help']);
assert('state help 正常运行', r.ok && r.out.includes('用法'));

// deploy.mjs --dry-run generic
r = runNode('scripts/deploy.mjs', ['--dry-run', 'generic']);
assert('deploy --dry-run generic 正常运行', r.ok && r.out.includes('通用部署'));

// deploy.mjs --dry-run claude
r = runNode('scripts/deploy.mjs', ['--dry-run', 'claude']);
assert('deploy --dry-run claude 正常运行', r.ok && r.out.includes('Claude Code'));
assert('deploy 输出版本与manifest一致', r.ok && r.out.includes(`v${manifest.version}`));

// knowledge-filter.mjs --module A
r = runNode('scripts/knowledge-filter.mjs', ['--module', 'A', '--json']);
assert('knowledge-filter module A 正常运行', r.ok);
if (r.ok) {
  try {
    const data = JSON.parse(r.out);
    assert('knowledge-filter module A 加载文件数>0', data.count > 0);
    assert('knowledge-filter module A 含 anti-ai-engine.md', data.loaded.some(x => x.file === 'anti-ai-engine.md'));
  } catch { assert('knowledge-filter module A JSON可解析', false); }
}

// knowledge-filter.mjs --module B --stage outline
r = runNode('scripts/knowledge-filter.mjs', ['--module', 'B', '--stage', 'outline', '--json']);
assert('knowledge-filter module B stage outline 正常运行', r.ok);
if (r.ok) {
  try {
    const data = JSON.parse(r.out);
    assert('knowledge-filter B+outline 含 hook-templates.md', data.loaded.some(x => x.file === 'hook-templates.md'));
  } catch { assert('knowledge-filter B+outline JSON可解析', false); }
}

// knowledge-filter.mjs --role narrative-writer
r = runNode('scripts/knowledge-filter.mjs', ['--role', 'narrative-writer', '--json']);
assert('knowledge-filter role narrative-writer 正常运行', r.ok);
if (r.ok) {
  try {
    const data = JSON.parse(r.out);
    assert('knowledge-filter role narrative-writer 加载>0', data.count > 0);
  } catch { assert('knowledge-filter role JSON可解析', false); }
}

// knowledge-filter.mjs --list
r = runNode('scripts/knowledge-filter.mjs', ['--list', '--json']);
assert('knowledge-filter --list 正常运行', r.ok);
if (r.ok) {
  try {
    const data = JSON.parse(r.out);
    assert('knowledge-filter --list count>10', data.count > 10);
  } catch { assert('knowledge-filter --list JSON可解析', false); }
}

// sop-timeliness-check.mjs
r = runNode('scripts/sop-timeliness-check.mjs', ['--json']);
assert('sop-timeliness-check 正常运行', r.ok);
if (r.ok) {
  try {
    const data = JSON.parse(r.out);
    assert('sop-timeliness 扫描文档数>15', data.scanned > 15);
    assert('sop-timeliness 有ok状态文档', data.summary.ok > 0);
    assert('sop-timeliness 无malformed', data.summary['malformed-date'] === 0);
    // 不要求 overdue=0（取决于运行日期），但当前应无 overdue
  } catch { assert('sop-timeliness JSON可解析', false); }
}
console.log('');

// ========== 5. Python 脚本功能验证 ==========
console.log('🐍 5. Python 脚本功能验证');

// quality_check.py 无参应提示用法（argparse 输出到 stderr）
r = runPython('scripts/quality_check.py', []);
assert('quality_check 无参提示用法', r.out.includes('用法') || r.out.includes('usage') || r.err?.includes('用法') || r.err?.includes('usage'));

// adaptation_converter.py 无参应提示用法（argparse）
r = runPython('scripts/adaptation_converter.py', []);
assert('adaptation_converter 无参报错退出', !r.ok);

// quality_check.py 功能测试：用样例章节文件检测
const sampleChapterPath = join(SKILL_ROOT, 'test', '.tmp_sample_chapter.md');
const sampleChapter = `陈默推开门。走廊很暗。

"你来了。"角落里传来声音。

他循声看去。一个穿灰外套的男人坐在台阶上，手里转着打火机。火苗忽明忽暗，照出一张棱角分明的脸。

"东西呢？"陈默问。

灰外套男人没立刻回答。打火机合上了，又打开，又合上。咔嚓。咔嚓。

"急什么。"他终于开口，声音有点哑，"坐。"

陈默没坐。他靠在墙上，摸出烟盒。空的。他把空盒子捏扁，扔进角落的垃圾桶里。桶里已经有七八个空烟盒了。

"最后一次。"灰外套男人站起来，从口袋里掏出一个U盘，"看完就删。别拷。别传。"

陈默接过来。U盘还带着体温。

"为什么是我？"

灰外套男人走到门口，回头看了他一眼。走廊的灯终于亮了，惨白惨白的。

"因为你还欠我一条命。"

门关上了。走廊的灯又灭了。陈默站在原地，U盘攥在手心里，塑料外壳被捏得咯吱响。

他笑了。不是开心的笑。是那种发现自己又被人算计了、但偏偏还不能翻脸的笑。

行吧。命还债，天经地义。`;
writeFileSync(sampleChapterPath, sampleChapter, 'utf8');

r = runPython('scripts/quality_check.py', [sampleChapterPath, '--json']);
// quality_check.py 检测不通过时退出码为1，但仍输出JSON到stdout
const checkOut = r.ok ? r.out : (r.out || '');
assert('quality_check 样例文件检测正常运行', checkOut.length > 0);
if (checkOut.length > 0) {
  try {
    const data = JSON.parse(checkOut);
    assert('quality_check 输出含字数检查', data.checks && '字数' in data.checks);
    assert('quality_check 输出含AI痕迹评分', 'ai_score' in data);
    assert('quality_check 输出含对话占比', '对话占比' in data.checks);
  } catch { assert('quality_check JSON可解析', false); }
}

// adaptation_converter.py 功能测试：短剧改编
r = runPython('scripts/adaptation_converter.py', ['short-drama', '-i', sampleChapterPath]);
assert('adaptation_converter short-drama 正常运行', r.ok && r.out.includes('短剧剧本'));

// adaptation_converter.py 功能测试：游戏改编
r = runPython('scripts/adaptation_converter.py', ['game', '-i', sampleChapterPath]);
assert('adaptation_converter game 正常运行', r.ok && r.out.includes('叙事游戏'));

// 清理临时文件
try { unlinkSync(sampleChapterPath); } catch {}
console.log('');

// ========== 6. 引用一致性（无 .sh 残留） ==========
console.log('🔗 6. 引用一致性');

// 用户面向文件不应含 .sh 命令调用（docs/ 历史档案除外）
const userFacingDirs = ['references', 'engine', 'exports'];
const userFacingFiles = ['SKILL.md', 'AGENTS.md', 'CHANGELOG.md'];
const checkFiles = [...userFacingFiles];
for (const d of userFacingDirs) {
  const dirPath = join(SKILL_ROOT, d);
  if (existsSync(dirPath)) {
    for (const f of readdirSync(dirPath)) {
      if (f.endsWith('.md')) checkFiles.push(join(d, f));
    }
  }
}

for (const f of checkFiles) {
  const content = read(f);
  // 检查是否有 bash scripts/xxx.sh 或 node scripts/xxx.sh 这类调用
  // 允许在 CHANGELOG/docs 中出现 .sh 文件名（历史描述），但不允许 "bash scripts/xxx.sh" 或 "scripts/xxx.sh <命令>" 这类调用指令
  const hasShCall = /(?:bash|sh)\s+scripts\/\w+\.sh/.test(content);
  assert(`${f} 无 .sh 调用`, !hasShCall);
}

// platform-guide.md 平台数 = 11
const platformGuide = read('references/platform-guide.md');
const platformHeaders = platformGuide.match(/^### .+ — /gm) || [];
assert('platform-guide 含11个平台小节', platformHeaders.length === 11);
assert('platform-guide 含盐言故事', platformGuide.includes('盐言故事'));
assert('platform-guide 含抖音故事', platformGuide.includes('抖音故事'));
assert('platform-guide 含快手短剧', platformGuide.includes('快手短剧'));
assert('platform-guide 不含"8大平台"', !platformGuide.includes('8大平台'));
assert('platform-guide 含"11大平台"', platformGuide.includes('11大平台'));

// SKILL.md 平台数一致
assert('SKILL.md 含11平台', skillContent.includes('11大中文平台') || skillContent.includes('11个'));
assert('SKILL.md 不含"8平台"', !/查看8平台/.test(skillContent));
console.log('');

// ========== 7. engine/ 协议完整性 ==========
console.log('🛡️ 7. engine 协议完整性');
const engineFiles = {
  'engine/execution-protocol.md': ['三层', '降级', '环境验证'],
  'engine/evolution-protocol.md': ['自进化', '误报', '趋势'],
  'engine/anti-hallucination.md': ['幻觉', '不确定', '硬编码', '置信度', '事实核查'],
  'engine/expert-panel.md': ['否决', 'Veto', '优先级', '资深专家', '全程介入'],
  'engine/market-validation.md': ['溯源', '验证', '时效']
};
for (const [f, keywords] of Object.entries(engineFiles)) {
  const content = read(f);
  for (const kw of keywords) {
    assert(`${f} 含关键词"${kw}"`, content.includes(kw));
  }
}
console.log('');

// ========== 8. sopMeta 时效块 ==========
console.log('📅 8. sopMeta 时效块');
const timeSensitiveFiles = [
  'references/platform-guide.md',
  'references/2026-platform-trends.md',
  'references/anti-ai-engine.md',
  'references/ai-creation-ethics.md',
  'references/legal-compliance.md'
];
for (const f of timeSensitiveFiles) {
  const content = read(f);
  assert(`${f} 含 sopMeta 块`, /<!--\s*sopMeta/.test(content));
}
console.log('');

// ========== 9. Agent 文件完整性 ==========
console.log('🤖 9. Agent 文件完整性');
const agents = ['plot-architect', 'character-designer', 'narrative-writer',
  'consistency-checker', 'adaptation-specialist', 'ethics-reviewer'];
for (const a of agents) {
  assert(`存在 agent ${a}.md`, exists(`.claude/agents/${a}.md`));
}
console.log('');

// ========== 10. 审视回归项 ==========
console.log('🔬 10. 审视回归项');

// 支柱数一致：SKILL.md 用"七大支柱"，不含"六大支柱"
assert('SKILL.md 用七大支柱', skillContent.includes('七大支柱'));
assert('SKILL.md 不含六大支柱', !skillContent.includes('六大支柱'));
assert('anti-ai-engine 用七大支柱', read('references/anti-ai-engine.md').includes('七大支柱'));

// exports 版本号统一 1.0.3（无 1.0.2/1.0.1 残留）
const exportFiles = ['chatgpt-instructions.md', 'deepseek-system-prompt.md',
  'gemini-instructions.md', 'kimi-instructions.md', 'README.md'];
for (const f of exportFiles) {
  const content = read(`exports/${f}`);
  assert(`exports/${f} 含1.0.3`, content.includes('1.0.3'));
  assert(`exports/${f} 不含1.0.1`, !content.includes('1.0.1'));
  assert(`exports/${f} 不含1.0.2`, !content.includes('1.0.2'));
}

// 不引用不存在的 generic-instructions.md
assert('README 不引用 generic-instructions.md', !read('exports/README.md').includes('generic-instructions.md'));

// knowledge-filter 所有模块映射的文件都存在
for (const m of ['A','B','C','D','E','F','G','H','I','J','K']) {
  const r = runNode('scripts/knowledge-filter.mjs', ['--module', m, '--json']);
  if (r.ok) {
    try {
      const data = JSON.parse(r.out);
      assert(`knowledge-filter 模块${m} 无缺失文件`, data.missing.length === 0);
    } catch { assert(`knowledge-filter 模块${m} JSON可解析`, false); }
  } else {
    assert(`knowledge-filter 模块${m} 正常运行`, false);
  }
}

// CHANGELOG 含1.0.3 rev7 条目
assert('CHANGELOG 含1.0.3 rev7', read('CHANGELOG.md').includes('## 1.0.3 rev7'));

// references 当前版本文件无 1.0.2 残留
for (const f of ['2026-platform-trends.md', 'ai-creation-ethics.md', 'cross-media-adaptation.md',
  'legal-compliance.md', 'writer-styles-expanded.md', 'beginner-guide.md']) {
  assert(`references/${f} 不含1.0.2`, !read(`references/${f}`).includes('1.0.2'));
}
// 脚本无硬编码版本（单一事实源）
assert('deploy.mjs 无硬编码1.0.2', !read('scripts/deploy.mjs').includes("'1.0.2'"));
assert('blacklist_manager.mjs 无硬编码1.0.2', !read('scripts/blacklist_manager.mjs').includes("'1.0.2'"));

// static.txt 含14类AI高频词（与anti-ai-engine.md对齐）
// 顺序加固：独立触发 blacklist_manager stats，确保 .blacklist/static.txt 存在（不依赖其他测试段落执行顺序）
r = runNode('scripts/blacklist_manager.mjs', ['stats']);
assert('blacklist stats 前置确保数据目录', r.ok);
const staticTxtPath = join(SKILL_ROOT, '.blacklist/static.txt');
assert('存在 .blacklist/static.txt', existsSync(staticTxtPath));
let staticTxt = '';
try { staticTxt = readFileSync(staticTxtPath, 'utf8'); } catch { staticTxt = ''; }
const staticLines = staticTxt.split(/\r?\n/).filter(l => l.trim());
assert('static.txt 含14行AI高频词', staticLines.length === 14);
assert('static.txt 含绝对化表述', staticTxt.includes('完全|绝对'));
assert('static.txt 含抽象名词', staticTxt.includes('价值|意义|本质'));
assert('static.txt 含模板化开头', staticTxt.includes('在当今|随着'));
assert('static.txt 含无效强调', staticTxt.includes('真的|确实|实在'));

// 代码修复回归项
const antiAiEngine = read('references/anti-ai-engine.md');
assert('anti-ai-engine 含"文风一致性偏低"门控', antiAiEngine.includes('文风一致性偏低'));
const legalComp = read('references/legal-compliance.md');
assert('legal-compliance AI生成大纲为"高风险"', legalComp.includes('AI生成完整大纲后人工写正文 | 🔴 高风险'));
assert('legal-compliance 不含AI生成大纲"中风险"', !legalComp.includes('AI生成完整大纲后人工写正文 | 🟡 中风险'));
const antiHalluc = read('engine/anti-hallucination.md');
assert('anti-hallucination 用"平台分成模式"非"平台分成比例"', antiHalluc.includes('平台分成模式') && !antiHalluc.includes('平台分成比例'));
assert('SKILL.md 章节编号无重复"十五"', (skillContent.match(/## 十五、/g) || []).length === 1);
assert('SKILL.md 含"十六、版本更新日志"', skillContent.includes('十六、版本更新日志'));

// SKILL.md 引用的所有 references/engine 文件必须存在（防误删）
const skillRefLinks = [...new Set([
  ...(skillContent.match(/references\/[\w-]+\.md/g) || []),
  ...(skillContent.match(/engine\/[\w-]+\.md/g) || []),
  ...(skillContent.match(/scripts\/[\w.-]+\.mjs/g) || []),
  ...(skillContent.match(/scripts\/[\w.-]+\.py/g) || [])
])];
for (const link of skillRefLinks) {
  assert(`SKILL.md 引用存在 ${link}`, exists(link));
}

// _meta.json updated_at 必须与 CHANGELOG rev7 日期一致（元数据一致性）
const rev7DateMatch = read('CHANGELOG.md').match(/## 1\.0\.3 rev7 — (\d{4}-\d{2}-\d{2})/);
assert('CHANGELOG rev7 日期可解析', !!rev7DateMatch);
if (rev7DateMatch) {
  assert('_meta.json updated_at 与 CHANGELOG rev7 一致', meta.updated_at === rev7DateMatch[1]);
}

// ========== 11. 内容规范合规 ==========
console.log('🛡️ 11. 内容规范合规');

// anti-ai-engine.md 支柱六已重构
const antiAiContent = read('references/anti-ai-engine.md');
assert('anti-ai-engine 含"写作自然度自检"', antiAiContent.includes('写作自然度自检'));
assert('anti-ai-engine 不含"检测对抗"', !antiAiContent.includes('检测对抗'));
assert('anti-ai-engine 不含"100%过AI检测"', !antiAiContent.includes('100%过AI检测'));
assert('anti-ai-engine 不含"实测100%"', !antiAiContent.includes('实测100%'));
assert('anti-ai-engine 不含"对抗策略"', !antiAiContent.includes('对抗策略'));
assert('anti-ai-engine 含"叙事指纹一致性策略"', antiAiContent.includes('叙事指纹一致性策略'));

// SKILL.md 支柱六已重构
assert('SKILL.md 含"写作自然度自检"', skillContent.includes('写作自然度自检'));
assert('SKILL.md 不含"检测对抗"', !skillContent.includes('检测对抗'));

// 反幻觉：无虚构资历与战绩
assert('SKILL.md 无虚构"15年经验"', !skillContent.includes('15年经验'));
assert('SKILL.md 无虚构"500+作者"', !skillContent.includes('500+作者'));
assert('SKILL.md 含"多专家模拟评审"', skillContent.includes('多专家模拟评审'));
assert('chatgpt-instructions 无虚构15年经验', !read('exports/chatgpt-instructions.md').includes('15年经验'));
assert('kimi-instructions 无虚构15年经验', !read('exports/kimi-instructions.md').includes('15年经验'));

// 数字一致性：作家数量 / 中文平台数 / 英文平台数全库统一
const exportsChatgpt = read('exports/chatgpt-instructions.md');
const exportsKimi = read('exports/kimi-instructions.md');
const exportsDeepseek = read('exports/deepseek-system-prompt.md');
const exportsGemini = read('exports/gemini-instructions.md');
const beginnerGuide = read('references/beginner-guide.md');
assert('beginner-guide 无"100+位作家"', !beginnerGuide.includes('100+位作家'));
assert('beginner-guide 无夸大"80+位"', !beginnerGuide.includes('80+位'));
assert('beginner-guide 含精确"66位"', beginnerGuide.includes('66位'));
assert('beginner-guide 无"8大中文平台"', !beginnerGuide.includes('8大中文平台'));
assert('beginner-guide 含"11大中文平台"', beginnerGuide.includes('11大中文平台'));
assert('exports 英文平台统一为3大', [exportsChatgpt, exportsKimi, exportsDeepseek, exportsGemini].every(s => s.includes('3大英文平台') && !s.includes('Meganovel')));

// english-creation.md 已重构
const englishContent = read('references/english-creation.md');
assert('english-creation 不含"Anti-Detection"', !englishContent.includes('Anti-Detection'));
assert('english-creation 含"Natural Writing Strategy"', englishContent.includes('Natural Writing Strategy'));
assert('english-creation 英文平台统一为3大', !englishContent.includes('Meganovel') && englishContent.includes('3大英文平台'));

// 附录顺序：F在G前，G在H前
const appF = antiAiContent.indexOf('附录F');
const appG = antiAiContent.indexOf('附录G');
const appH = antiAiContent.indexOf('附录H');
assert('anti-ai-engine 附录F在G前', appF < appG);
assert('anti-ai-engine 附录G在H前', appG < appH);

// 全库无"规避检测"等对抗性表述（CHANGELOG/docs 历史文档除外）
const allUserFacingFiles = checkFiles.filter(f => f !== 'CHANGELOG.md');
for (const f of allUserFacingFiles) {
  const content = read(f);
  assert(`${f} 不含"规避检测"`, !content.includes('规避检测'));
  assert(`${f} 不含"检测对抗"`, !content.includes('检测对抗'));
}
console.log('');

// ========== 12. 四大核心能力保障 ==========
console.log('🎯 12. 四大核心能力保障');

// 12.1 市场验证
const marketValidation = read('engine/market-validation.md');
assert('market-validation 含"溯源"', marketValidation.includes('溯源'));
assert('market-validation 含"L1"层级', marketValidation.includes('L1'));
assert('market-validation 含数据溯源标准', marketValidation.includes('数据溯源') || marketValidation.includes('溯源标准'));
assert('market-validation 含验证方法论', marketValidation.includes('验证') && marketValidation.includes('方法'));

// 12.2 多专家模拟评审全程协助
const expertPanel = read('engine/expert-panel.md');
assert('expert-panel 含"资深专家"', expertPanel.includes('资深专家'));
assert('expert-panel 含"全程介入"', expertPanel.includes('全程介入'));
assert('expert-panel 含专家履历表', expertPanel.includes('专家履历') || expertPanel.includes('履历'));
assert('expert-panel 含编辑审稿标准', expertPanel.includes('编辑审稿') || expertPanel.includes('审稿标准'));
assert('expert-panel 含6位专家', expertPanel.includes('剧情架构师') && expertPanel.includes('角色设计师') && expertPanel.includes('叙事写手') && expertPanel.includes('一致性校验') && expertPanel.includes('改编专家') && expertPanel.includes('伦理审查'));
assert('expert-panel 无具体机构指认', !expertPanel.includes('前晋江资深编辑') && !expertPanel.includes('番茄签约作者') && !expertPanel.includes('起点签约作者') && !expertPanel.includes('日均万字'));

// 12.3 反幻觉
const antiHallucination = read('engine/anti-hallucination.md');
assert('anti-hallucination 含"事实核查"', antiHallucination.includes('事实核查'));
assert('anti-hallucination 含"置信度"', antiHallucination.includes('置信度'));
assert('anti-hallucination 含置信度评分', antiHallucination.includes('🟢') && antiHallucination.includes('🟡'));
assert('anti-hallucination 含禁止编造数据', antiHallucination.includes('禁止编造') || antiHallucination.includes('不可编造'));
assert('anti-hallucination 含核查源', antiHallucination.includes('核查') && antiHallucination.includes('fanqienovel'));
assert('anti-hallucination 含与市场验证联动', antiHallucination.includes('市场验证') || antiHallucination.includes('market-validation'));

// 12.4 合规合法
const legalCompliance = read('references/legal-compliance.md');
assert('legal-compliance 含"版权"', legalCompliance.includes('版权'));
assert('legal-compliance 含"平台规范"', legalCompliance.includes('平台规范') || legalCompliance.includes('平台'));
assert('legal-compliance 含内容规范禁区', legalCompliance.includes('禁区') || legalCompliance.includes('禁止'));
assert('legal-compliance 含平台内容规范', legalCompliance.includes('平台') && (legalCompliance.includes('规范') || legalCompliance.includes('社区')));
assert('legal-compliance 合规自检清单', legalCompliance.includes('自检') || legalCompliance.includes('清单'));

// SKILL.md 含四大核心能力章节
assert('SKILL.md 含"四大核心能力保障"', skillContent.includes('四大核心能力保障'));
assert('SKILL.md 含"市场验证"', skillContent.includes('市场验证'));
assert('SKILL.md 含"多专家模拟评审全程协助"', skillContent.includes('多专家模拟评审全程协助'));
assert('SKILL.md 含"反幻觉"', skillContent.includes('反幻觉'));
assert('SKILL.md 含"合规合法"', skillContent.includes('合规合法'));
assert('SKILL.md 资源索引含 market-validation.md', skillContent.includes('market-validation.md'));
assert('SKILL.md 资源索引含 legal-compliance.md', skillContent.includes('legal-compliance.md'));

// manifest.json 含新标签（复用已解析的 manifest 变量）
assert('manifest.json tags 含 market-validation', manifest.tags.includes('market-validation'));
assert('manifest.json tags 含 anti-hallucination', manifest.tags.includes('anti-hallucination'));
assert('manifest.json tags 含 legal-compliance', manifest.tags.includes('legal-compliance'));
assert('manifest.json tags 含 expert-panel', manifest.tags.includes('expert-panel'));

console.log('');

// ========== 汇总 ==========
console.log('═══════════════════════════════════════');
console.log(`📊 汇总: ${pass} 通过 / ${fail} 失败 / 共 ${pass + fail} 项`);
if (fail > 0) {
  console.log('\n❌ 失败项:');
  failures.forEach(f => console.log(`   - ${f}`));
  process.exit(1);
} else {
  console.log('\n✅ 全部通过！');
  process.exit(0);
}
