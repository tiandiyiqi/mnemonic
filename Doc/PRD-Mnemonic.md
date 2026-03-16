# PRD：Mnemonic - 通用 Agent 记忆系统

## 1. 背景与目标

### 问题陈述

AI Agent（如 Trae、Claude Code、Cursor 等）在会话结束后无法保留用户偏好和项目决策，导致：
- 用户每次新会话都需重复说明编码风格、技术偏好
- AI 无法从历史成功/失败中学习，重复犯错
- 跨项目的通用偏好无法共享
- 项目特定的技术决策无法持久化

### SMART 目标

1. 用户重复说明偏好的次数减少 80%（3 个月内）
2. perceive 推荐相关性评分 > 0.8（持续优化）
3. 100+ 用户安装使用（6 个月内）
4. 支持 40+ 种 AI Agent 的一键安装（已实现）

## 2. 用户画像

### 画像 1：独立开发者

- 技术水平：中高级
- 使用频率：每天多次使用 AI Agent
- JTBD：当我开始新的编码会话时，我想要 AI 自动应用我的编码偏好，以便不需要重复说明
- JTBD：当我询问技术方案时，我想要 AI 推荐之前成功的经验，以便避免重复探索

### 画像 2：团队协作开发者

- 技术水平：中级到高级
- 使用频率：每天使用 AI Agent
- JTBD：当我在项目中工作时，我想要 AI 遵循项目的技术决策，以便保持代码一致性
- JTBD：当新成员加入时，我想要 AI 能够告知项目的技术约束，以便快速上手

## 3. 功能需求（FR）

### 子系统 A：记忆系统核心（Python CLI）

已实现的记忆系统，纯 Python 无外部依赖，提供双层存储和语义检索。

| ID | 需求 | 优先级 | 状态 | 验收标准 |
|----|------|--------|------|---------|
| FR-A01 | remember：WAL 格式存储记忆 | MUST | ✅ 已实现 | 支持 preference/decision/constraint/correction 四种类型，自动路由到全局或项目存储 |
| FR-A02 | search：跨层级搜索记忆 | MUST | ✅ 已实现 | 支持 auto/global/project 三种 scope，项目层优先，返回相关性排序结果 |
| FR-A03 | perceive：上下文感知推荐 | MUST | ✅ 已实现 | 提取中英文关键词，搜索所有记忆源，返回带相关性评分的推荐 |
| FR-A04 | reflect：自我反思日志 | MUST | ✅ 已实现 | 记录 task/outcome/confidence/insight，写入全局 JOURNAL |
| FR-A05 | init-global：初始化全局存储 | MUST | ✅ 已实现 | 创建 ~/.mnemonic/ 目录结构 |
| FR-A06 | init-project：初始化项目存储 | MUST | ✅ 已实现 | 创建 项目/.mnemonic/ 目录结构 |
| FR-A07 | migrate：旧版数据迁移 | SHOULD | ✅ 已实现 | 从 .mnemonic_data/ 迁移到新双层架构 |
| FR-A08 | 时间衰减算法 | SHOULD | ✅ 已实现 | 7天内 1.0，30天内 0.9，90天内 0.8，更早 0.7 |
| FR-A09 | 中英文关键词提取 | SHOULD | ✅ 已实现 | 英文正则提取 + 中文模式匹配 + 英中翻译映射表 |
| FR-A10 | 审计日志 | SHOULD | ✅ 已实现 | JSONL 格式记录所有写入操作 |

### 子系统 B：CLI 安装工具（TypeScript/Node.js）

已实现的 CLI 工具，支持从多种来源安装 Skill 到多种 AI Agent。

