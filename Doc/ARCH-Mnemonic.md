# 技术架构文档：Mnemonic

## 1. 系统概览

Mnemonic 由两个独立子系统组成：

- **记忆系统核心** — Python CLI，负责记忆的存储、检索、推荐和反思
- **CLI 安装工具** — TypeScript/Node.js CLI，负责将 Skill 安装到各种 AI Agent

两个子系统通过文件系统解耦：CLI 工具将记忆系统（作为 Skill）安装到 Agent 的 skills 目录，Agent 在运行时直接调用 Python 脚本。

```
┌─────────────────────────────────────────────────┐
│                   用户 / AI Agent                 │
│  (Trae, Claude Code, Cursor, Windsurf, ...)     │
└──────────┬──────────────────────┬───────────────┘
           │ npx mnemonic add    │ python memory_cli.py
           ▼                     ▼
┌──────────────────┐  ┌──────────────────────────┐
│  CLI 安装工具     │  │    记忆系统核心            │
│  (TypeScript)    │  │    (Python)              │
│                  │  │                          │
│  add / list /    │  │  remember / search /     │
│  remove / init   │  │  perceive / reflect /    │
│                  │  │  migrate                 │
└────────┬─────────┘  └────────┬─────────────────┘
         │ symlink/copy         │ read/write
         ▼                     ▼
┌──────────────────────────────────────────────────┐
│                    文件系统                        │
│                                                  │
│  ~/.mnemonic/          项目/.mnemonic/            │
│  ├── RULES.md          ├── SESSION.md            │
│  ├── JOURNAL/          ├── DECISIONS.md          │
│  └── audit.jsonl       └── audit.jsonl           │
│                                                  │
│  Agent skills 目录（如 .trae/skills/）             │
│  └── universal-memory/                           │
│      ├── SKILL.md                                │
│      └── scripts/memory_cli.py                   │
└──────────────────────────────────────────────────┘
```

## 2. 子系统 A：记忆系统核心

### 2.1 技术选型

| 项目 | 选择 | 理由 |
|------|------|------|
| 语言 | Python 3.8+ | 零依赖，所有 Agent 环境均可运行 |
| 存储 | Markdown + JSONL | 人类可读，无需数据库 |
| 入口 | `scripts/memory_cli.py` | 单文件，约 550 行 |

### 2.2 双层存储架构

```
全局层 (~/.mnemonic/)              项目层 (项目/.mnemonic/)
┌─────────────────────┐           ┌─────────────────────┐
│ COLD: RULES.md      │           │ HOT: SESSION.md     │
│  - preference        │           │  - correction        │
│  - constraint        │           │                     │
├─────────────────────┤           ├─────────────────────┤
│ WARM: JOURNAL/      │           │ HOT: DECISIONS.md   │
│  - reflect (按日期)   │           │  - decision          │
├─────────────────────┤           ├─────────────────────┤
│ history/            │           │ history/            │
│  - 归档的废弃记忆     │           │  - 归档的废弃记忆     │
├─────────────────────┤           ├─────────────────────┤
│ audit.jsonl         │           │ audit.jsonl         │
└─────────────────────┘           └─────────────────────┘
```

### 2.3 记忆路由规则

```python
# route_memory() 的路由逻辑
scope == "auto" 时：
  preference / constraint → 全局 RULES.md
  decision / correction   → 项目层（需 project_dir）
  reflect                 → 全局 JOURNAL/

scope == "global" 时：全部写入全局层
scope == "project" 时：全部写入项目层
```

### 2.4 WAL 写入格式

每条记忆以 WAL 格式追加写入，包含溯源元数据：

```
- [2026-03-16 14:30:00] [PREFERENCE] 用户偏好函数式编程风格 (nonce: a1b2c3d4) <!-- META: {"source":"user_dialog","confidence":0.9} -->
```

字段说明：
- 时间戳：写入时间
- 类型标签：PREFERENCE / DECISION / CONSTRAINT / CORRECTION
- 内容：用户原文
- nonce：8 位 UUID，用于审计追溯
- META 注释：溯源元数据（source: user_dialog/agent_infer/reflection，confidence: 0.0-1.0）

冲突标记格式（DEPRECATED）：
```
- ~~[2026-03-16 14:30:00] [DECISION] 使用 PostgreSQL (nonce: a1b2c3d4)~~ [DEPRECATED by nonce:b2c3d4e5]
```

### 2.5 冲突检测与归档

