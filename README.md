# Mnemonic - 通用 Agent 记忆系统

`#AgentMemory` `#通用记忆系统` `#智能体存储` `#AI记忆` `#持久化记忆` `#跨会话记忆`

**让 AI Agent 拥有持久记忆，实现跨会话知识积累与智能决策**

Mnemonic 是一个为 AI Agent 设计的通用记忆系统，提供 **全局 + 项目** 双层存储架构。通过 WAL (Write-Ahead Logging) 协议确保数据完整性，支持语义检索、上下文感知推荐和结构化自我反思，让 Agent 能够"记住"用户偏好、项目决策和历史经验。

## ✨ 核心特性

- 🧠 **双层存储架构** - 全局记忆跨项目共享，项目记忆独立隔离，智能路由自动选择存储层
- 📝 **WAL 写入协议** - 可靠的 Write-Ahead Logging，结构化格式确保记忆完整性与可追溯性
- 🔍 **语义检索引擎** - 跨层级搜索相关记忆，智能匹配用户偏好、约束和历史决策
- 💡 **上下文感知推荐** - 基于当前对话自动推荐相关记忆，主动预防重复错误
- 🪞 **自我反思机制** - 任务完成后记录洞察与经验，实现持续学习与能力进化
- ⚡ **零依赖设计** - 纯 Python 实现，无需外部数据库或第三方服务

## � 项目结构

```
mnemonic/
├── src/                          # TypeScript CLI 源码 (mnemonic 命令)
│   ├── cli.ts                    # CLI 入口
│   ├── add.ts                    # 安装 skill 命令
│   ├── list.ts                   # 列出已安装 skills
│   ├── remove.ts                 # 移除 skills
│   ├── agents.ts                 # 支持的 Agent 定义 (43种)
│   └── ...
├── skills/
│   └── universal-memory/         # Universal Memory Skill
│       ├── SKILL.md              # Skill 定义文件
│       └── scripts/
│           └── memory_cli.py     # 记忆系统核心 CLI
└── package.json
```

**两层命令体系：**
- `mnemonic` - TypeScript CLI，用于管理 skills（安装、列表、移除）
- `memory_cli.py` - Python CLI，记忆系统核心功能（存储、搜索、反思）

## �🚀 快速开始

### 安装

```bash
# 安装到 Trae
npx mnemonic add universal-memory -a trae

# 安装到 Claude Code
npx mnemonic add universal-memory -a claude-code

# 安装到 Cursor
npx mnemonic add universal-memory -a cursor

# 安装到全局 (所有项目可用)
npx mnemonic add universal-memory -g -a trae

# 安装到多个 Agent
npx mnemonic add universal-memory -a trae -a claude-code -a cursor

# 列出已安装的 skills
npx mnemonic list

# 移除 skill
npx mnemonic remove universal-memory -a trae
```

支持的 Agent：Trae、Trae CN、Claude Code、Cursor、Windsurf、Codex、Cline、Augment、Continue、Goose、Gemini CLI、Roo、Junie、Kiro、Qwen Code、OpenHands、Amp、Antigravity、CodeBuddy、Command Code、Cortex、Crush、Droid、GitHub Copilot、iFlow CLI、Kimi CLI、Kilo、Kode、MCPJam、Mistral Vibe、Mux、OpenCode、OpenClaw、Pi、Qoder、Replit、Zencoder、Neovate、Pochi、AdaL、Universal 等 43 种编码代理。

### 初始化

安装完成后，Agent 会在首次使用时自动初始化记忆存储，无需手动操作：

- **全局记忆** - 当用户表达跨项目偏好时自动创建 `~/.mnemonic/` 目录
- **项目记忆** - 当在项目中首次存储决策时自动创建 `.mnemonic/` 目录

如需手动初始化，可执行：

```bash
# 初始化全局记忆存储
python3 scripts/memory_cli.py init-global

# 在项目目录中初始化项目记忆
python3 scripts/memory_cli.py init-project

# 或指定项目路径
python3 scripts/memory_cli.py init-project --project-dir /path/to/project
```

## 💡 应用场景

### 场景1：错误预防

```
历史：reflect 记录 "重构登录模块失败：使用了过时的 API"
当前：用户询问 "如何重构认证模块？"
perceive：推荐 "上次重构登录时使用了过时 API，请检查 API 版本"
```

### 场景2：最佳实践复用

