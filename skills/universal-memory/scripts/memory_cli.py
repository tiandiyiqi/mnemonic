#!/usr/bin/env python3
"""
Mnemonic - Universal Standalone Memory Skill CLI
Provides WAL-based tiered memory, semantic retrieval, and self-reflection.
Supports dual-layer architecture: Global + Project level storage.
"""

import argparse
import json
import os
import re
import sys
import time
import uuid
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

GLOBAL_MNEMONIC_DIR = Path.home() / ".mnemonic"
GLOBAL_RULES_FILE = GLOBAL_MNEMONIC_DIR / "RULES.md"
GLOBAL_JOURNAL_DIR = GLOBAL_MNEMONIC_DIR / "JOURNAL"
GLOBAL_AUDIT_LOG = GLOBAL_MNEMONIC_DIR / "audit.jsonl"

def get_project_paths(project_dir: Optional[str] = None) -> Dict[str, Path]:
    project_root = Path(project_dir) if project_dir else Path.cwd()
    mnemonic_dir = project_root / ".mnemonic"
    return {
        "dir": mnemonic_dir,
        "session": mnemonic_dir / "SESSION.md",
        "decisions": mnemonic_dir / "DECISIONS.md",
        "audit": mnemonic_dir / "audit.jsonl"
    }

def clear_xattr(path: Path):
    try:
        import subprocess
        subprocess.run(["xattr", "-c", str(path)], capture_output=True, timeout=5)
    except Exception:
        pass

def ensure_global_dirs():
    try:
        os.makedirs(GLOBAL_MNEMONIC_DIR, exist_ok=True)
        os.makedirs(GLOBAL_JOURNAL_DIR, exist_ok=True)
        clear_xattr(GLOBAL_MNEMONIC_DIR)
        clear_xattr(GLOBAL_JOURNAL_DIR)
    except PermissionError as e:
        print(f"❌ Error: Cannot create directory: {e}")
        print(f"   Please run: mkdir -p {GLOBAL_MNEMONIC_DIR} {GLOBAL_JOURNAL_DIR}")
        print(f"   And clear extended attributes: xattr -c {GLOBAL_MNEMONIC_DIR}")
        sys.exit(1)
    if not GLOBAL_RULES_FILE.exists():
        try:
            GLOBAL_RULES_FILE.write_text("# Long-term Rules & Preferences (Global)\n\n", encoding="utf-8")
        except PermissionError:
            print(f"❌ Error: Cannot write to {GLOBAL_RULES_FILE}")
            print(f"   Please run: xattr -c {GLOBAL_MNEMONIC_DIR}")
            print(f"   Then try again.")
            sys.exit(1)

def ensure_project_dirs(project_dir: Optional[str] = None):
    paths = get_project_paths(project_dir)
    os.makedirs(paths["dir"], exist_ok=True)
    if not paths["session"].exists():
        paths["session"].write_text("# Active Session Context (Project)\n\n", encoding="utf-8")
    if not paths["decisions"].exists():
        paths["decisions"].write_text("# Project Decisions\n\n", encoding="utf-8")

def get_nonce() -> str:
    return uuid.uuid4().hex[:8]

def write_audit(log_file: Path, event_type: str, action: str, metadata: Dict[str, Any], scope: str = "global"):
    event = {
        "timestamp": datetime.now().isoformat(),
        "scope": scope,
        "event_type": event_type,
        "action": action,
        "metadata": metadata
    }
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")

def route_memory(mem_type: str, scope: str) -> tuple[str, Path, Path]:
    if scope == "global":
        if mem_type in ["preference", "constraint"]:
            return "cold", GLOBAL_RULES_FILE, GLOBAL_AUDIT_LOG
        elif mem_type == "reflect":
            return "warm", GLOBAL_JOURNAL_DIR, GLOBAL_AUDIT_LOG
        else:
            return "hot", GLOBAL_RULES_FILE, GLOBAL_AUDIT_LOG
    else:
        paths = get_project_paths()
        if mem_type == "decision":
            return "hot", paths["decisions"], paths["audit"]
        else:
            return "hot", paths["session"], paths["audit"]