| ID | 需求 | 优先级 | 状态 | 验收标准 |
|----|------|--------|------|---------|
| FR-B01 | add：安装 Skill | MUST | ✅ 已实现 | 支持 GitHub shorthand、完整 URL、本地路径、Git URL 四种来源（npm 来源解析已实现但安装未完成） |
| FR-B02 | list：列出已安装 Skill | MUST | ✅ 已实现 | 显示 Skill 名称、描述、安装的 Agent 列表 |
| FR-B03 | remove：卸载 Skill | MUST | ✅ 已实现 | 支持交互式选择、批量删除、指定 Agent 删除 |
| FR-B04 | init：创建 Skill 模板 | MUST | ✅ 已实现 | 生成 SKILL.md 模板文件 |
| FR-B05 | 多 Agent 支持 | MUST | ✅ 已实现 | 支持 42 种 AI Agent（Trae、Claude Code、Cursor、Windsurf 等） |
| FR-B06 | Agent 自动检测 | MUST | ✅ 已实现 | 扫描项目和全局配置文件，自动识别已安装的 Agent |
| FR-B07 | Symlink/Copy 安装 | MUST | ✅ 已实现 | 默认 symlink，--copy 选项支持文件复制 |
| FR-B08 | Lock 文件管理 | SHOULD | ✅ 已实现 | skills-lock.json 记录安装来源、时间、目标 Agent |
| FR-B09 | SKILL.md 解析 | MUST | ✅ 已实现 | 解析 gray-matter frontmatter，提取 name/description/metadata |
| FR-B10 | 多来源发现 | MUST | ✅ 已实现 | 搜索 36 个路径模式 + Plugin Manifest 发现 Skill |
| FR-B11 | GitLab 支持 | SHOULD | ✅ 已实现 | 解析 GitLab URL 格式 |

### 待实现功能

| ID | 需求 | 优先级 | 状态 | 验收标准 |
|----|------|--------|------|---------|
| FR-C01 | 记忆归档 | SHOULD | ✅ 已实现 | archive 命令归档 DEPRECATED 记忆到 history/，文件超 200 行时警告，支持 --include-archive 搜索归档 |
| FR-C02 | 记忆可视化 | COULD | ⬜ 未实现 | 展示记忆时间线和关联关系 |
| FR-C03 | 团队共享 | COULD | ⬜ 未实现 | 导出/导入项目记忆 |
| FR-C04 | npm 发布 | SHOULD | ⬜ 未实现 | 发布到 npm，支持 npx mnemonic 直接使用 |
| FR-C05 | 记忆溯源元数据 | SHOULD | ✅ 已实现 | WAL 行末 META 注释记录 source/confidence，向后兼容旧格式 |
| FR-C06 | 记忆冲突检测 | SHOULD | ✅ 已实现 | 写入前检测同类型 >70% 相似度记忆，自动标记 DEPRECATED，审计日志记录冲突 |

## 4. 非功能需求（NFR）

| ID | 需求 | 优先级 | 验收标准 |
|----|------|--------|---------|
| NFR-001 | 零外部依赖（记忆系统） | MUST | Python 核心不依赖任何第三方库 |
| NFR-002 | 跨平台支持 | MUST | macOS、Linux、Windows 均可运行 |
| NFR-003 | 隐私优先 | MUST | 所有数据存储在本地，不上传云端 |
| NFR-004 | 人类可读存储 | MUST | 记忆文件使用 Markdown，审计日志使用 JSONL |
| NFR-005 | 搜索性能 | SHOULD | 单次搜索 < 500ms（1000 条记忆以内） |
| NFR-006 | 向后兼容 | SHOULD | 提供 migrate 命令支持旧版数据迁移 |
| NFR-007 | Python 3.8+ | MUST | 兼容 Python 3.8 及以上版本 |
| NFR-008 | Node.js 18+ | MUST | CLI 工具兼容 Node.js 18 及以上版本 |

## 5. 优先级排序（MoSCoW）

### Must Have（已实现）
- 双层存储架构（全局 + 项目）
- WAL 写入协议（remember）
- 跨层搜索（search）
- 上下文感知推荐（perceive）
- 自我反思（reflect）
- CLI 安装工具（add/list/remove/init）
- 42 种 Agent 支持
- Agent 自动检测

### Should Have（部分已实现）
- ✅ 时间衰减算法
- ✅ 中英文关键词提取
- ✅ 审计日志
- ✅ Lock 文件管理
- ✅ 数据迁移
- ⬜ npm 发布

### Could Have（未实现）
- 记忆归档
- 记忆可视化
- 团队共享

### Won't Have（本版本不做）
- 云端同步
- 向量数据库集成
- 付费功能

## 6. Epic 与用户故事

### Epic 1：记忆存储与检索（已实现）

