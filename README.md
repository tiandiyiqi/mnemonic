# Mnemonic - 通用记忆系统

**适用于任何 AI Agent 的双层记忆架构**

Mnemonic 是一个独立的记忆技能系统，提供 **全局 + 项目** 双层存储架构。实现了 WAL (Write-Ahead Logging) 分层存储 (Hot/Warm/Cold)、上下文感知推荐和结构化自我反思功能。

## 核心特性

- 🧠 **双层存储** - 全局记忆跨项目共享，项目记忆独立隔离
- 📝 **WAL 协议** - 可靠的写入前日志，确保数据完整性
- 🔍 **语义检索** - 跨层级搜索相关记忆
- 💡 **主动推荐** - 基于上下文自动推荐相关记忆
- 🪞 **自我反思** - 任务完成后记录洞察，持续学习
- ⚡ **零依赖** - 纯 Python 实现，无需外部库

## 架构设计

### 双层存储结构

```
~/.mnemonic/                    # 全局记忆 (跨项目共享)
├── RULES.md                    # 全局偏好与约束
├── JOURNAL/                    # 全局反思日志 (YYYY-MM-DD.md)
└── audit.jsonl                 # 全局审计日志

项目目录/.mnemonic/              # 项目记忆 (项目特定)
├── SESSION.md                  # 项目会话上下文
├── DECISIONS.md                # 项目决策记录
└── audit.jsonl                 # 项目审计日志
```

### 记忆路由规则

| 记忆类型 | 存储层 | 文件位置 | 说明 |
|---------|-------|---------|------|
| `preference` | 全局 COLD | ~/.mnemonic/RULES.md | 用户偏好，跨项目生效 |
| `constraint` | 全局 COLD | ~/.mnemonic/RULES.md | 约束条件，跨项目生效 |
| `decision` | 项目 HOT | 项目/.mnemonic/DECISIONS.md | 项目决策，仅当前项目 |
| `correction` | 项目 HOT | 项目/.mnemonic/SESSION.md | 纠正记录，项目特定 |
| `reflect` | 全局 WARM | ~/.mnemonic/JOURNAL/ | 反思日志，跨项目学习 |

## 快速开始

> ⚡ **重要提示**：以下操作由 Agent 自动触发，无需人工执行。安装 Skill 后，Agent 会根据用户表达自动调用相应功能。

### 安装

```bash
# 全局安装
cd "Universal Memory"
./install.sh
```

### 初始化

```bash
# 初始化全局记忆
python3 scripts/memory_cli.py init-global

# 在项目目录中初始化项目记忆
python3 scripts/memory_cli.py init-project

# 或指定项目路径
python3 scripts/memory_cli.py init-project --project-dir /path/to/project
```

## 使用指南

### 存储记忆 (remember)

```bash
# 全局偏好 (自动路由到全局存储)
python3 scripts/memory_cli.py remember "用户偏好简洁的回复" --type preference

# 项目决策 (指定项目目录)
python3 scripts/memory_cli.py remember "使用 PostgreSQL 作为数据库" --type decision --project-dir /path/to/project

# 显式指定作用域
python3 scripts/memory_cli.py "始终使用 TypeScript" --type constraint --scope global
python3 scripts/memory_cli.py "API 采用 REST 架构" --type decision --scope project --project-dir /path/to/project
```

### 搜索记忆 (search)

```bash
# 自动搜索 (优先项目层，然后全局层)
python3 scripts/memory_cli.py search "数据库" --project-dir /path/to/project

# 仅搜索全局层
python3 scripts/memory_cli.py search "偏好" --scope global

# 仅搜索项目层
python3 scripts/memory_cli.py search "决策" --scope project --project-dir /path/to/project

# JSON 格式输出
python3 scripts/memory_cli.py search "数据库" --json --project-dir /path/to/project
```

### 自我反思 (reflect)

```bash
python3 scripts/memory_cli.py reflect \
  --task "重构登录模块" \
  --outcome success \
  --confidence 0.9 \
  --insight "使用了通用的异常捕获，下次应该更具体"
```

### 主动感知 (perceive)

```bash
# 基于上下文主动推荐相关记忆
python3 scripts/memory_cli.py perceive "用户正在询问关于登录模块的重构"

# 指定项目目录，优先搜索项目层记忆
python3 scripts/memory_cli.py perceive "用户询问如何优化数据库查询" --project-dir /path/to/project
```

## 应用场景

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

## 命令参考

| 命令 | 说明 |
|-----|------|
| `init-global` | 初始化全局记忆存储 |
| `init-project` | 初始化项目记忆存储 |
| `remember` | 存储 WAL 格式的记忆 |
| `search` | 跨层检索记忆 |
| `reflect` | 记录自我反思日志 |
| `perceive` | 主动推荐相关记忆 |
| `migrate` | 迁移旧版数据到新架构 |

### 迁移旧数据

```bash
python3 scripts/memory_cli.py migrate
```

### remember 参数

| 参数 | 说明 | 默认值 |
|-----|------|-------|
| `content` | 记忆内容 (必填) | - |
| `--type` | 类型: `preference`, `decision`, `constraint`, `correction` | `preference` |
| `--scope` | 作用域: `auto`, `global`, `project` | `auto` |
| `--project-dir` | 项目目录路径 | 当前目录 |
| `--json` | JSON 格式输出 | `false` |

### search 参数

| 参数 | 说明 | 默认值 |
|-----|------|-------|
| `query` | 搜索关键词 (必填) | - |
| `--scope` | 搜索范围: `auto`, `global`, `project` | `auto` |
| `--project-dir` | 项目目录路径 | - |
| `--limit` | 最大结果数 | `5` |
| `--json` | JSON 格式输出 | `false` |

## 搜索优先级

使用 `--scope auto` 时的搜索顺序：

1. **项目层优先** - 更具体、更相关
2. **全局层次之** - 通用偏好和约束
3. **合并排序** - 按相关度评分排序

## 适用场景

**主动使用此技能的场景：**

1. 用户表达偏好时 (如 "我喜欢...", "我偏好...", "始终...")
2. 用户设置约束时 (如 "不要...", "绝不...", "必须...")
3. 对话中做出重要决策时
4. 开始新项目时 (调用 `init-project`)
5. 完成重要任务时 (调用 `reflect`)
6. 用户询问之前的偏好或决策时 (调用 `search`)

**触发示例：**

- "记住我喜欢简洁的回复" → `remember` (type: `preference`)
- "这个项目使用 PostgreSQL" → `remember` (type: `decision`)
- "不要使用 var 关键字" → `remember` (type: `constraint`)
- "我之前说过什么偏好？" → `search`

## 系统要求

- Python 3.8+
- 无外部依赖

## 许可证

MIT License

---

*Universal Memory Skill v2.0 - 双层记忆架构*