```
历史：reflect 记录 "性能优化成功：使用缓存策略提升了 50% 性能"
当前：用户询问 "如何优化查询性能？"
perceive：推荐 "之前使用缓存策略成功提升 50% 性能，可参考"
```

### 场景3：用户偏好学习

```
历史：remember 记录 "用户偏好函数式编程风格"
当前：用户询问 "如何实现数据处理？"
perceive：推荐 "用户偏好函数式风格，建议使用 map/filter/reduce"
```

### 场景4：跨项目知识迁移

```
历史：项目A 的 decision "使用 Redis 做会话存储"
当前：在项目B 询问 "会话存储方案？"
perceive：推荐 "项目A 使用 Redis 做会话存储，可参考"
```

## 📖 使用指南

> **工作机制**：以下功能由 Agent 通过自然语言自动触发，命令行工具在后台执行。用户只需正常对话，Agent 会自动识别意图并调用相应功能。

### 存储记忆 (remember)

Agent 会自动识别用户表达并存储相应类型的记忆：

| 触发示例 | 记忆类型 | 存储位置 |
|---------|---------|---------|
| "记住我喜欢简洁的回复" | `preference` | 全局 RULES.md |
| "不要使用 var 关键字" | `constraint` | 全局 RULES.md |
| "这个项目使用 PostgreSQL" | `decision` | 项目 DECISIONS.md |
| "上次用错了 API 版本" | `correction` | 项目 SESSION.md |

<details>
<summary>🔧 后台命令 (由 Agent 自动调用)</summary>

```bash
# 全局偏好 (自动路由到全局)
python3 scripts/memory_cli.py remember "用户偏好函数式编程风格" --type preference

# 项目决策 (需要指定项目目录)
python3 scripts/memory_cli.py remember "API 采用 REST 架构" --type decision --project-dir /path/to/project

# 显式指定范围
python3 scripts/memory_cli.py remember "始终使用 TypeScript" --type constraint --scope global
python3 scripts/memory_cli.py remember "API 采用 REST 架构" --type decision --scope project --project-dir /path/to/project

# 带溯源元数据
python3 scripts/memory_cli.py remember "用户偏好简洁回复" --type preference --source user_dialog --confidence 0.9
```

</details>

### 搜索记忆 (search)

当用户询问历史偏好或决策时，Agent 会自动搜索相关记忆：

| 触发示例 | 搜索行为 |
|---------|---------|
| "我之前说过什么偏好？" | 搜索全局 preference |
| "这个项目做了什么决策？" | 搜索项目 decision |
| "关于数据库有什么记录？" | 跨层搜索关键词 |

<details>
<summary>🔧 后台命令 (由 Agent 自动调用)</summary>

```bash
# 自动搜索 (优先项目层，然后全局层)
python3 scripts/memory_cli.py search "数据库" --project-dir /path/to/project

# 仅搜索全局层
python3 scripts/memory_cli.py search "偏好" --scope global

# 仅搜索项目层
python3 scripts/memory_cli.py search "决策" --scope project --project-dir /path/to/project

# 搜索归档记忆
python3 scripts/memory_cli.py search "数据库" --include-archive --project-dir /path/to/project

# JSON 格式输出 (便于程序处理)
python3 scripts/memory_cli.py search "数据库" --json
```

</details>

### 自我反思 (reflect)

任务完成后，Agent 会自动记录经验教训，实现持续学习：

| 触发场景 | 反思内容 |
|---------|---------|
| 任务成功 | 记录成功经验与最佳实践 |
| 任务失败 | 记录错误原因与改进方向 |
| 学习新知 | 记录关键洞察与适用条件 |

<details>
<summary>🔧 后台命令 (由 Agent 自动调用)</summary>

```bash
python3 scripts/memory_cli.py reflect \
  --task "重构登录模块" \
  --outcome success \
  --confidence 0.9 \
  --insight "使用了通用的异常捕获，下次应该更具体"
```

</details>

### 主动感知 (perceive)

Agent 会基于当前对话上下文，主动推荐相关记忆：

| 触发场景 | 推荐行为 |
|---------|---------|
| 用户询问技术方案 | 推荐相关历史决策 |
| 用户表达偏好 | 推荐相关约束和偏好 |
| 用户遇到问题 | 推荐相关错误预防经验 |

<details>
<summary>🔧 后台命令 (由 Agent 自动调用)</summary>

