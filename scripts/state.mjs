#!/usr/bin/env node
/**
 * state.mjs — 网文创作状态持久化管理（跨平台 Node.js）
 * 替代 state.sh，修复命令注入漏洞 + 跨平台兼容
 *
 * 用法:
 *   node scripts/state.mjs init [project]
 *   node scripts/state.mjs commit <project> <章号>
 *   node scripts/state.mjs status [project]
 *   node scripts/state.mjs foreshadow [project]
 *   node scripts/state.mjs add-foreshadow <project> <内容> <埋设章> <回收章>
 *   node scripts/state.mjs set-ai-score <project> <章号> <AI分数> [自然度分数]
 *   node scripts/state.mjs ai-trend [project]
 *   node scripts/state.mjs set-pref <project> <键> <值>
 *   node scripts/state.mjs get-pref [project] [键]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

function readJSON(filePath) {
  try { return JSON.parse(readFileSync(filePath, 'utf8')); }
  catch { return null; }
}

function writeJSON(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getStateDir(project) {
  const projDir = project || '.';
  const stateDir = join(projDir, 'state');
  if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });
  const metaDir = join(stateDir, 'chapter_meta');
  if (!existsSync(metaDir)) mkdirSync(metaDir, { recursive: true });
  return stateDir;
}

function init(project) {
  const stateDir = getStateDir(project);
  const configPath = join(stateDir, 'project_config.json');
  if (!existsSync(configPath)) {
    writeJSON(configPath, {
      project_name: basename(resolve(project || '.')),
      version: '1.0',
      total_chapters: 0,
      total_words: 0,
      current_volume: 1,
      platform: '',
      genre: '',
      language: 'zh',
      created_at: new Date().toISOString().slice(0, 10)
    });
  }
  const charPath = join(stateDir, 'character_snapshot.json');
  if (!existsSync(charPath)) writeJSON(charPath, {});
  const forePath = join(stateDir, 'foreshadow_tracker.json');
  if (!existsSync(forePath)) writeJSON(forePath, { foreshadows: [], next_id: 1 });
  console.log(`✅ 项目初始化完成: ${stateDir}`);
}

function commit(project, chapter) {
  if (!chapter) { console.error('❌ 用法: state.mjs commit <project> <章号>'); process.exit(1); }
  const stateDir = getStateDir(project);

  // 查找章节文件
  let chapterFile = null;
  const patterns = [`${chapter}.md`, `第${chapter}章*.md`];
  for (const p of patterns) {
    const found = findFile(project, p);
    if (found) { chapterFile = found; break; }
  }
  if (!chapterFile) chapterFile = join(project, 'chapters', `${chapter}.md`);

  let wordCount = 0;
  if (existsSync(chapterFile)) {
    wordCount = readFileSync(chapterFile, 'utf8').length;
  }

  // 写入章节元数据
  const metaPath = join(stateDir, 'chapter_meta', `${chapter}.json`);
  writeJSON(metaPath, {
    chapter: String(chapter),
    words: wordCount,
    status: 'committed',
    committed_at: new Date().toISOString(),
    ai_score: 'pending',
    natural_score: 'pending'
  });

  // 更新项目配置
  const configPath = join(stateDir, 'project_config.json');
  const config = readJSON(configPath);
  if (config) {
    config.total_chapters = (config.total_chapters || 0) + 1;
    config.total_words = (config.total_words || 0) + wordCount;
    writeJSON(configPath, config);
  }

  console.log(`✅ 第 ${chapter} 章提交完成（${wordCount}字）`);
}

function findFile(dir, pattern) {
  if (!existsSync(dir)) return null;
  if (pattern.includes('*')) {
    // 先转义所有正则元字符，再将 * 替换为 .*，确保 . 等字符精确匹配
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('^' + escaped.replace(/\*/g, '.*') + '$');
    for (const f of readdirSync(dir)) {
      if (regex.test(f)) return join(dir, f);
    }
    return null;
  }
  const p = join(dir, pattern);
  return existsSync(p) ? p : null;
}