```
remember(content) 写入流程：

1. 路由到目标文件
2. detect_conflict(target_file, mem_type, content)
   ├── 扫描同类型已有记忆
   ├── 提取关键词计算相似度（复用 extract_keywords 的正则）
   └── 相似度 > 0.7 → 返回冲突列表
3. mark_deprecated(target_file, conflicts, new_nonce)
   └── 将冲突行标记为 ~~原文~~ [DEPRECATED by nonce:xxx]
4. 追加写入新记忆（含 META 注释）
5. check_file_size(target_file, threshold=200)
   └── 超过阈值 → 输出警告

archive 命令流程：
1. 扫描目标文件中的 DEPRECATED 记忆
2. 移动到 history/{filename}_{date}.md
3. 从原文件中删除已归档行
```

### 2.5 搜索与推荐流程

```
perceive(context) 流程：

1. extract_keywords(context)
   ├── 英文：正则 [a-zA-Z]{2,}，过滤停用词
   ├── 中文：模式匹配约 83 个技术术语
   └── 英中映射：EN_TO_ZH_KEYWORDS 双语扩展（52 组）

2. search_all_sources(keywords, project_dir)
   ├── global/rules    (权重 0.9)
   ├── global/journal  (权重 1.0，最近 30 天)
   ├── project/session  (权重 1.2)
   └── project/decisions (权重 1.1)

3. calculate_relevance(memories, keywords)
   score = base_score × time_decay × source_weight
   ├── base_score: 精确匹配 1.0 / 包含匹配 0.85 / 默认 0.8
   └── time_decay: 7天 1.0 / 30天 0.9 / 90天 0.8 / 更早 0.7

4. format_recommendations(top_10)
   └── 按类型格式化：💡洞察 / 👤偏好 / ⚠️约束 / 📌决策 / 🪞反思
```

### 2.6 反思日志格式

写入 `~/.mnemonic/JOURNAL/YYYY-MM-DD.md`：

```markdown
### Reflection: 重构登录模块
- Outcome: success
- Confidence: 0.9
- Insight: 使用了通用的异常捕获，下次应该更具体
```

## 3. 子系统 B：CLI 安装工具

### 3.1 技术选型

| 项目 | 选择 | 理由 |
|------|------|------|
| 语言 | TypeScript | 类型安全，npm 生态 |
| 运行时 | Node.js 18+ | 广泛安装基础 |
| CLI 框架 | yargs | 成熟的命令行解析 |
| 文件操作 | fs-extra | 增强的文件系统操作 |
| Git 操作 | execa | 子进程调用 git clone |
| 交互 | prompts | 交互式选择 |
| 输出 | chalk + ora | 彩色输出 + spinner |
| Frontmatter | gray-matter | 解析 SKILL.md 元数据 |

### 3.2 模块结构

```
src/
├── index.ts          # 入口，调用 cli()
├── cli.ts            # yargs 命令定义（add/list/remove/init）
├── add.ts            # add 命令实现
├── list.ts           # list 命令实现
├── remove.ts         # remove 命令实现
├── init.ts           # init 命令实现（Skill 模板生成）
├── agents.ts         # 42 种 Agent 定义 + 检测逻辑
├── skills.ts         # Skill 发现（36 个搜索路径 + Plugin Manifest）
├── installer.ts      # 安装逻辑（symlink/copy + lock 文件）
├── source-parser.ts  # 来源解析（GitHub/GitLab/Git/Local；npm 解析已实现但安装未完成）
├── git.ts            # Git 操作（clone/commit/cleanup）
└── types.ts          # 类型定义
```

### 3.3 来源解析流程

```
parseSource(input) 流程：

input 类型判断：
├── ./path 或 ../path 或 /abs   → local
├── owner/repo                  → github shorthand
├── https://github.com/...      → github url
├── https://gitlab.com/...      → gitlab url
├── git://... 或 ssh://...      → git url
└── package-name                → npm（TODO：解析已实现，但安装流程未完成）
```

### 3.4 Skill 发现流程

```
discoverSkills(source) 流程：

1. getRepoPath(source)
   ├── local → 直接使用路径
   └── remote → git clone --depth 1 到临时目录

2. 三阶段发现：
   ├── discoverFromPluginManifests()  # .claude-plugin/marketplace.json
   ├── discoverFromSearchPaths()      # 36 个路径模式下的子目录
   └── discoverFromRoot()             # 根目录 SKILL.md

3. parseSkillFile(SKILL.md)
   ├── gray-matter 解析 frontmatter → name, description
   └── 无 frontmatter → 从正文提取 description

4. 清理临时目录（非 local 来源）
```

### 3.5 安装流程