```bash
python3 scripts/memory_cli.py perceive "用户正在询问关于登录模块的重构" --project-dir /path/to/project
```

</details>

## 🏗️ 架构设计

### 双层存储结构

```
~/.mnemonic/                    # 全局记忆 (跨项目共享)
├── RULES.md                    # 全局偏好与约束
├── JOURNAL/                    # 全局反思日志 (YYYY-MM-DD.md)
├── history/                    # 归档记忆
└── audit.jsonl                 # 全局审计日志

项目目录/.mnemonic/              # 项目记忆 (项目特定)
├── SESSION.md                  # 项目会话上下文
├── DECISIONS.md                # 项目决策记录
├── history/                    # 归档记忆
└── audit.jsonl                 # 项目审计日志
```

### 记忆路由规则

| 记忆类型 | 存储层 | 文件 | 说明 |
|---------|-------|------|------|
| `preference` | 全局 COLD | ~/.mnemonic/RULES.md | 用户偏好，跨项目生效 |
| `constraint` | 全局 COLD | ~/.mnemonic/RULES.md | 约束条件，跨项目生效 |
| `decision` | 项目 HOT | 项目/.mnemonic/DECISIONS.md | 项目决策，仅当前项目 |
| `correction` | 项目 HOT | 项目/.mnemonic/SESSION.md | 纠正记录，项目特定 |
| `reflect` | 全局 WARM | ~/.mnemonic/JOURNAL/ | 反思日志，跨项目学习 |

## 📋 命令参考

### mnemonic CLI (Skill 管理)

| 命令 | 说明 |
|-----|------|
| `add <source>` | 从源安装 skill (GitHub、本地路径、URL) |
| `list` / `ls` | 列出已安装的 skills |
| `remove [skills...]` | 移除已安装的 skills |
| `init [name]` | 创建新的 SKILL.md 模板 |

**add 命令选项：**
- `-g, --global` - 安装到全局目录
- `-a, --agent <agents...>` - 指定目标 Agent
- `-s, --skill <names...>` - 指定要安装的 skill 名称
- `-l, --list` - 列出可用 skills 而不安装
- `--copy` - 复制文件而非符号链接
- `-y, --yes` - 跳过确认提示
- `--all` - 安装所有 skills 到所有 agents

**remove 命令选项：**
- `-g, --global` - 从全局范围移除
- `-a, --agent <agents...>` - 从指定 Agent 移除
- `-y, --yes` - 跳过确认提示
- `--all` - 移除所有 skills

### memory_cli.py (记忆系统核心)

| 命令 | 说明 |
|-----|------|
| `init-global` | 初始化全局记忆存储 |
| `init-project` | 初始化项目记忆存储 |
| `remember` | 存储 WAL 格式的记忆（支持溯源元数据和冲突检测） |
| `search` | 跨层检索记忆（支持 --include-archive 搜索归档） |
| `reflect` | 记录自我反思日志 |
| `perceive` | 主动推荐相关记忆 |
| `archive` | 归档已废弃的记忆到 history/ 目录 |
| `migrate` | 迁移旧版数据到新架构 |

## 🆕 v2.1 新增功能

### 记忆溯源元数据

每条记忆自动记录来源和置信度，支持追溯：

```
- [2026-03-16 14:30:00] [PREFERENCE] 用户偏好函数式编程 (nonce: a1b2c3d4) <!-- META: {"source":"user_dialog","confidence":0.9} -->
```

参数：`--source user_dialog|agent_infer|reflection`，`--confidence 0.0-1.0`

### 记忆冲突检测

写入新记忆时自动检测同类型的旧记忆，相似度 >70% 的旧记忆会被标记为 DEPRECATED：

```bash
python3 scripts/memory_cli.py remember "使用 PostgreSQL" --type decision --project-dir .
python3 scripts/memory_cli.py remember "改用 MongoDB" --type decision --project-dir .
# 第一条自动标记为 DEPRECATED
```

### 记忆归档

文件超过 200 行时自动警告，使用 `archive` 命令清理已废弃的记忆：

```bash
python3 scripts/memory_cli.py archive --project-dir .
# 自动将 DEPRECATED 记忆移到 history/ 目录
```

## 🔧 系统要求

- Node.js 18.0.0+ (用于 mnemonic CLI)
- Python 3.8+ (用于 memory_cli.py)
- 无外部依赖

## 📄 许可证

MIT License

---

*Mnemonic - 让 AI Agent 拥有持久记忆*
