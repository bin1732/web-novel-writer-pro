#!/usr/bin/env python3
"""quality_check.py — 网文章节质量检测

用法:
    python3 quality_check.py <章节文件.md> [--json] [--platform <平台>]

支持平台: fanqie(番茄) qidian(起点) jinjj(晋江) qimao(七猫)
          changpei(长佩) cibi(刺猬猫) zongheng(纵横) douban(豆瓣)
          yan(盐言故事) douyin(抖音故事) kuaishou(快手短剧) auto
默认 auto：通用范围 2200-4500 字

依赖: 无 (纯Python标准库)
"""

import re
import sys
import json
import math
import argparse
from pathlib import Path

# 各平台字数范围（来源: platform-guide.md）
PLATFORM_RANGES = {
    'fanqie':    (2200, 2800),
    'qidian':    (3000, 4500),
    'jinjj':     (2500, 4000),
    'qimao':     (2200, 2800),
    'changpei':  (2500, 4000),
    'cibi':      (3000, 5000),
    'zongheng':  (3000, 4000),
    'douban':    (3000, 6000),
    'yan':       (5000, 20000),
    'douyin':    (800, 1500),
    'kuaishou': (1500, 3000),
    'auto':      (2200, 4500),
}

# AI高频词（用于模板化痕迹评分）
# 覆盖anti-ai-engine.md的14大类，部分类别拆分为多条模式
AI_HIGH_FREQ_WORDS = {
    '然而|但是|可是|不过|却': 12,
    '因此|所以|于是|从而|因而': 10,
    '此外|另外|还有|除此之外': 10,
    '综上所述|总而言之|总的来说|由此可见': 15,
    '值得注意的是|不可否认|显而易见': 15,
    '换言之|换句话说|也就是说': 12,
    '不禁|不由|忍不住|情不自禁': 10,
    '仿佛|好像|如同|宛如|犹如': 8,
    '感到|觉得|意识到|注意到': 6,
    '非常|极其|异常|十分|无比': 8,
    '完全|绝对|一定|必然|肯定': 10,
    '首先|其次|最后|第一|第二': 12,
    '感动|愤怒|悲伤|孤独|温暖|难过|开心|害怕|紧张|激动': 8,
    '价值|意义|本质|核心|关键|维度|层面|赋能|闭环|底层逻辑': 8,
    '在当今|随着.*?的发展|众所周知|我们都知道|在.*?的背景下': 12,
    '100%|百分之百|0%|完全不|丝毫不': 10,
    '真的|确实|实在|的确|其实|说实话|老实说': 6,
}


