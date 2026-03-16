---
name: universal-memory
description: 通用记忆系统，持久化用户偏好、决策和约束。Triggers: 记住, 我喜欢, 我偏好, 不要, 必须, 始终, 之前说过, remember, preference, decision, constraint. Use when user expresses preferences, sets constraints, makes decisions, or asks about previous memories. Supports dual-layer storage (Global + Project) and self-reflection.
---

# Universal Memory (Mnemonic)

**Dual-Layer Memory Architecture for Any AI Agent.**

This skill provides a self-contained memory system with **Global + Project** dual-layer storage. It implements the "Mnemonic" pattern: WAL-based tiered storage (Hot/Warm/Cold), context-aware recommendation, and structured self-reflection.

## Architecture

### Dual-Layer Storage

```
~/.mnemonic/                    # Global Memory (Cross-Project)
├── RULES.md                    # Global preferences & constraints
├── JOURNAL/                    # Global reflection logs (YYYY-MM-DD.md)
└── audit.jsonl                 # Global audit log

项目目录/.mnemonic/              # Project Memory (Project-Specific)
├── SESSION.md                  # Project session context
├── DECISIONS.md                # Project decisions
└── audit.jsonl                 # Project audit log
```

### Memory Routing Rules

| Memory Type | Layer | File | Description |
|------------|-------|------|-------------|
| `preference` | Global COLD | ~/.mnemonic/RULES.md | User preferences, cross-project |
| `constraint` | Global COLD | ~/.mnemonic/RULES.md | Constraints, cross-project |
| `decision` | Project HOT | 项目/.mnemonic/DECISIONS.md | Project decisions |
| `correction` | Project HOT | 项目/.mnemonic/SESSION.md | Corrections, project-specific |
| `reflect` | Global WARM | ~/.mnemonic/JOURNAL/ | Reflection logs, cross-project learning |

## Quick Start

### 1. Initialize

```bash
# Initialize global memory
python3 scripts/memory_cli.py init-global

# Initialize project memory (in project directory)
python3 scripts/memory_cli.py init-project

# Or specify project path
python3 scripts/memory_cli.py init-project --project-dir /path/to/project
```

### 2. Remember (WAL Storage)

```bash
# Global preference (auto-routed to global)
python3 scripts/memory_cli.py remember "User prefers concise responses" --type preference

# Project decision (specify project directory)
python3 scripts/memory_cli.py remember "Use PostgreSQL as database" --type decision --project-dir /path/to/project

# Explicit scope
python3 scripts/memory_cli.py remember "Always use TypeScript" --type constraint --scope global
python3 scripts/memory_cli.py remember "API uses REST architecture" --type decision --scope project --project-dir /path/to/project
```

### 3. Search (Cross-Layer Retrieval)

```bash
# Auto search (project first, then global)
python3 scripts/memory_cli.py search "database" --project-dir /path/to/project

# Global only
python3 scripts/memory_cli.py search "preference" --scope global

# Project only
python3 scripts/memory_cli.py search "decision" --scope project --project-dir /path/to/project

# JSON output
python3 scripts/memory_cli.py search "database" --json --project-dir /path/to/project
```

### 4. Reflect (Self-Reflection)

```bash
python3 scripts/memory_cli.py reflect --task "Refactor login" --outcome success --confidence 0.9 --insight "Used generic catch-all, should be more specific next time"
```

### 5. Perceive (Active Recommendation)

```bash
python3 scripts/memory_cli.py perceive "The user is asking about the refactoring of login module"
```

### 6. Migrate Legacy Data

```bash
python3 scripts/memory_cli.py migrate
```

## Tools

When this skill is activated, the following tools are available for AI to call automatically:

### `remember`
Store a key fact using WAL protocol. Use for preferences, decisions, constraints, or corrections.