function status(project) {
  const stateDir = getStateDir(project);
  const config = readJSON(join(stateDir, 'project_config.json'));
  if (config) {
    console.log('📊 项目状态:');
    console.log(JSON.stringify(config, null, 2));
  }
  const metaDir = join(stateDir, 'chapter_meta');
  const chapters = existsSync(metaDir) ? readdirSync(metaDir).filter(f => f.endsWith('.json')) : [];
  console.log(`\n📁 章节数: ${chapters.length}`);
  const chars = readJSON(join(stateDir, 'character_snapshot.json')) || {};
  console.log(`🎭 角色数: ${Object.keys(chars).length}`);
  const fore = readJSON(join(stateDir, 'foreshadow_tracker.json')) || { foreshadows: [] };
  console.log(`📌 伏笔数: ${fore.foreshadows.length}`);
}

function foreshadow(project) {
  const stateDir = getStateDir(project);
  const tracker = readJSON(join(stateDir, 'foreshadow_tracker.json'));
  if (!tracker || !tracker.foreshadows?.length) {
    console.log('📌 无伏笔记录');
    return;
  }
  console.log('📌 伏笔追踪:');
  for (const f of tracker.foreshadows) {
    const mark = f.status === '已回收' ? '✅' : '⏳';
    console.log(`  ${mark} [${f.id || '?'}] ${f.content || ''} (埋设: ${f.buried_chapter || '?'}, 回收: ${f.expected_chapter || '?'})`);
  }
}

function addForeshadow(project, content, buriedCh, expectCh) {
  if (!content) { console.error('❌ 用法: state.mjs add-foreshadow <project> <内容> <埋设章> <回收章>'); process.exit(1); }
  const stateDir = getStateDir(project);
  const trackerPath = join(stateDir, 'foreshadow_tracker.json');
  const tracker = readJSON(trackerPath) || { foreshadows: [], next_id: 1 };
  const nid = tracker.next_id || 1;
  // 安全写入：使用JSON对象操作，不拼接字符串
  tracker.foreshadows.push({
    id: nid,
    content: String(content),
    buried_chapter: String(buriedCh || ''),
    expected_chapter: String(expectCh || ''),
    status: '埋设'
  });
  tracker.next_id = nid + 1;
  writeJSON(trackerPath, tracker);
  console.log(`✅ 伏笔 #${nid} 已添加`);
}

function setAiScore(project, chapter, aiScore, naturalScore) {
  if (!chapter || aiScore === undefined) {
    console.error('❌ 用法: state.mjs set-ai-score <project> <章号> <AI分数> [自然度分数]');
    process.exit(1);
  }
  const stateDir = getStateDir(project);
  const metaPath = join(stateDir, 'chapter_meta', `${chapter}.json`);
  if (!existsSync(metaPath)) {
    console.error(`❌ 章节 ${chapter} 无元数据，请先 commit`);
    process.exit(1);
  }
  const meta = readJSON(metaPath);
  if (!meta) {
    console.error(`❌ 章节 ${chapter} 元数据损坏，无法写入AI评分`);
    process.exit(1);
  }
  meta.ai_score = Number(aiScore);
  if (naturalScore !== undefined) meta.natural_score = Number(naturalScore);
  writeJSON(metaPath, meta);
  console.log(`✅ 第${chapter}章 AI评分: ${aiScore}`);
}