**Story 1.1：** 作为开发者，我想要告诉 AI 我的编码偏好，以便 AI 在后续会话中自动应用。

验收标准：
- 给定用户说"记住我喜欢函数式编程"，当 Agent 调用 remember，则偏好写入 ~/.mnemonic/RULES.md
- 给定用户在新会话中编码，当 Agent 调用 perceive，则返回"用户偏好函数式风格"的推荐

**Story 1.2：** 作为开发者，我想要记录项目的技术决策，以便团队成员的 AI 都遵循相同决策。

验收标准：
- 给定用户说"这个项目使用 PostgreSQL"，当 Agent 调用 remember --type decision，则决策写入 项目/.mnemonic/DECISIONS.md
- 给定其他成员询问数据库选型，当 Agent 调用 search，则返回"使用 PostgreSQL"的决策

**Story 1.3：** 作为开发者，我想要 AI 从失败中学习，以便不重复相同的错误。

验收标准：
- 给定任务失败后 Agent 调用 reflect，则洞察写入 ~/.mnemonic/JOURNAL/
- 给定用户再次尝试类似任务，当 Agent 调用 perceive，则返回之前的失败教训

### Epic 2：CLI 安装工具（已实现）

**Story 2.1：** 作为开发者，我想要一键安装记忆系统到我的 AI Agent，以便快速开始使用。

验收标准：
- 给定用户运行 `npx mnemonic add universal-memory -a trae`，则 Skill 安装到 .trae/skills/
- 给定用户运行 `npx mnemonic add universal-memory -g`，则 Skill 安装到全局目录

**Story 2.2：** 作为开发者，我想要从 GitHub 安装第三方 Skill，以便扩展 AI 能力。

验收标准：
- 给定用户运行 `npx mnemonic add owner/repo`，则从 GitHub 克隆并安装
- 给定仓库包含多个 Skill，则自动发现并列出所有可用 Skill

### Epic 3：npm 发布（待实现）

**Story 3.1：** 作为开发者，我想要通过 npx 直接使用 mnemonic，以便无需手动克隆仓库。

验收标准：
- 给定用户运行 `npx mnemonic add universal-memory`，则从 npm 下载并执行
- 给定 package.json 中 bin 字段正确配置，则全局安装后 `mnemonic` 命令可用

## 7. 用户体验需求

### CLI 交互

- 使用 ora spinner 显示操作进度
- 使用 chalk 彩色输出区分信息类型（绿色成功、黄色警告、红色错误）
- 使用 prompts 提供交互式选择（Agent 选择、Skill 选择、确认删除）
- 安装完成后显示安装摘要（Skill 列表 + Agent 列表 + 路径）

### 记忆系统交互

- remember 操作返回确认信息，包含 nonce 用于追溯
- search 操作返回格式化结果，显示来源层级和相关性
- perceive 操作返回 JSON 格式，包含 keywords/related_memories/recommendations
- 支持 --json 参数输出机器可读格式

## 8. 风险与验收标准

### 风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 记忆文件膨胀 | 搜索性能下降 | 中 | 时间衰减算法（已实现）+ 归档机制（待实现） |
| 全局/项目记忆冲突 | 推荐不一致 | 低 | 项目层优先级高于全局层（已实现） |
| Agent 兼容性 | 部分 Agent 无法使用 | 中 | 通用 CLI 接口 + 42 种 Agent 适配（已实现） |
| 隐私泄露 | 敏感信息暴露 | 低 | 本地存储 + 用户完全控制（已实现） |
| Symlink 跨平台问题 | Windows 安装失败 | 中 | Symlink 失败自动回退到 Copy（已实现） |

### 整体验收标准

1. `npx mnemonic add universal-memory -a trae` 成功安装到 Trae
2. Agent 调用 remember/search/perceive/reflect 均正常工作
3. 全局记忆跨项目共享，项目记忆独立隔离
4. 42 种 Agent 的安装路径正确
5. Lock 文件正确记录安装信息
6. 旧版数据可通过 migrate 迁移

---

**版本：** 1.0.0
**创建日期：** 2026-03-16
**基于：** Doc/BRIEF-Mnemonic.md（产品简报）
**状态：** 已完成