def load_text(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def get_paragraphs(text):
    paras = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    return paras if paras else [text]


def get_sentences(text):
    sents = re.split(r'[。！？…\n]+', text)
    return [s.strip() for s in sents if len(s.strip()) > 1]


def compute_ai_score(text):
    """计算模板化痕迹评分（0-100，越低越好）。返回分数和分项命中。"""
    total_penalty = 0
    hits = {}

    for pattern, weight in AI_HIGH_FREQ_WORDS.items():
        matches = re.findall(pattern, text)
        count = len(matches)
        if count > 0:
            penalty = min(count * weight, 20)
            total_penalty += penalty
            for m in set(matches):
                m_count = matches.count(m)
                hits[m] = hits.get(m, 0) + m_count

    # 词汇多样性（TTR）——低多样性=模板化痕迹明显
    chars = [c for c in text if c.strip()]
    if chars:
        unique_ratio = len(set(chars)) / len(chars)
        if unique_ratio < 0.3:
            total_penalty += 15
        elif unique_ratio < 0.4:
            total_penalty += 8

    # 句式均匀度惩罚（检测连续3句以上长度差<5字）
    sents = get_sentences(text)
    if len(sents) >= 3:
        uniform_runs = 0
        for i in range(len(sents) - 2):
            l1, l2, l3 = len(sents[i]), len(sents[i + 1]), len(sents[i + 2])
            if abs(l1 - l2) < 5 and abs(l2 - l3) < 5:
                uniform_runs += 1
        if uniform_runs >= 3:
            total_penalty += min(uniform_runs * 2, 15)

    ai_score = min(round(total_penalty, 1), 100)
    return ai_score, hits


def quality_check(filepath, output_json=False, platform='auto'):
    text = load_text(filepath)
    total_chars = len(text)
    paragraphs = get_paragraphs(text)
    sentences = get_sentences(text)
    total_sents = len(sentences)

    result = {"file": str(filepath), "status": "pass", "checks": {}, "alerts": []}

    # 平台字数范围
    range_label = platform if platform != 'auto' else '通用'
    wc_min, wc_max = PLATFORM_RANGES.get(platform, PLATFORM_RANGES['auto'])

    # 1. 字数检查
    wc = total_chars
    wc_pass = wc_min <= wc <= wc_max
    result["checks"]["字数"] = {
        "value": wc,
        "range": f"{wc_min}-{wc_max}字({range_label})",
        "pass": wc_pass
    }
    if not wc_pass:
        result["alerts"].append(f"字数{'不足' if wc < wc_min else '超标'}: {wc}字 (期望{wc_min}-{wc_max})")

    # 2. 连接词密度
    conj_words = r'首先|其次|最后|综上所述|总而言之|总的来说|值得注意的是|不可否认|换言之|换句话说|由此可见|显而易见'
    conj_count = len(re.findall(conj_words, text))
    density = round(conj_count * 300 / total_chars, 2) if total_chars > 0 else 0
    conj_pass = density <= 2
    result["checks"]["连接词密度"] = {"value": f"{density}/300字", "threshold": "≤2", "pass": conj_pass}
    if not conj_pass:
        result["alerts"].append(f"连接词过密: {conj_count}次 ({density}/300字)")

    # 3. 段落长度变异
    para_lens = [len(p) for p in paragraphs]
    if len(para_lens) >= 3:
        avg = sum(para_lens) / len(para_lens)
        variance = sum((l - avg) ** 2 for l in para_lens) / len(para_lens)
        cv = round(math.sqrt(variance) / avg, 2) if avg > 0 else 0
        max_len = max(para_lens)
        min_len = min(para_lens)
        ratio = round(max_len / min_len, 2) if min_len > 0 else 0
    else:
        cv, ratio = 0, 0

    cv_pass = cv >= 0.5
    ratio_pass = ratio > 3
    result["checks"]["段落变异系数"] = {"value": cv, "threshold": "≥0.5", "pass": cv_pass}
    result["checks"]["段落长宽比"] = {"value": ratio, "threshold": ">3:1", "pass": ratio_pass}
    if not cv_pass:
        result["alerts"].append(f"段落偏均匀(CV={cv})")
    if not ratio_pass:
        result["alerts"].append(f"段落长度差异不足({ratio}:1)")

    # 4. 对话占比 — 支持弯引号(U+201C/U+201D)、直角引号(「」)、直引号(")
    dialogs = re.findall(r'[\u201c\u300c"](.*?)[\u201d\u300d"]', text)
    dialog_chars = sum(len(d) + 2 for d in dialogs)
    dialog_pct = round(dialog_chars / total_chars * 100, 1) if total_chars > 0 else 0
    dialog_pass = 25 <= dialog_pct <= 55
    result["checks"]["对话占比"] = {"value": f"{dialog_pct}%", "range": "25-55%", "pass": dialog_pass}
    if not dialog_pass:
        result["alerts"].append(f"对话占比{'偏低' if dialog_pct < 25 else '偏高'}({dialog_pct}%)")

    # 5. 句长变异
    sent_lens = [len(s) for s in sentences]
    if len(sent_lens) >= 5:
        avg_sl = sum(sent_lens) / len(sent_lens)
        var_sl = sum((l - avg_sl) ** 2 for l in sent_lens) / len(sent_lens)
        sent_cv = round(math.sqrt(var_sl) / avg_sl, 2) if avg_sl > 0 else 0
    else:
        sent_cv = 0
    sent_cv_pass = sent_cv >= 0.5
    result["checks"]["句长变异系数"] = {"value": sent_cv, "threshold": "≥0.5", "pass": sent_cv_pass}
    if not sent_cv_pass:
        result["alerts"].append(f"句式偏均匀(CV={sent_cv})")

    # 6. 结尾钩子检测
    last_200 = text[-200:] if len(text) > 200 else text
    has_hook = bool(re.search(
        r'\.{3,}|…+|[？!]|脸色骤变|就在这时|突然|竟然|万万没想到|只听|只看见|谁知|岂料',
        last_200
    ))
    result["checks"]["结尾钩子"] = {"value": "有" if has_hook else "无", "pass": has_hook}
    if not has_hook:
        result["alerts"].append("章末未检测到钩子")

    # 7. 情绪标签词
    emotion_words = r'感动|愤怒|悲伤|孤独|温暖|难过|开心|害怕|紧张|激动|幸福|痛苦|绝望|心酸'
    emotion_count = len(re.findall(emotion_words, text))
    emotion_pass = emotion_count < 3
    result["checks"]["情感标签词"] = {"value": f"{emotion_count}次", "threshold": "<3次", "pass": emotion_pass}
    if not emotion_pass:
        result["alerts"].append(f"情感标签词过多({emotion_count}次)，用身体反应替代")

    # 8. 模板化痕迹评分（0-100，越低越好，<45为合格）
    ai_score, ai_hits = compute_ai_score(text)
    ai_pass = ai_score <= 45
    result["checks"]["模板化痕迹评分"] = {"value": ai_score, "threshold": "≤45", "pass": ai_pass}
    if not ai_pass:
        top3 = sorted(ai_hits.items(), key=lambda x: -x[1])[:3]
        result["alerts"].append(
            f"模板化痕迹评分超标({ai_score}分)，高频词: {', '.join(f'{k}×{v}' for k,v in top3)}"
        )

    # 9. 3-gram重复率（检测模板化）
    words = re.findall(r'[\u4e00-\u9fff]+', text)
    if len(words) > 30:
        trigrams = [''.join(words[i:i+3]) for i in range(len(words) - 2)]
        unique_trigrams = len(set(trigrams))
        repeat_rate = round((1 - unique_trigrams / len(trigrams)) * 100, 1)
        result["checks"]["3-gram重复率"] = {"value": f"{repeat_rate}%", "threshold": "<8%", "pass": repeat_rate < 8}
        if repeat_rate >= 8:
            result["alerts"].append(f"3-gram重复率过高({repeat_rate}%)，文本模板化")

    # 综合判定
    checks_pass = sum(1 for c in result["checks"].values() if c.get("pass"))
    checks_total = len(result["checks"])
    result["score"] = round(checks_pass / checks_total * 100)
    result["pass"] = len(result["alerts"]) == 0
    result["ai_score"] = ai_score

    if output_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"📖 质量检测: {filepath}")
        print(f"  文件: {filepath} | 平台: {range_label}")
        print(f"  字数: {wc} ✅" if wc_pass else f"  字数: {wc} ⚠️")
        print(f"  连接词: {result['checks']['连接词密度']['value']} {'✅' if conj_pass else '❌'}")
        print(f"  段落变异: CV={cv} {'✅' if cv_pass else '⚠️'}, 比={ratio}:1 {'✅' if ratio_pass else '⚠️'}")
        print(f"  对话占比: {dialog_pct}% {'✅' if dialog_pass else '⚠️'}")
        print(f"  句长变异: CV={sent_cv} {'✅' if sent_cv_pass else '⚠️'}")
        print(f"  结尾钩子: {'✅' if has_hook else '❌'}")
        print(f"  情感标签: {emotion_count}次 {'✅' if emotion_pass else '❌'}")
        print(f"  模板化痕迹评分: {ai_score}/100 {'✅' if ai_pass else '❌'}")
        if "3-gram重复率" in result["checks"]:
            print(f"  3-gram重复: {result['checks']['3-gram重复率']['value']} {'✅' if result['checks']['3-gram重复率']['pass'] else '⚠️'}")
        print(f"  综合评分: {result['score']}/100 {'✅ PASS' if result['pass'] else '❌ FAIL'}")
        if result["alerts"]:
            print(f"\n  ⚠️ 问题: {len(result['alerts'])}项")
            for a in result["alerts"]:
                print(f"    - {a}")
        print(f"\n  {'✅ 检测通过，可以交付' if result['pass'] else '❌ 检测未通过，需要修改后重检'}")

    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="网文章节质量检测")
    parser.add_argument("filepath", help="章节文件路径")
    parser.add_argument("--json", action="store_true", help="输出JSON格式")
    parser.add_argument(
        "--platform", "-p",
        choices=list(PLATFORM_RANGES.keys()),
        default="auto",
        help="目标平台（决定字数范围）"
    )
    args = parser.parse_args()

    if not Path(args.filepath).exists():
        print(f"❌ 文件不存在: {args.filepath}")
        sys.exit(1)

    result = quality_check(args.filepath, args.json, args.platform)
    sys.exit(0 if result["pass"] else 1)
