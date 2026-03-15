# Mnemonic - AI Agent Skills CLI

**适用于任何 AI Agent 的技能管理 CLI 工具**

Mnemonic 是一个 CLI 工具，用于安装、管理和分享 AI Agent 技能 (Skills)。支持 40+ 种编码代理，包括 Trae、Claude Code、Cursor、Windsurf 等。

## 核心特性

- 🚀 **一键安装** - 使用 `npx mnemonic add` 快速安装技能
- 🔗 **多源支持** - GitHub、GitLab、本地路径、Git URL
- 🤖 **40+ Agent 支持** - 自动检测已安装的编码代理
- 🔗 **软链接安装** - 节省空间，便于更新
- 📦 **内置技能** - 包含 Universal Memory 通用记忆系统

## 快速开始

### 安装技能

```bash
# 从 GitHub 安装
npx mnemonic add owner/skill-repo

# 安装到全局 (所有项目可用)
npx mnemonic add owner/skill-repo -g

# 安装到特定 Agent
npx mnemonic add owner/skill-repo -a trae -a claude-code

# 从本地路径安装
npx mnemonic add ./my-skill

# 列出可用的技能 (不安装)
npx mnemonic add owner/skill-repo --list
```

### 管理技能

```bash
# 列出已安装的技能
npx mnemonic list

# 列出全局技能
npx mnemonic list -g

# 移除技能
npx mnemonic remove skill-name

# 创建新技能模板
npx mnemonic init my-skill
```

## 支持的 Agent

| Agent | --agent 参数 | 项目路径 | 全局路径 |
|-------|-------------|---------|---------|
| Trae | `trae` | `.trae/skills/` | `~/.trae/skills/` |
| Trae CN | `trae-cn` | `.trae/skills/` | `~/.trae-cn/skills/` |
| Claude Code | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| Cursor | `cursor` | `.agents/skills/` | `~/.cursor/skills/` |
| Codex | `codex` | `.agents/skills/` | `~/.codex/skills/` |
| Windsurf | `windsurf` | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| Cline | `cline` | `.agents/skills/` | `~/.agents/skills/` |
| Goose | `goose` | `.goose/skills/` | `~/.config/goose/skills/` |
| OpenCode | `opencode` | `.agents/skills/` | `~/.config/opencode/skills/` |
| ... | ... | ... | ... |

完整列表请运行 `npx mnemonic add --help` 查看。

## 内置技能：Universal Memory

本项目内置了 **Universal Memory** 通用记忆系统，提供 **全局 + 项目** 双层存储架构。

### 安装 Universal Memory

```bash
# 安装到当前项目
npx mnemonic add universal-memory -a trae

# 安装到全局
npx mnemonic add universal-memory -g -a trae
```

### Universal Memory 功能

- 🧠 **双层存储** - 全局记忆跨项目共享，项目记忆独立隔离
- 📝 **WAL 协议** - 可靠的写入前日志，确保数据完整性
- 🔍 **语义检索** - 跨层级搜索相关记忆
- 💡 **主动推荐** - 基于上下文自动推荐相关记忆
- 🪞 **自我反思** - 任务完成后记录洞察，持续学习

### Universal Memory 使用

安装后，Agent 会自动根据用户表达调用相应功能：

- "记住我喜欢简洁的回复" → 存储偏好
- "这个项目使用 PostgreSQL" → 存储决策
- "不要使用 var 关键字" → 存储约束
- "我之前说过什么偏好？" → 搜索记忆

## 安装选项

| 选项 | 说明 |
|-----|------|
| `-g, --global` | 安装到全局目录 |
| `-a, --agent <names...>` | 指定目标 Agent |
| `-s, --skill <names...>` | 指定要安装的技能 |
| `-l, --list` | 列出可用技能 |
| `--copy` | 复制文件而非软链接 |
| `-y, --yes` | 跳过确认提示 |

## 技能发现

CLI 会在以下路径搜索 SKILL.md 文件：

- `skills/`
- `.agents/skills/`
- `.claude/skills/`
- `.cursor/skills/`
- 以及更多...

## 系统要求

- Node.js 18.0.0+
- Git (用于克隆远程仓库)

## 许可证

MIT License

---

*Mnemonic CLI v1.0 - AI Agent Skills Manager*