def cmd_init_global(args):
    ensure_global_dirs()
    print(f"✅ Global memory initialized at {GLOBAL_MNEMONIC_DIR}")

def cmd_init_project(args):
    project_dir = args.project_dir or os.getcwd()
    ensure_project_dirs(project_dir)
    paths = get_project_paths(project_dir)
    print(f"✅ Project memory initialized at {paths['dir']}")

def cmd_remember(args):
    content = args.content.strip()
    mem_type = args.type
    nonce = get_nonce()
    
    if args.scope == "auto":
        if mem_type in ["preference", "constraint"]:
            scope = "global"
        else:
            scope = args.project_dir and "project" or "global"
    else:
        scope = args.scope
    
    if scope == "project":
        ensure_project_dirs(args.project_dir)
    else:
        ensure_global_dirs()
    
    tier, target_file, audit_file = route_memory(mem_type, scope)
    if args.project_dir and scope == "project":
        _, target_file, audit_file = route_memory(mem_type, scope)
        paths = get_project_paths(args.project_dir)
        if mem_type == "decision":
            target_file = paths["decisions"]
        else:
            target_file = paths["session"]
        audit_file = paths["audit"]
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"- [{timestamp}] [{mem_type.upper()}] {content} (nonce: {nonce})\n"
    
    with open(target_file, "a", encoding="utf-8") as f:
        f.write(entry)
    
    write_audit(audit_file, "wal", "remember", {
        "type": mem_type, 
        "content": content, 
        "nonce": nonce, 
        "file": str(target_file)
    }, scope)
    
    result = {"status": "success", "nonce": nonce, "target": str(target_file), "scope": scope}
    if args.json:
        print(json.dumps(result))
    else:
        print(f"✅ Remembered ({mem_type}) [{scope.upper()}]: {content} [nonce: {nonce}]")

def cmd_search(args):
    query = args.query.lower()
    results = []
    
    if args.scope in ["auto", "project"] and args.project_dir:
        paths = get_project_paths(args.project_dir)
        for name, file_path in [("session", paths["session"]), ("decisions", paths["decisions"])]:
            if file_path.exists():
                lines = file_path.read_text(encoding="utf-8").splitlines()
                for i, line in enumerate(lines):
                    if query in line.lower():
                        results.append({
                            "tier": "project",
                            "file": file_path.name,
                            "line": i + 1,
                            "content": line.strip(),
                            "score": 1.0 if query == line.lower().strip() else 0.8
                        })
    
    if args.scope in ["auto", "global"]:
        ensure_global_dirs()
        files_to_search = [
            ("cold", GLOBAL_RULES_FILE)
        ]
        for f in GLOBAL_JOURNAL_DIR.glob("*.md"):
            files_to_search.append(("warm", f))
        
        for tier, file_path in files_to_search:
            if not file_path.exists():
                continue
            lines = file_path.read_text(encoding="utf-8").splitlines()
            for i, line in enumerate(lines):
                if query in line.lower():
                    results.append({
                        "tier": f"global/{tier}",
                        "file": file_path.name,
                        "line": i + 1,
                        "content": line.strip(),
                        "score": 0.9 if query == line.lower().strip() else 0.7
                    })
    
    results.sort(key=lambda x: x["score"], reverse=True)
    results = results[:args.limit]
    
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        if not results:
            print("No matching memories found.")
        else:
            for r in results:
                print(f"[{r['tier'].upper()}] {r['file']}:{r['line']} -> {r['content']}")

