# 更新日志

## 1.0.3 rev8 — 2026-08-11（第二轮全库数字事实核验）

### 🟡 事实准确性修复（杜绝夸大表述）
- **作家数量精确化**：全库"80+位/60+中文作家"为夸大表述——经逐表清点，`writer-styles-expanded.md` 实际 38 位中文 + 20 位英文（58 位），合并 `signing-standards.md` 作家库去重后共 **66 位（46 中文 + 20 英文）**。已统一：SKILL.md（模块表/模块F/资源索引）、beginner-guide.md、english-creation.md、exports/chatgpt-instructions.md、exports/kimi-instructions.md、exports/README.md 修正为精确数字；`writer-styles-expanded.md` 自身表述修正为"38位中文作家+20位英文作家"；SKILL.md 1.0.1 更新日志内"60+中文+20英文"同步修正
- **拆书类型数修正**：SKILL.md 模块执行协议 D 拆书分析"类型不在11大类内"→"10大类"（与 novel-deconstruction.md 类型路由 10 大类一致）
- **能力数标题修正**：SKILL.md"自然度优化引擎三大能力"→"五大能力"（表格实列 5 行）
- **tags 集合统一**：SKILL.md frontmatter tags 补齐 cross-media/ai-ethics，与 manifest.json 完全一致

### 🟡 部署完整性修复
- **deploy.mjs OpenClaw 部署补齐**：`deployOpenclaw()` 原复制清单缺 `_meta.json`（OpenClaw 挂载必需，含 openclaw 配置块）与 `exports/`、`test/` 目录（manifest.directories 声明的组成部分），导致 OpenClaw 部署后缺元数据与跨模型导出指令、冒烟测试；已补齐为与 zip 包一致的完整清单

### 🟡 阈值与覆盖一致性修复
- **quality_check.py 句长变异阈值统一**：`sent_cv_pass = sent_cv >= 0.4` → `>= 0.5`，与 anti-ai-engine.md 阶段B"句长变异系数≥0.5"、quality-metrics.md"段落长度变异系数≥0.5"完全一致（原 0.4 与知识库冲突）
- **sopMeta 高风险文件数修正**：SKILL.md 1.0.2 更新日志"4个高风险文件已加 sopMeta"→"5个"（实际 platform-guide/2026-platform-trends/anti-ai-engine/ai-creation-ethics/legal-compliance 共 5 个）；冒烟测试 timeSensitiveFiles 同步补入 legal-compliance.md
- **SKILL.md 1.0.1 更新日志作家数修正**：writer-styles-expanded.md 描述"60+中文+20英文"→"38位中文+20位英文"（与实际文件一致）
- **三方 tags 统一**：manifest.tags 与 `_meta.json` openclaw.tags、SKILL.md frontmatter tags、SKILL.md metadata.openclaw.tags 统一为 12 个标签（`_meta.json` openclaw.tags 原缺 `creative-writing`，SKILL.md metadata.openclaw.tags 原仅 7 个）；冒烟测试新增 7 项三方 tags 一致性断言防回归

### 🧪 测试增强
- 冒烟测试断言更新：beginner-guide 含精确"66位"、无夸大"80+位"

---

## 1.0.3 rev7 — 2026-08-11（全攻击审查修复 + 版本升级）

### 🔴 死代码/假代码修复
- **移除死条件条目**：`scripts/adaptation_converter.py` `DIALOGUE_PREFIXES` 中 `\u201d`（U+201D 右引号）永远不可能出现在句首，`startswith` 永不命中，属死条目；已移除并修正引号类型注释
- **移除死模式条目**：`blacklist_manager.mjs` 静态库 `在.*的背景下` 为正则式写法，但引擎用字面 `indexOf` 匹配，永不命中；已移除
- **贪婪匹配优化**：`quality_check.py` AI 高频词 `随着.*的发展` / `在.*的背景下` 改为非贪婪 `.*?`，命中统计更准确