**Arguments:**
- `content` (string, required): The fact to remember
- `type` (string, optional): One of `preference`, `decision`, `constraint`, `correction`. Default: `preference`
- `scope` (string, optional): `auto`, `global`, or `project`. Default: `auto`
- `project_dir` (string, required for decision/correction): Project directory path for project-scoped memories
- `source` (string, optional): Memory source — `user_dialog`, `agent_infer`, or `reflection`. Default: `user_dialog`
- `confidence` (string, optional): Confidence score 0.0-1.0. Default: `0.9`

**Auto-routing logic:**
- `preference` and `constraint` → Global storage (`~/.mnemonic/RULES.md`)
- `decision` and `correction` → Project storage (`project_dir` required, error if not provided)

**Conflict detection:**
- Before writing, detects existing memories of the same type with >70% keyword similarity
- Conflicting old memories are automatically marked as `[DEPRECATED]`
- Audit log records conflict events

**Provenance metadata:**
- Each memory includes a META comment: `<!-- META: {"source":"user_dialog","confidence":0.9} -->`
- Old format memories (without META) are treated as source=unknown, confidence=0.8

### `search`
Search for relevant context across all memory layers.

**Arguments:**
- `query` (string, required): The search term
- `scope` (string, optional): `auto`, `global`, or `project`. Default: `auto`
- `project_dir` (string, optional): Project directory path
- `limit` (integer, optional): Max results. Default: 5
- `include-archive` (flag, optional): Also search archived memories in history/

**Notes:**
- DEPRECATED memories are automatically filtered out
- Results include `source` and `confidence` metadata from provenance tracking

**Search priority (auto mode):**
1. Project layer first (more specific)
2. Global layer second (general preferences)
3. Merge and sort by relevance score

**Source weights:**
- `project/session`: 1.2 (most relevant)
- `project/decisions`: 1.1
- `global/journal`: 1.0
- `global/rules`: 0.9

### `perceive`
Proactively find relevant memories based on current conversation context. Extract keywords, search across all memory layers, and return actionable recommendations.

**Arguments:**
- `context` (string, required): The recent conversation text
- `project_dir` (string, optional): Project directory path

**Returns:**
- `keywords`: Extracted keywords from context (中英文关键词)
- `related_memories`: Matching memories with relevance scores
- `recommendations`: Actionable suggestions based on memories

**Example:**
```json
Input: "用户询问如何重构登录模块"
Output:
{
  "keywords": ["登录", "模块", "重构"],
  "related_memories": [
    {
      "source": "global/journal/2026-03-15.md",
      "content": "- Insight: 应使用具体异常而非通用捕获",
      "relevance": 0.92
    }
  ],
  "recommendations": [
    "💡 洞察: 应使用具体异常而非通用捕获"
  ]
}
```

**应用场景:**
- 错误预防：提醒之前的失败教训
- 最佳实践复用：复用成功的解决方案
- 用户偏好学习：应用之前的学习
- 跨项目知识迁移：复用其他项目的经验

### `reflect`
Perform self-reflection after completing a significant task. Logs insights for future reference.

**Arguments:**
- `task` (string, required): Description of the task
- `outcome` (string, required): `success`, `failure`, or `partial`
- `confidence` (string, optional): Self-assessed confidence 0.0-1.0. Default: "0.8"
- `insight` (string, required): Key learning from this task

### `init-project`
Initialize project memory storage. Call this when starting work on a new project.

**Arguments:**
- `project_dir` (string, optional): Project directory path. Default: current working directory

## When to Use This Skill

**Proactively use this skill when:**
1. User expresses a preference (e.g., "I like...", "I prefer...", "Always...", "我喜欢...", "我偏好...", "始终...")
2. User sets a constraint (e.g., "Don't...", "Never...", "Must...", "不要...", "绝不...", "必须...")
3. A significant decision is made during the conversation
4. Starting a new project (call `init-project`)
5. Completing a significant task (call `reflect`)
6. User asks about previous preferences or decisions (e.g., "我之前说过...", "之前提到过...")