STOP_WORDS_EN = {"the", "is", "at", "which", "on", "in", "a", "an", "to", "and", "or", "of", "for", "with", "that", "this", "it", "as", "be", "was", "are", "were", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "can", "about", "from", "by", "not", "but", "what", "when", "where", "who", "how", "all", "each", "every", "both", "few", "more", "most", "other", "some", "such", "no", "nor", "only", "own", "same", "so", "than", "too", "very", "just", "also", "now", "here", "there", "then", "once"}

STOP_WORDS_ZH = {"的", "是", "在", "了", "和", "与", "或", "有", "我", "你", "他", "她", "它", "这", "那", "就", "也", "都", "会", "能", "要", "想", "去", "来", "说", "看", "做", "用", "对", "把", "被", "让", "给", "从", "到", "着", "过", "吗", "呢", "吧", "啊", "嗯", "哦", "呀", "哈", "什么", "怎么", "为什么", "哪里", "哪个", "如何", "多少", "几", "很", "好", "很", "太", "更", "最", "已", "正在", "已经", "可以", "可能", "应该", "需要", "一个", "一些", "这种", "那种", "这个", "那个", "这些", "那些", "用户", "询问", "关于", "问题", "任务", "进行"}

EN_TO_ZH_KEYWORDS = {
    "refactor": "重构", "refactoring": "重构",
    "login": "登录", "signin": "登录",
    "module": "模块",
    "optimize": "优化", "optimization": "优化",
    "database": "数据库", "db": "数据库",
    "query": "查询",
    "performance": "性能",
    "cache": "缓存", "caching": "缓存",
    "auth": "认证", "authentication": "认证",
    "authorize": "授权", "authorization": "授权",
    "session": "会话",
    "storage": "存储",
    "test": "测试", "testing": "测试",
    "deploy": "部署", "deployment": "部署",
    "config": "配置", "configuration": "配置",
    "architecture": "架构",
    "design": "设计",
    "implement": "实现", "implementation": "实现",
    "feature": "功能",
    "user": "用户",
    "system": "系统",
    "service": "服务",
    "component": "组件",
    "code": "代码",
    "file": "文件",
    "project": "项目",
    "error": "错误",
    "exception": "异常",
    "log": "日志", "logging": "日志",
    "debug": "调试", "debugging": "调试",
    "fix": "修复", "bugfix": "修复",
    "update": "更新",
    "version": "版本",
    "security": "安全",
    "encrypt": "加密", "encryption": "加密",
    "decrypt": "解密", "decryption": "解密",
    "validate": "验证", "validation": "验证",
    "filter": "过滤",
    "sort": "排序",
    "page": "分页", "pagination": "分页",
    "queue": "队列",
    "message": "消息",
    "event": "事件",
    "callback": "回调",
    "async": "异步", "asynchronous": "异步",
    "sync": "同步", "synchronous": "同步",
    "frontend": "前端",
    "backend": "后端",
    "client": "客户端",
    "server": "服务器",
    "request": "请求",
    "response": "响应"
}