function aiTrend(project) {
  const stateDir = getStateDir(project);
  const metaDir = join(stateDir, 'chapter_meta');
  if (!existsSync(metaDir)) { console.log('⚠️ 无章节数据'); return; }
  const files = readdirSync(metaDir).filter(f => f.endsWith('.json')).sort();
  if (files.length === 0) { console.log('⚠️ 无章节数据'); return; }

  const scores = [];
  for (const f of files) {
    const m = readJSON(join(metaDir, f));
    if (m && m.ai_score !== 'pending' && m.ai_score !== undefined) {
      scores.push({ ch: m.chapter, ai: parseFloat(m.ai_score), natural: m.natural_score });
      console.log(`  章节${m.chapter}: 模板化痕迹=${m.ai_score}, 自然度评分=${m.natural_score}`);
    }
  }
  if (scores.length < 2) {
    console.log('\n📊 数据不足，需≥2章评分才能分析趋势');
    return;
  }
  const half = Math.floor(scores.length / 2);
  const avgFirst = scores.slice(0, half).reduce((s, x) => s + x.ai, 0) / half;
  const avgLast = scores.slice(half).reduce((s, x) => s + x.ai, 0) / (scores.length - half);
  const trend = avgLast < avgFirst ? '📉 改善' : avgLast > avgFirst ? '📈 恶化' : '➡️ 稳定';
  console.log(`\n📊 趋势: ${trend}`);
  console.log(`  前半段平均模板化痕迹: ${avgFirst.toFixed(1)}`);
  console.log(`  后半段平均模板化痕迹: ${avgLast.toFixed(1)}`);

  let streak = 0;
  for (let i = 1; i < scores.length; i++) {
    streak = scores[i].ai > 60 ? streak + 1 : 0;
    if (streak >= 3) {
      console.log(`\n⚠️ 警告: 连续${streak}章模板化痕迹评分偏高(>60)，需要加强自然度优化润色！`);
      break;
    }
  }
}

// 用户偏好键名：字母开头，仅含字母/数字/_-，≤32字符（防止注入与非法键）
const PREF_KEY_RE = /^[a-zA-Z][a-zA-Z0-9_-]{0,31}$/;

function prefsPath(stateDir) {
  return join(stateDir, 'user_prefs.json');
}

function readPrefs(stateDir) {
  return readJSON(prefsPath(stateDir)) || { prefs: {}, updated_at: null };
}

function setPref(project, key, value) {
  if (!key || !value) { console.error('❌ 用法: state.mjs set-pref <项目> <键> <值>'); process.exit(1); }
  if (!PREF_KEY_RE.test(key)) { console.error(`❌ 非法偏好键: "${key}"（需字母开头，仅含字母/数字/_-，≤32字符）`); process.exit(1); }
  if (value.length > 200) { console.error('❌ 偏好值过长（≤200字符）'); process.exit(1); }
  const stateDir = getStateDir(project);
  const data = readPrefs(stateDir);
  data.prefs[key] = String(value).replace(/[\r\n]+/g, ' ');
  data.updated_at = new Date().toISOString().slice(0, 10);
  writeJSON(prefsPath(stateDir), data);
  console.log(`✅ 已记录偏好 ${key} = ${data.prefs[key]}`);
}

function getPref(project, key) {
  const stateDir = getStateDir(project);
  const data = readPrefs(stateDir);
  const prefs = data.prefs || {};
  if (key) {
    console.log(key in prefs ? `${key}: ${prefs[key]}` : `❌ 无该偏好: ${key}`);
    return;
  }
  const keys = Object.keys(prefs);
  if (keys.length === 0) { console.log('📌 暂无用户偏好记录'); return; }
  console.log('📌 用户偏好:');
  for (const [k, v] of Object.entries(prefs)) console.log(`  ${k}: ${v}`);
  console.log(`  最近更新: ${data.updated_at || '未知'}`);
}

// 主入口
const cmd = process.argv[2] || 'help';
const project = process.argv[3] || '.';
try {
  switch (cmd) {
    case 'init': init(project); break;
    case 'commit': commit(project, process.argv[4]); break;
    case 'status': status(project); break;
    case 'foreshadow': foreshadow(project); break;
    case 'add-foreshadow': addForeshadow(project, process.argv[4], process.argv[5], process.argv[6]); break;
    case 'set-ai-score': setAiScore(project, process.argv[4], process.argv[5], process.argv[6]); break;
    case 'ai-trend': aiTrend(project); break;
    case 'set-pref': setPref(project, process.argv[4], process.argv[5]); break;
    case 'get-pref': getPref(project, process.argv[4]); break;
    default:
      console.log('用法: state.mjs {init|commit|status|foreshadow|add-foreshadow|set-ai-score|ai-trend|set-pref|get-pref} [project] [args]');
      process.exit(0);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