**中文触发示例:**
- "记住我喜欢简洁的回复" → `remember` with type `preference`
- "我偏好使用 TypeScript" → `remember` with type `preference`
- "这个项目使用 PostgreSQL" → `remember` with type `decision`
- "不要使用 var 关键字" → `remember` with type `constraint`
- "必须使用 ESLint" → `remember` with type `constraint`
- "我之前说过什么偏好？" → `search`
- "之前提到过什么决策？" → `search`

**English trigger examples:**
- "Remember I like concise responses" → `remember` with type `preference`
- "I prefer TypeScript" → `remember` with type `preference`
- "This project uses PostgreSQL" → `remember` with type `decision`
- "Don't use var keyword" → `remember` with type `constraint`
- "What did I say before?" → `search`

## Command Reference (CLI)

### `init-global`
Initialize global memory storage at `~/.mnemonic/`.

### `init-project`
Initialize project memory storage at `项目目录/.mnemonic/`.

**Options:**
- `--project-dir`: Project directory path (default: current directory)

### `remember`
Store a memory with WAL protocol.

**Arguments:**
- `content`: The fact to remember

**Options:**
- `--type`: One of `preference`, `decision`, `constraint`, `correction` (default: `preference`)
- `--scope`: `auto`, `global`, or `project` (default: `auto`)
- `--project-dir`: Project directory path
- `--json`: Output as JSON

### `search`
Search memories across layers.

**Arguments:**
- `query`: Search term

**Options:**
- `--scope`: `auto`, `global`, or `project` (default: `auto`)
- `--project-dir`: Project directory path
- `--limit`: Max results (default: 5)
- `--json`: Output as JSON

### `reflect`
Log a self-reflection after completing a task.

**Options:**
- `--task`: Task description (required)
- `--outcome`: `success`, `failure`, or `partial` (required)
- `--confidence`: Self-assessed confidence 0.0-1.0 (default: 0.8)
- `--insight`: Key learning (required)

### `perceive`
Extract keywords from context and find related memories.

**Arguments:**
- `context` (string, required): Context text
- `--project-dir` (string, optional): Project directory path
- `--json` (flag, optional): Output as JSON (default behavior)

### `migrate`
Migrate legacy `.mnemonic_data/` to new dual-layer architecture.

### `archive`
Archive old/deprecated memories to history/ directory. DEPRECATED memories are archived automatically. File size warnings are shown when memory files exceed 200 lines.

**Arguments:**
- `--scope` (string, optional): `auto`, `global`, or `project`. Default: `auto`
- `--project-dir` (string, optional): Project directory path
- `--json` (flag, optional): Output as JSON

**Archive behavior:**
- Automatically archives all DEPRECATED memories to `history/{filename}_{date}.md`
- Shows file size warnings for files exceeding 200 lines
- Archived memories can be searched with `search --include-archive`

**Archive locations:**
- Global: `~/.mnemonic/history/`
- Project: `项目/.mnemonic/history/`

## Search Priority

When using `--scope auto`:

1. **Project layer first** - More specific, more relevant (session: 1.2, decisions: 1.1)
2. **Global layer second** - General preferences and constraints (journal: 1.0, rules: 0.9)
3. **Merge and sort** - By relevance score (base_score × time_decay × source_weight)

## Installation

### Global Installation

```bash
# Copy skill to global location
mkdir -p ~/.trae/skills
cp -r . ~/.trae/skills/Universal\ Memory/

# Initialize global memory
python ~/.trae/skills/Universal\ Memory/scripts/memory_cli.py init-global
```

### Per-Project Setup

```bash
# In your project directory
python ~/.trae/skills/Universal\ Memory/scripts/memory_cli.py init-project
```

## Dependencies

- Python 3.8+ (No external libraries required for core functionality)

---
*Universal Memory Skill v2.0 - Dual-Layer Memory Architecture*