def extract_keywords(context: str) -> List[str]:
    keywords = []
    english_words = re.findall(r"[a-zA-Z]{2,}", context.lower())
    for word in english_words:
        if word not in STOP_WORDS_EN and len(word) > 2:
            keywords.append(word)
            if word in EN_TO_ZH_KEYWORDS:
                keywords.append(EN_TO_ZH_KEYWORDS[word])
    meaningful_patterns = [
        r"重构", r"登录", r"模块", r"优化", r"数据库", r"查询", r"性能",
        r"缓存", r"认证", r"授权", r"会话", r"存储", r"API", r"接口",
        r"测试", r"部署", r"配置", r"架构", r"设计", r"实现", r"功能",
        r"用户", r"系统", r"服务", r"组件", r"代码", r"文件", r"项目",
        r"错误", r"异常", r"日志", r"调试", r"修复", r"更新", r"版本",
        r"安全", r"加密", r"解密", r"验证", r"过滤", r"排序", r"分页",
        r"缓存", r"队列", r"消息", r"事件", r"回调", r"异步", r"同步",
        r"前端", r"后端", r"客户端", r"服务器", r"请求", r"响应",
        r"Redis", r"MySQL", r"PostgreSQL", r"MongoDB", r"TypeScript",
        r"JavaScript", r"Python", r"Java", r"Go", r"Rust", r"React",
        r"Vue", r"Angular", r"Node", r"Docker", r"Kubernetes"
    ]
    for pattern in meaningful_patterns:
        if re.search(pattern, context, re.IGNORECASE):
            keywords.append(pattern)
    chinese_words = re.findall(r"[\u4e00-\u9fa5]{2,4}", context)
    for word in chinese_words:
        if word not in STOP_WORDS_ZH and word not in keywords:
            is_meaningful = any(
                re.search(p, word) for p in [r"重构", r"登录", r"模块", r"优化", r"数据库", r"查询", r"性能", r"缓存", r"认证", r"授权", r"会话", r"存储", r"测试", r"部署", r"配置", r"架构", r"设计", r"实现", r"功能", r"系统", r"服务", r"组件", r"代码", r"文件", r"项目", r"错误", r"异常", r"日志", r"调试", r"修复", r"更新", r"版本", r"安全", r"加密", r"验证", r"过滤", r"排序", r"分页", r"队列", r"消息", r"事件", r"回调", r"异步", r"同步", r"前端", r"后端", r"客户端", r"服务器", r"请求", r"响应"]
            )
            if is_meaningful:
                keywords.append(word)
    seen = set()
    unique_keywords = []
    for kw in keywords:
        if kw not in seen:
            seen.add(kw)
            unique_keywords.append(kw)
    return unique_keywords[:10]

def search_all_sources(keywords: List[str], project_dir: Optional[str] = None) -> List[Dict[str, Any]]:
    memories = []
    sources = []
    sources.append(("global/rules", GLOBAL_RULES_FILE, 0.9))
    if GLOBAL_JOURNAL_DIR.exists():
        journal_files = sorted(GLOBAL_JOURNAL_DIR.glob("*.md"), reverse=True)[:30]
        for jf in journal_files:
            sources.append(("global/journal", jf, 1.0))
    if project_dir:
        paths = get_project_paths(project_dir)
        sources.append(("project/session", paths["session"], 1.2))
        sources.append(("project/decisions", paths["decisions"], 1.1))
    for source_type, file_path, source_weight in sources:
        if not file_path.exists():
            continue
        try:
            content = file_path.read_text(encoding="utf-8")
            lines = content.splitlines()
            current_reflection = None
            for i, line in enumerate(lines):
                if not line.strip():
                    continue
                if line.startswith("### Reflection:"):
                    current_reflection = line.replace("### Reflection:", "").strip()
                if line.startswith("# ") and not line.startswith("###"):
                    continue
                line_lower = line.lower()
                for kw in keywords:
                    if kw.lower() in line_lower:
                        mem = {
                            "source": f"{source_type}/{file_path.name}",
                            "source_type": source_type,
                            "file": file_path.name,
                            "line": i + 1,
                            "content": line.strip(),
                            "keyword": kw,
                            "source_weight": source_weight,
                            "file_date": file_path.stem if source_type == "global/journal" else None
                        }
                        if current_reflection:
                            mem["reflection_task"] = current_reflection
                        memories.append(mem)
                        break
        except Exception:
            continue
    return memories