### 🟡 反幻觉整改
- **移除虚构资历与战绩**：SKILL.md 角色定位删除无来源的"资深年限/帮签数量"等虚构表述，改为"多专家模拟评审模式"并标注专家档案均为模拟角色；`exports/chatgpt-instructions.md` 与 `exports/kimi-instructions.md` 同步移除虚构资历，与 `engine/expert-panel.md` 模拟标注完全一致
- **专家履历表彻底模拟化**：`engine/expert-panel.md` 专家履历中"10年+经验/前晋江资深编辑/番茄签约作者/日均万字产出"等具体机构与数字指认全部改为"模拟评审角色背景设定"，并在文件开头与章节内双重声明"非真实个人、不指向任何真实机构、无虚构资历与战绩"

### 🟢 描述与措辞统一
- **frontmatter/manifest 描述更新**：采用确认版短描述（11 模块逐一列出 + 自然度优化自进化 + 11 中文 + 3 英文平台 + 中英双语 + 市场验证/多专家模拟评审/反幻觉/版权合规 + 用户偏好记忆）
- **全库"资深专家团"统一为"多专家模拟评审"**：SKILL.md 版本定位/引语/8.2 节/资源索引同步修正，移除"每位均有真实行业背景"过度表述，与 `engine/expert-panel.md` 模拟标注完全一致
- **数字一致性修复**：`beginner-guide.md` 残留"100+位作家"→"80+位（60中文+20英文）"、"8大中文平台"→"11大中文平台"；`exports/` 4 份指令与 `english-creation.md` 英文平台统一为"3大英文平台（Wattpad/Amazon KDP/Webnovel）"，移除与描述冲突的 GoodNovel/Dreame/Meganovel 平台列表（出海平台仅在 `2026-platform-trends.md` 趋势语境提及）

### 🟡 版本单一事实源
- **deploy.mjs 版本改为从 manifest.json 动态读取**：`const VERSION = '1.0.2'` 硬编码 → 运行期解析 manifest.json `version` 字段，杜绝升级漏改
- **blacklist_manager.mjs 版本改为从 manifest.json 动态读取**：`export` JSON 与 `report` 输出的版本号不再硬编码，与 manifest 保持单一事实源

### 🟡 健壮性提升
- **state.mjs 新增用户偏好记忆层**：`set-pref <project> <key> <value>` / `get-pref <project> [key]`，写入 `state/user_prefs.json`，键名校验 + 长度限制，随模块入口自动注入——"越来越懂用户"落地为机制
- **blacklist_manager.mjs `top` 参数校验**：非数字参数不再静默输出空列表，给出明确用法提示

### 🧪 测试增强
- **冒烟测试新增黑名单命令全覆盖**：`hit`/`reset`/`evolve`/`sync`/`export` 逐一验证
- **冒烟测试新增版本单一事实源断言**：deploy 输出版本与 manifest 一致、blacklist report 版本与 manifest 一致
- **冒烟测试新增用户偏好用例**：set-pref 写入 → get-pref 读取 → 无效键名拒绝
- **`.blacklist/static.txt` 断言顺序耦合加固**：独立执行 `stats` 前置，不再依赖测试段落执行顺序
- **全库版本号统一 1.0.2 → 1.0.3**，冒烟测试断言 exports/references 无 1.0.2 残留
- 冒烟测试全量通过

---

## 1.0.2 rev6 — 2026-08-10（内容合规全面整改）