```
installSkill(skill, agents, options) 流程：

对每个 agent：
1. resolveAgentPath(agent, global)
   ├── global → agent.globalPath（如 ~/.trae/skills/）
   └── project → cwd + agent.projectPath（如 .trae/skills/）

2. 清理已有安装（symlink 或目录）

3. 安装方式：
   ├── --copy → fs.copy(source, target)
   └── 默认   → fs.symlink(source, target)
   └── symlink 失败 → 自动回退到 copy

4. updateLockFile()
   → 写入 .mnemonic/skills-lock.json
```

### 3.6 Agent 支持矩阵（42 种）

当前支持的 Agent 及其 skills 目录：

| Agent | 项目路径 | 全局路径 |
|-------|---------|---------|
| Trae | .trae/skills/ | ~/.trae/skills/ |
| Claude Code | .claude/skills/ | ~/.claude/skills/ |
| Cursor | .agents/skills/ | ~/.cursor/skills/ |
| Windsurf | .windsurf/skills/ | ~/.codeium/windsurf/skills/ |
| Codex | .agents/skills/ | ~/.codex/skills/ |
| Cline | .agents/skills/ | ~/.agents/skills/ |
| ... | （共 42 种） | |

Agent 检测通过扫描特征文件实现（如 .trae/rules、.cursorrules 等）。

## 4. 数据流

### 4.1 安装流程

```
用户 → npx mnemonic add universal-memory -a trae
       │
       ▼
  source-parser.ts → 识别为 built-in skill
       │
       ▼
  skills.ts → 发现 skills/universal-memory/SKILL.md
       │
       ▼
  agents.ts → 解析目标 Agent（trae）
       │
       ▼
  installer.ts → symlink skills/universal-memory/ → .trae/skills/universal-memory/
       │
       ▼
  installer.ts → 更新 skills-lock.json
```

### 4.2 记忆写入流程

```
AI Agent → python memory_cli.py remember "偏好函数式" --type preference
           │
           ▼
     route_memory() → scope=auto, type=preference → 全局
           │
           ▼
     追加写入 ~/.mnemonic/RULES.md（WAL 格式）
           │
           ▼
     write_audit() → 追加 ~/.mnemonic/audit.jsonl
```

### 4.3 推荐流程

```
AI Agent → python memory_cli.py perceive "用户询问如何重构登录模块"
           │
           ▼
     extract_keywords() → ["重构", "登录", "模块", "refactor", "login"]
           │
           ▼
     search_all_sources() → 搜索 4 个数据源
           │
           ▼
     calculate_relevance() → 评分排序
           │
           ▼
     format_recommendations() → JSON 输出
```

## 5. 关键设计决策

| 决策 | 选择 | 替代方案 | 理由 |
|------|------|---------|------|
| 存储格式 | Markdown + JSONL | SQLite / JSON | 人类可读，可直接编辑，无需额外依赖 |
| 安装方式 | Symlink 优先 | 仅 Copy | 节省磁盘空间，源码更新自动同步 |
| 关键词提取 | 正则 + 模式匹配 | NLP 分词库 | 零依赖，覆盖常见技术术语 |
| 搜索算法 | 关键词匹配 + 权重 | 向量相似度 | 零依赖，对技术术语效果足够好 |
| 双层架构 | 全局 + 项目 | 单层 | 偏好跨项目共享，决策项目隔离 |
| Agent 适配 | 统一 skills 目录约定 | 各 Agent 独立适配 | 一套代码支持 42 种 Agent |

## 6. 目录结构

```
mnemonic/
├── src/                          # CLI 安装工具源码
│   ├── index.ts                  # 入口
│   ├── cli.ts                    # 命令定义
│   ├── add.ts                    # add 命令
│   ├── list.ts                   # list 命令
│   ├── remove.ts                 # remove 命令
│   ├── init.ts                   # init 命令
│   ├── agents.ts                 # Agent 定义与检测
│   ├── skills.ts                 # Skill 发现与解析
│   ├── installer.ts              # 安装与 lock 管理
│   ├── source-parser.ts          # 来源解析
│   ├── git.ts                    # Git 操作
│   └── types.ts                  # 类型定义
├── skills/
│   └── universal-memory/         # 内置记忆 Skill
│       ├── SKILL.md              # Skill 定义（frontmatter + 文档）
│       └── scripts/
│           └── memory_cli.py     # 记忆系统核心（550 行）
├── dist/                         # 编译输出
├── package.json                  # npm 配置
├── tsconfig.json                 # TypeScript 配置
└── Doc/                          # 项目文档
    ├── BRIEF-Mnemonic.md         # 产品简报
    ├── PRD-Mnemonic.md           # PRD
    └── ARCH-Mnemonic.md          # 本文档
```

---

**版本：** 1.0.0
**创建日期：** 2026-03-16
**基于：** 现有代码实现
**状态：** 已完成