def calculate_relevance(memories: List[Dict[str, Any]], keywords: List[str]) -> List[Dict[str, Any]]:
    now = datetime.now()
    for mem in memories:
        content_lower = mem["content"].lower()
        base_score = 0.8
        for kw in keywords:
            kw_lower = kw.lower()
            if kw_lower == content_lower:
                base_score = 1.0
                break
            elif kw_lower in content_lower:
                base_score = max(base_score, 0.85)
        time_decay = 0.7
        if mem["file_date"]:
            try:
                file_date = datetime.strptime(mem["file_date"], "%Y-%m-%d")
                days_ago = (now - file_date).days
                if days_ago <= 7:
                    time_decay = 1.0
                elif days_ago <= 30:
                    time_decay = 0.9
                elif days_ago <= 90:
                    time_decay = 0.8
                else:
                    time_decay = 0.7
            except ValueError:
                time_decay = 0.8
        else:
            time_decay = 0.85
        mem["relevance"] = round(base_score * time_decay * mem["source_weight"], 2)
    memories.sort(key=lambda x: x["relevance"], reverse=True)
    return memories[:10]

def format_recommendations(memories: List[Dict[str, Any]]) -> List[str]:
    recommendations = []
    seen_contents = set()
    for mem in memories:
        content = mem["content"]
        if content in seen_contents:
            continue
        seen_contents.add(content)
        if "Insight:" in content:
            insight_match = re.search(r"Insight:\s*(.+)", content)
            if insight_match:
                insight = insight_match.group(1).strip()
                task_name = mem.get("reflection_task", "未知任务")
                recommendations.append(f"💡 洞察 ({task_name}): {insight}")
        elif "PREFERENCE" in content:
            pref_match = re.search(r"\[PREFERENCE\]\s*(.+?)(?:\s*\(nonce)", content)
            if pref_match:
                pref = pref_match.group(1).strip()
                recommendations.append(f"👤 用户偏好: {pref}")
        elif "CONSTRAINT" in content:
            const_match = re.search(r"\[CONSTRAINT\]\s*(.+?)(?:\s*\(nonce)", content)
            if const_match:
                const = const_match.group(1).strip()
                recommendations.append(f"⚠️ 约束: {const}")
        elif "DECISION" in content:
            dec_match = re.search(r"\[DECISION\]\s*(.+?)(?:\s*\(nonce)", content)
            if dec_match:
                dec = dec_match.group(1).strip()
                recommendations.append(f"📌 决策: {dec}")
        elif "Reflection:" in content:
            task_match = re.search(r"Reflection:\s*(.+)", content)
            if task_match:
                task = task_match.group(1).strip()
                recommendations.append(f"🪞 反思任务: {task}")
        else:
            clean_content = re.sub(r"\[.*?\]", "", content).strip()
            clean_content = re.sub(r"\(nonce:.*?\)", "", clean_content).strip()
            if clean_content and len(clean_content) > 5:
                recommendations.append(f"📝 {clean_content}")
    return recommendations[:5]

def cmd_perceive(args):
    context = args.context
    keywords = extract_keywords(context)
    memories = search_all_sources(keywords, getattr(args, 'project_dir', None))
    scored_memories = calculate_relevance(memories, keywords)
    recommendations = format_recommendations(scored_memories)
    result = {
        "keywords": keywords[:5],
        "related_memories": [
            {
                "source": m["source"],
                "content": m["content"],
                "relevance": m["relevance"]
            }
            for m in scored_memories[:5]
        ],
        "recommendations": recommendations
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))

def cmd_reflect(args):
    ensure_global_dirs()
    
    task = args.task
    outcome = args.outcome
    confidence = float(args.confidence)
    
    reflection = {
        "timestamp": datetime.now().isoformat(),
        "task": task,
        "outcome": outcome,
        "confidence": confidence,
        "insight": args.insight
    }
    
    today = datetime.now().strftime("%Y-%m-%d")
    journal_file = GLOBAL_JOURNAL_DIR / f"{today}.md"
    with open(journal_file, "a", encoding="utf-8") as f:
        f.write(f"\n### Reflection: {task}\n")
        f.write(f"- Outcome: {outcome}\n")
        f.write(f"- Confidence: {confidence}\n")
        f.write(f"- Insight: {args.insight}\n")
    
    write_audit(GLOBAL_AUDIT_LOG, "reflection", "reflect", reflection, "global")
    print(f"✅ Reflection logged for task: {task}")