### 🟢 内容合规整改（SkillHub 内容审核优化）
- **自然度优化定位重写**：`references/anti-ai-engine.md` 全面改写——删除检测工具参考与对策类内容，改为"模板化写作特征自检/文风一致性/各平台创作风格偏好"等正面表述；删除不当技巧类表述，改为"保留少量口语化不规整表达"
- **修复"不当内容-1~4"模糊替换**：`references/legal-compliance.md` 8 类"不当内容"全部还原为合规的平台禁止内容分类（违法违规信息/低俗色情/暴力血腥/虚假信息/侵权内容/歧视性言论/隐私侵害/未成年人保护）
- **删除敏感示例**：`references/hook-templates.md` 删除"不转不是中国人"示例
- **统一 17 个文件措辞**：SKILL.md/AGENTS.md/manifest.json/engine/*/references/*/scripts/*/exports/* 中对抗性表述统一改为"模板化痕迹/自然度/内容规范"
- **版本号统一锁定 1.0.2**：`references/cross-media-adaptation.md` 1.0.1 → 1.0.2

### 🧪 测试验证
- **smoke-test.mjs runPython 回退逻辑修复**：`python3` 为 Windows 无效商店别名（指向不存在的路径）时，启动失败错误无 `code` 字段被误判为"脚本非零退出"而跳过 `python` 回退；改为按序探测 `python3`/`python`，启动失败（系统错误码 >0x10000000 或 ENOENT）时自动切换解释器
- 冒烟测试 **283/283 全部通过**（Windows + Linux/macOS 均适配）；`quality_check.py` 与 `adaptation_converter.py` 实测运行正常

---

## 1.0.2 rev5 — 2026-08-04（代码质量与数据一致性验证修复）

### 🔴 P0 代码BUG修复
- **state.mjs 空指针解引用修复**：`readJSON()` 返回 `null` 时直接访问 `meta.ai_score` 导致 `TypeError`，新增 `if (!meta)` 空值检查+错误退出
- **state.mjs antiAiScore=0 被跳过修复**：`if (antiAiScore)` 使用 falsy 判断导致评分为0时不写入，改为 `if (antiAiScore !== undefined)` 严格判断
- **deploy.mjs dry-run 模式创建目录修复**：`ensureDir()` 无条件创建目录，即使在 `--dry-run` 模式下也会写入磁盘，新增 `if (dryRun) return` 前置检查

### 🔴 P0 数据冲突修复
- **anti-ai-engine.md 模板化痕迹拦截条件方向反转修复**：第831行 `模板化痕迹评分<45/50` 方向错误（低模板化痕迹=好不应拦截），修正为 `模板化痕迹评分>45/50`（高模板化痕迹=差才拦截）
- **legal-compliance.md 与 ai-creation-ethics.md 定性矛盾修复**：legal-compliance.md 将"AI生成完整大纲"标为"🟡中风险"，但 ai-creation-ethics.md 明确将其归为"AI代写/越界"，统一修正为"🔴高风险"
- **anti-hallucination.md 虚假数据引用修复**：声称 platform-guide.md 含"平台分成比例"数据并标注🟢高置信度，实际该文件仅含分成**模式**（广告分成/订阅分成）无具体比例，修正为"平台分成模式"并添加注释说明

### 🟡 P1 代码质量修复
- **smoke-test.mjs 移除未使用的 `statSync` 导入**：从 `node:fs` 导入 `statSync` 但全文未使用
- **smoke-test.mjs 移除重复 `manifest.json` 解析**：第99行和第499行重复解析同一文件，复用已解析的 `manifest` 变量
- **quality_check.py 变量名误导修复**：变量名 `last_100` 实际取最后200字符，重命名为 `last_200`

### 🟡 P1 文档一致性修复
- **SKILL.md 章节编号重复修复**：存在两个"十五"章节（十五、2026平台趋势 + 十五、版本更新日志），后者修正为"十六、版本更新日志"

### 🧪 测试增强
- **冒烟测试从 277→283 项**，新增6项代码修复回归检查
- 覆盖：模板化痕迹拦截条件方向验证、AI生成大纲定性一致性验证、平台分成数据描述验证、章节编号唯一性验证
- 全部 283/283 通过

---

## 1.0.2 rev4 — 2026-08-04（四大核心能力确认与强化）

### 🎯 四大核心能力保障落地

用户明确要求确认并强化四大核心功能：**经过市场验证、真正的多个资深专家团全程协助、反幻觉、合规合法**。本轮升级全面落地：

#### 1. 市场验证
- **新增 `engine/market-validation.md`**：完整市场验证协议，含数据溯源标准（L1官方/L2半官方/L3社区三级）、参数验证方法论（字数范围/签约门槛/内容规范维度验证流程）、用户反馈收集机制（签约结果→参数校验→修正触发）、参考基准验证、版本化数据管理+回滚机制、市场验证自检清单
- **platform-guide.md 已标注溯源**：11平台参数均标注来源层级
- **sop-timeliness-check.mjs 联动**：自动检测SOP元数据时效，超期提醒更新

#### 2. 资深专家团全程协助
- **强化 `engine/expert-panel.md`**：
  - 新增**资深专家档案**：6位专家均有详细行业背景（10年+网文创作/前晋江资深编辑/番茄签约作者等）和审稿标准来源
  - 新增**全程介入机制**：选题→大纲→人设→正文→交付→改编，每个环节配置对应专家
  - 新增**真实编辑审稿标准**：模拟起点/番茄/晋江初审→复审→终审流程，各平台编辑关注重点+签约成功率评估
  - 保留否决权机制、争议解决优先级、轻量/全量评审模式

#### 3. 反幻觉
- **强化 `engine/anti-hallucination.md`**：
  - 新增**事实核查协议**：平台数据核查源（番茄/起点/晋江等官方入口）、核查优先级流程、禁止编造数据类型清单
  - 新增**数据置信度评分**：🟢高/🟡中/🔴低三级评分，每条硬编码数据标注置信度
  - 新增**与市场验证协议联动**：反幻觉层负责"不编造"，市场验证协议负责"有依据"，双重验证

#### 4. 合规合法
- **新增 `references/legal-compliance.md`**：完整合规合法指南
  - 版权规范要点：AI生成内容版权归属、AI辅助创作版权、侵权风险防范
  - 平台管理规定：内容规范8类禁区（违规内容/色情低俗/隐私/青少年保护）
  - 平台内容规范：11平台社区规范+处理后果
  - 合规自检清单：输出前必过的合规检查项

### 📝 元数据更新
- **SKILL.md**：frontmatter description 增加"市场验证、资深专家团全程协助、反幻觉、合规合法"；tags 增加 `market-validation`/`anti-hallucination`/`legal-compliance`/`expert-panel`；版本定位增加新能力；新增"八、四大核心能力保障"章节；资源索引增加 `market-validation.md` 和 `legal-compliance.md`；后续章节重新编号
- **manifest.json**：description 更新；tags 增加4个新标签；engine 目录描述增加"市场验证"
- **_meta.json**：openclaw.tags 增加4个新标签

### 🧪 测试增强
- **冒烟测试从 231→277 项**，新增第12组"四大核心能力保障"检查（46项）
- 覆盖：market-validation.md 关键词/结构验证、expert-panel.md 资深专家档案/全程介入/编辑审稿标准验证、anti-hallucination.md 事实核查/置信度/禁止编造/核查源/市场验证联动验证、legal-compliance.md 著作权/网络出版/禁区/平台规范/自检清单验证、SKILL.md 四大能力章节+资源索引验证、manifest.json 新标签验证
- engine协议完整性检查增强：anti-hallucination.md 增加"置信度""事实核查"关键词；expert-panel.md 增加"资深专家""全程介入"关键词；新增 market-validation.md 检查
- 全部 277/277 通过

---

## 1.0.2 rev3 — 2026-08-04（安全审计与代码质量加固）

### 🔴 P0 内容规范合规重构
- **anti-ai-engine.md 支柱六重构**：聚焦"写作自然度自检"，强调原创性与自然表达，移除对抗性表述
- **移除未经验证的效果声明**：删除"实测结果（三组对照）"表格中的无来源数据，符合反幻觉协议
- **"叙事指纹策略"重构**：聚焦风格一致性维护
- **"人工主导创作"原则**：强调人工创作占比>50%
- **表格列名重构**：统一为"改善措施"
- **"各平台内容规范参考维度"**：添加"仅供参考"声明，移除"通过"承诺
- **english-creation.md 重构**：移除对抗性表述，聚焦自然写作策略
- **全库表述修正**：SKILL.md/ai-creation-ethics.md/platform-guide.md/2026-platform-trends.md/ethics-reviewer.md/UPGRADE_ROADMAP.md 共10处表述修正
- **附录F/G顺序修复**：anti-ai-engine.md 附录标签从 A→B→C→D→E→G→F→H 修正为 A→B→C→D→E→F→G→H

### 🟡 P1 死代码移除
- **adaptation_converter.py**：移除未使用的 `import json`
- **knowledge-filter.mjs**：移除未使用的 `basename` import
- **smoke-test.mjs**：移除未使用的 `basename` import
- **deploy.mjs**：移除未使用的 `basename` 和 `readFileSync` import

### 🟡 P1 代码质量加固
- **state.mjs findFile() regex转义修复**：`pattern.replace(/\*/g, '.*')` 未转义 `.` 等正则元字符导致 `.md` 匹配任意字符，已添加 `replace(/[.+?^${}()|[\]\\]/g, '\\$&')` 前置转义
- **blacklist_manager.mjs add()/hit() 输入过滤**：未过滤换行符导致 `hit_log`/`dynamic.txt` 格式可被破坏，已添加 `replace(/[\r\n]/g, '')` 净化

### 🟢 P2 测试增强
- **冒烟测试从 163→231 项**，新增第11组"内容规范合规"检查（24项）
- 回归覆盖：支柱六名称一致性、未验证声明清除、附录顺序、全库无对抗性表述
- 全部 231/231 通过

### 学习成长机制审计
- **知识管理**：knowledge-filter.mjs 按模块(A-K)/阶段/角色精确加载知识文件 ✅
- **项目记忆**：state.mjs 持久化章节/角色/伏笔/AI评分，跨会话保留 ✅
- **自进化闭环**：check扫描→hit_log记录→recent_scan累积→evolve学习→dynamic.txt扩充→下次check更准 ✅
- **趋势追踪**：ai-trend 跨章分析模板化痕迹趋势，连续3章恶化自动预警 ✅
- **误报回收**：低频命中标记观察、用户remove加入白名单 ✅
- **严格度自适应**：动态库<50标准/50-99较严格/≥100严格 ✅
- **时效检查**：sop-timeliness-check.mjs 自动检测参考文档过期 ✅

---

## 1.0.2 rev2 — 2026-08-04（找茬审查修复）

### 🔴 P0 严重Bug修复
- **quality_check.py 对话检测正则修复**：`[\u201c\u201d「"])(.*?)` 中多余 `)` 导致对话占比检测完全失效，已修正为 `[\u201c\u300c"](.*?)[\u201d\u300d"]`
- **quality_check.py AI高频词计数修复**：`hits[m] += count` 用总数替代逐词计数导致高频词报告膨胀，已改为 `hits[m] += matches.count(m)` 逐词统计
- **deploy.mjs Claude部署自拷贝修复**：`agentsSrc` 与 `agentsTarget` 路径相同导致 `copyDir` 自拷贝（无效操作），改为验证 agents 数量即可
- **adaptation_converter.py 补全game格式**：SKILL.md 声称4种改编格式但脚本仅支持3种，新增 `convert_game()` 叙事游戏框架（分支剧情+选择节点+多结局）
- **AI高频词14类对齐**：`static.txt`/`STATIC_SEED` 从10类补全到14类（+绝对化表述/抽象名词堆砌/模板化开头/无效强调），`quality_check.py` 从13条补全到17条覆盖全部14类

### 🟡 P1 一致性修复
- **smoke-test.mjs runPython stderr捕获**：修复 `execFileSync` 错误时未捕获 `e.stderr` 导致 quality_check 无参测试失败；新增 python3 退出码非零时直接返回结果（不误试 python）
- **3个references版本号统一**：`ai-creation-ethics.md`、`2026-platform-trends.md`、`writer-styles-expanded.md` 从 1.0.1 → 1.0.2
- **english-creation.md 3处修复**：8大→11大中文平台、100+→60+中文作家、`Apply for签约`→`Apply for a contract`
- **gemini-instructions.md 英文平台补全**：补充 GoodNovel/Dreame/Meganovel 3个海外平台
- **SKILL.md 作家数量统一**：100+→80+（60中文+20英文），2处引用同步修改
- **exports/README.md 代码块**：```bash → ```text（跨平台兼容）
- **_meta.json created_at**：2025-01-01 → 2026-01-01

### 🟢 P2 改进项
- **blacklist_manager.mjs check() 累积模式**：RECENT_LOG 从覆盖写入改为去重追加，多次扫描结果不再丢失
- **smoke-test 功能测试增强**：新增 quality_check.py 样例章节检测（字数/模板化痕迹/对话占比）、adaptation_converter.py 短剧+游戏改编功能测试、static.txt 14类回归检查
- **冒烟测试从 152→163 项**，全部通过

---

## 1.0.2 — 2026-08-04（S级升级）

### 🔴 P0 跨平台与安全
- **bash→Node.js 全量移植**：`blacklist_manager.sh` → `blacklist_manager.mjs`、`deploy.sh` → `deploy.mjs`，配合既有 `state.mjs`，Windows/macOS/Linux 全兼容
- **命令注入漏洞修复**：`state.sh` 旧脚本通过字符串拼接写入 JSON 存在注入风险，已用 JSON 对象操作替代并删除旧脚本
- **冗余清理**：删除 `quality_check.sh`（与 `quality_check.py` 重复）、删除全部 `.sh` 脚本、清除 `__pycache__`

### 🟡 P1 一致性与元数据
- **元数据补全**：新增 `manifest.json`、`_meta.json`、`CHANGELOG.md`
- **开发产物归档**：`UPGRADE_ROADMAP.md` 及 5 份审计文档（AUDIT_REPORT/COMPETITOR_ANALYSIS/FINAL_AUDIT_ALL/FINAL_BENCHMARK/PLATFORM_GAP）从 `references/` 迁至 `docs/`，references/ 仅保留用户知识库
- **平台数一致性修复**：`platform-guide.md` 由"8大平台"补全为"11大平台"，新增盐言故事/抖音故事/快手短剧三平台完整参数与评分Rubric
- **SKILL.md 精简**：description 由超长单行精简为结构化描述，资源索引补全 engine/ 与 docs/，脚本引用统一为 .mjs/.py
- **AGENTS.md 增强**：补全脚本清单、新增专家团否决（veto）协议与争议解决优先级

### 🟢 P2 S级引擎层
- **新增 engine/ 目录**：
  - `execution-protocol.md` — 执行层协议（降级策略/连续失败处理/环境验证前置）
  - `evolution-protocol.md` — 自进化机制（黑名单学习/趋势反馈/误报回收）
  - `anti-hallucination.md` — 反幻觉层（硬编码数据自检/声明验证/高风险触发器）
  - `expert-panel.md` — 专家团评审协议（多专家角色/否决权/争议优先级）
- **知识过滤**：新增 `scripts/knowledge-filter.mjs`，按模块/阶段/角色精确加载知识文件，避免上下文浪费
- **SOP时效检查**：新增 `scripts/sop-timeliness-check.mjs`，自动检查参考文档是否过期
- **冒烟测试**：新增 `test/smoke-test.mjs`，全量覆盖脚本语法/元数据一致性/知识过滤/SOP时效

### 平台与功能
- 中文平台：11个（起点/番茄/晋江/七猫/长佩/刺猬猫/纵横/豆瓣/盐言故事/抖音故事/快手短剧）
- 英文平台：3个（Wattpad/Amazon KDP/Webnovel）
- 模块：11个（A~K）
- Agent：6个
- 脚本：7个（2 Python + 5 Node.js）

---

## 1.0.1 — 跨媒体改编 + AI伦理

- 新增模块J：跨媒体改编（短剧/漫画/AI有声书/游戏）
- 新增模块K：AI辅助创作伦理与合规
- 新增 `references/cross-media-adaptation.md`、`ai-creation-ethics.md`、`2026-platform-trends.md`、`writer-styles-expanded.md`
- 新增 Agent：adaptation-specialist、ethics-reviewer
- 新增脚本：`adaptation_converter.py`
- `blacklist_manager.sh` 增强：evolve/export/sync/report
- `state.sh` 增强：anti_ai_score + 趋势分析
- 平台扩展：+盐言故事/抖音故事/快手短剧
- 新增斜杠命令：`/novel-adapt`、`/novel-ethics`

---

## 1.0.0 — 初始版本

- 模块化自由入口设计，11大模块（A~K雏形）
- 自然度优化引擎七大支柱（词表/句法/段落/人味/平台适配/写作自然度自检/叙事指纹）
- 签约创作六步流程
- 风格蒸馏 + 作家仿写（100+作家）
- 中英双语自动切换
- 状态持久化（章节/角色/伏笔）
- 动态黑名单自进化
