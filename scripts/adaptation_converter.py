#!/usr/bin/env python3
import sys
import argparse

# 开引号类型: " (U+201C) " (U+0022) 「 (U+300C)。右引号不可能是句首，故不含 U+201D/U+300D。
DIALOGUE_PREFIXES = ('\u201c', '\u0022', '\u300c')

def is_dialogue_start(text):
    """检测文本是否以任意类型引号开头"""
    return any(text.startswith(p) for p in DIALOGUE_PREFIXES)

def convert_short_drama(text, title="未命名"):
    scenes = []
    paragraphs = text.split('\n\n')
    scene_num = 1
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        dialogue_parts = []
        narration_parts = []
        lines = para.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if is_dialogue_start(line):
                dialogue_parts.append(line)
            else:
                narration_parts.append(line)
        scene = {
            "scene_num": scene_num,
            "type": "INT" if any(w in para for w in ['室内', '房间', '办公室', '家', 'inside']) else "EXT",
            "atmosphere": "",
            "narration": narration_parts,
            "dialogue": dialogue_parts
        }
        scenes.append(scene)
        scene_num += 1
    output = f"{'='*40}\n{title} · 短剧剧本\n{'='*40}\n\n"
    for s in scenes:
        loc_type = "内景" if s["type"] == "INT" else "外景"
        output += f"【场景{s['scene_num']}】{loc_type}\n"
        output += f"[氛围：待定]\n"
        for n in s["narration"]:
            output += f"{n}\n"
        for d in s["dialogue"]:
            output += f"{d}\n"
        output += "\n"
    output += f"{'='*40}\n⚡ 钩子：待补充\n{'='*40}\n"
    return output

def convert_comic(text, title="未命名"):
    paragraphs = text.split('\n\n')
    pages = []
    current_page = []
    panel_count = 0
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        panel_count += 1
        shot = "特写" if len(para) < 30 else ("近景" if len(para) < 80 else "中景")
        dialogue = ""
        narration = para
        if is_dialogue_start(para):
            dialogue = para
            narration = ""
        panel = {
            "panel_num": panel_count,
            "shot": shot,
            "dialogue": dialogue,
            "narration": narration
        }
        current_page.append(panel)
        if len(current_page) >= 6:
            pages.append(current_page)
            current_page = []
    if current_page:
        pages.append(current_page)
    output = f"{'='*40}\n{title} · 漫画分镜\n{'='*40}\n\n"
    for page_idx, page in enumerate(pages, 1):
        output += f"--- 页{page_idx} ---\n\n"
        for panel in page:
            output += f"【格{panel['panel_num']}】{panel['shot']}\n"
            if panel['narration']:
                output += f"画面：{panel['narration']}\n"
            if panel['dialogue']:
                output += f"{panel['dialogue']}\n"
            output += "\n"
        output += "\n"
    return output

def convert_audiobook(text, title="未命名"):
    paragraphs = text.split('\n\n')
    output = f"{'='*40}\n{title} · AI有声书脚本\n{'='*40}\n\n"
    output += "[声音：待选型]\n[背景：待标注]\n\n"
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        is_dialogue = is_dialogue_start(para)
        if is_dialogue:
            output += f"[声音切换：角色音]\n"
            output += f"{para}\n"
            output += f"[停顿1秒]\n\n"
        else:
            emotion = "平静"
            for marker, tag in [("！", "激动"), ("？", "疑问"), ("…", "低沉"), ("哭", "悲伤"), ("笑", "开心")]:
                if marker in para:
                    emotion = tag
                    break
            output += f"[情绪：{emotion}]\n"
            output += f"{para}\n\n"
    output += f"{'='*40}\n[结束]\n{'='*40}\n"
    return output

def convert_game(text, title="未命名"):
    """将小说文本转换为叙事游戏框架（分支剧情+选择节点+多结局）"""
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    output = f"{'='*40}\n{title} · 叙事游戏框架\n{'='*40}\n\n"
    output += "【游戏类型】叙事冒险/文字AVG\n"
    output += "【分支结构】3层选择 × 2-3选项/层\n"
    output += "【结局数量】3-5个（基于选择路径）\n\n"

    # 将段落分为场景，每2-3段为一个场景
    scenes = []
    current_scene = []
    for i, para in enumerate(paragraphs):
        current_scene.append(para)
        if len(current_scene) >= 2 or i == len(paragraphs) - 1:
            scenes.append(current_scene)
            current_scene = []

    output += "--- 场景列表 ---\n\n"
    for idx, scene in enumerate(scenes, 1):
        output += f"【场景{idx}】\n"
        has_dialogue = any(is_dialogue_start(p) for p in scene)
        scene_type = "对话" if has_dialogue else "叙述"
        output += f"类型：{scene_type}\n"
        # 场景内容摘要
        summary = "".join(scene)[:80]
        output += f"内容：{summary}...\n"
        # 每3个场景插入一个选择节点
        if idx % 3 == 0 and idx < len(scenes):
            output += f"\n  ┌─ 选择节点{idx // 3} ─┐\n"
            output += f"  │ A: 谨慎行动 → 场景{idx+1}\n"
            output += f"  │ B: 冲动行事 → 场景{idx+2}（风险路径）\n"
            output += f"  │ C: 询问同伴 → 场景{idx+1}（额外信息）\n"
            output += f"  └──────────────┘\n"
        output += "\n"

    # 结局框架
    output += "--- 结局框架 ---\n\n"
    endings = [
        ("真结局", "所有关键选择选A路径，收集全部线索"),
        ("普通结局", "常规路径完成，未收集隐藏线索"),
        ("坏结局", "选择B路径≥2次，触发死亡/失败"),
        ("隐藏结局", "特定组合选择（C+A+B），解锁彩蛋"),
    ]
    for name, condition in endings:
        output += f"  【{name}】触发条件：{condition}\n"

    output += f"\n{'='*40}\n⚡ 注：选择节点和结局需根据实际剧情细化\n{'='*40}\n"
    return output

def main():
    parser = argparse.ArgumentParser(description="小说→跨媒体格式转换器")
    parser.add_argument("format", choices=["short-drama", "comic", "audiobook", "game"],
                        help="目标格式: short-drama/comic/audiobook/game")
    parser.add_argument("--input", "-i", help="输入文件路径", required=True)
    parser.add_argument("--output", "-o", help="输出文件路径")
    parser.add_argument("--title", "-t", default="未命名", help="作品标题")
    args = parser.parse_args()

    try:
        with open(args.input, 'r', encoding='utf-8') as f:
            text = f.read()
    except FileNotFoundError:
        print(f"❌ 文件不存在: {args.input}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ 读取失败: {e}", file=sys.stderr)
        sys.exit(1)

    if args.format == "short-drama":
        result = convert_short_drama(text, args.title)
    elif args.format == "comic":
        result = convert_comic(text, args.title)
    elif args.format == "audiobook":
        result = convert_audiobook(text, args.title)
    elif args.format == "game":
        result = convert_game(text, args.title)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(result)
        print(f"已输出到: {args.output}")
    else:
        print(result)

    sys.exit(0)

if __name__ == "__main__":
    main()