def cmd_migrate(args):
    old_data_dir = Path(__file__).resolve().parents[1] / ".mnemonic_data"
    
    if not old_data_dir.exists():
        print("No legacy data found to migrate.")
        return
    
    ensure_global_dirs()
    
    old_rules = old_data_dir / "RULES.md"
    if old_rules.exists():
        old_content = old_rules.read_text(encoding="utf-8")
        if old_content.strip() and old_content.strip() != "# Long-term Rules & Preferences":
            with open(GLOBAL_RULES_FILE, "a", encoding="utf-8") as f:
                f.write(f"\n# Migrated from legacy storage ({datetime.now().strftime('%Y-%m-%d')})\n")
                f.write(old_content)
            print(f"✅ Migrated RULES.md to {GLOBAL_RULES_FILE}")
    
    old_journal = old_data_dir / "JOURNAL"
    if old_journal.exists():
        for old_file in old_journal.glob("*.md"):
            new_file = GLOBAL_JOURNAL_DIR / old_file.name
            if not new_file.exists():
                new_file.write_text(old_file.read_text(encoding="utf-8"), encoding="utf-8")
                print(f"✅ Migrated {old_file.name} to {GLOBAL_JOURNAL_DIR}")
    
    print("✅ Migration completed!")

def main():
    parser = argparse.ArgumentParser(description="Mnemonic - Standalone Memory Skill (Dual-Layer)")
    subparsers = parser.add_subparsers(dest="command")
    
    p_init_global = subparsers.add_parser("init-global", help="Initialize global memory storage")
    
    p_init_project = subparsers.add_parser("init-project", help="Initialize project memory storage")
    p_init_project.add_argument("--project-dir", help="Project directory path")
    
    p_rem = subparsers.add_parser("remember", help="Store a memory")
    p_rem.add_argument("content", help="Content to remember")
    p_rem.add_argument("--type", choices=["preference", "decision", "constraint", "correction"], default="preference")
    p_rem.add_argument("--scope", choices=["auto", "global", "project"], default="auto", help="Storage scope")
    p_rem.add_argument("--project-dir", help="Project directory path")
    p_rem.add_argument("--json", action="store_true")
    
    p_search = subparsers.add_parser("search", help="Search memories")
    p_search.add_argument("query", help="Search query")
    p_search.add_argument("--scope", choices=["auto", "global", "project"], default="auto", help="Search scope")
    p_search.add_argument("--project-dir", help="Project directory path")
    p_search.add_argument("--limit", type=int, default=5)
    p_search.add_argument("--json", action="store_true")
    
    p_per = subparsers.add_parser("perceive", help="Extract keywords and find related memories")
    p_per.add_argument("context", help="Context text")
    p_per.add_argument("--project-dir", help="Project directory path")
    p_per.add_argument("--json", action="store_true")
    
    p_ref = subparsers.add_parser("reflect", help="Log a reflection")
    p_ref.add_argument("--task", required=True)
    p_ref.add_argument("--outcome", choices=["success", "failure", "partial"], required=True)
    p_ref.add_argument("--confidence", default="0.8")
    p_ref.add_argument("--insight", required=True)
    
    p_migrate = subparsers.add_parser("migrate", help="Migrate legacy data to new architecture")
    
    args = parser.parse_args()
    
    if args.command == "init-global": cmd_init_global(args)
    elif args.command == "init-project": cmd_init_project(args)
    elif args.command == "remember": cmd_remember(args)
    elif args.command == "search": cmd_search(args)
    elif args.command == "perceive": cmd_perceive(args)
    elif args.command == "reflect": cmd_reflect(args)
    elif args.command == "migrate": cmd_migrate(args)
    else: parser.print_help()

if __name__ == "__main__":
    main()
