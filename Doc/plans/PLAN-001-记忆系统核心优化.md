# PLAN-001: 记忆系统核心优化

## 元信息

- **状态**: active
- **创建时间**: 2026-03-16
- **所属阶段**: 阶段 3（开发）
- **复杂度**: 中
- **基于**: Doc/ANALYSIS_AND_OPTIMIZATION.md, Doc/PRD-Mnemonic.md

## 需求重述

基于行业分析报告，对 Mnemonic 记忆系统核心（memory_cli.py）进行三项优化：

1. **记忆溯源元数据** — 扩展 WAL 行格式，每条记忆增加 source/confidence 元数据
2. **记忆冲突检测** — remember 写入前检测同 topic 旧记忆，自动标记为 DEPRECATED
3. **记忆归档** — 文件过大时提示用户，由用户决定是否归档（不自动归档）

不做：L1 热缓存、向量检索（列为未来可能方向）

## 实施阶段

### Phase 1: 记忆溯源元数据

**目标**: 每条记忆可追溯来源和置信度

**修改文件**:
- `skills/universal-memory/scripts/memory_cli.py`
- `Universal Memory/scripts/memory_cli.py`（同步）

**步骤**:

- [ ] TASK-001: 扩展 WAL 写入格式，在行末追加 HTML 注释形式的元数据
  ```
  当前格式:
  - [2026-03-16 14:30:00] [PREFERENCE] 内容 (nonce: a1b2c3d4)

  新格式:
  - [2026-03-16 14:30:00] [PREFERENCE] 内容 (nonce: a1b2c3d4) <!-- META: {"source":"user","confidence":0.9} -->
  ```
- [ ] TASK-002: cmd_remember 增加 --source 和 --confidence 参数
  - `--source`: user_dialog / agent_infer / reflection，默认 user_dialog
  - `--confidence`: 0.0-1.0，默认 0.9
- [ ] TASK-003: 扩展 write_audit() 将 source/confidence 写入 audit.jsonl
- [ ] TASK-004: 更新 search/perceive 解析逻辑，识别并展示元数据
  - search 结果增加 source/confidence 字段
  - perceive 推荐中展示置信度
- [ ] TASK-005: 向后兼容 — 旧格式记忆（无 META 注释）正常解析，默认 source=unknown, confidence=0.8

### Phase 2: 记忆冲突检测

**目标**: 写入新记忆时自动检测并标记冲突的旧记忆

**修改文件**:
- `skills/universal-memory/scripts/memory_cli.py`
- `Universal Memory/scripts/memory_cli.py`（同步）

**步骤**:

- [ ] TASK-006: 新增 detect_conflict() 函数
  - 扫描目标文件中同类型的已有记忆
  - 提取关键词计算相似度（复用 extract_keywords）
  - 相似度 > 0.7 视为冲突
- [ ] TASK-007: 新增 mark_deprecated() 函数
  - 将冲突的旧记忆行标记为 `[DEPRECATED]`
  - 格式: `- ~~[旧时间戳] [旧类型] 旧内容~~ [DEPRECATED by nonce:新nonce]`
- [ ] TASK-008: 修改 cmd_remember 流程，写入前调用冲突检测
  - 检测到冲突 → 自动标记旧记忆为 DEPRECATED → 写入新记忆
  - 输出信息告知 Agent 发生了冲突替换
- [ ] TASK-009: 更新 search/perceive 过滤逻辑，跳过 DEPRECATED 记忆
- [ ] TASK-010: 审计日志记录冲突事件（event_type: "conflict"）

### Phase 3: 记忆归档

**目标**: 文件过大时提示用户，由用户决定归档策略

**修改文件**:
- `skills/universal-memory/scripts/memory_cli.py`
- `Universal Memory/scripts/memory_cli.py`（同步）

**步骤**:

- [ ] TASK-011: 新增 check_file_size() 函数
  - 检查 RULES.md / SESSION.md / DECISIONS.md 的行数
  - 阈值: 200 行（可配置）
- [ ] TASK-012: 新增 archive 子命令
  - `python3 memory_cli.py archive --project-dir /path`
  - 交互式选择要归档的记忆（按时间排序展示）
  - 归档目标: `~/.mnemonic/history/` 或 `项目/.mnemonic/history/`
  - 归档文件命名: `{原文件名}_{日期}.md`
- [ ] TASK-013: 在 remember/search/perceive 执行时检查文件大小
  - 超过阈值时输出警告: `⚠️ {文件名} 已有 {行数} 行，建议运行 archive 命令整理`
  - 仅警告，不阻断操作
- [ ] TASK-014: 更新 search/perceive 支持搜索归档文件
  - 新增 --include-archive 参数
  - 默认不搜索归档，加参数后搜索 history/ 目录
- [ ] TASK-015: 创建 history/ 目录结构
  - 全局: `~/.mnemonic/history/`
  - 项目: `项目/.mnemonic/history/`

## 文档更新

- [ ] TASK-016: 更新两份 SKILL.md — 新增 archive 命令文档、更新 remember 参数
- [ ] TASK-017: 更新 README.md — 新增归档和溯源功能说明
- [ ] TASK-018: 更新 Doc/PRD-Mnemonic.md — 将三项功能标记为已实现
- [ ] TASK-019: 更新 Doc/ARCH-Mnemonic.md — 更新 WAL 格式和文件结构说明

## 依赖关系

```
Phase 1 (溯源) ──→ Phase 2 (冲突检测，依赖溯源的元数据格式)
                ──→ Phase 3 (归档，独立于冲突检测)

Phase 1 内部:
TASK-001 → TASK-002 → TASK-003 → TASK-004 → TASK-005

Phase 2 内部:
TASK-006 → TASK-007 → TASK-008 → TASK-009 → TASK-010

Phase 3 内部:
TASK-011 → TASK-012 → TASK-013 → TASK-014
TASK-015 可并行

文档更新:
TASK-016~019 在 Phase 1~3 全部完成后执行
```

## 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| WAL 格式变更破坏向后兼容 | 高 | 低 | TASK-005 专门处理兼容性，旧格式正常解析 |
| 冲突检测误判（相似但不冲突） | 中 | 中 | 相似度阈值 0.7 + 仅同类型比较 |
| DEPRECATED 标记破坏文件可读性 | 低 | 低 | 使用 Markdown 删除线格式，人类仍可读 |
| 归档后用户找不到旧记忆 | 中 | 低 | --include-archive 参数支持搜索归档 |

## 约束条件

1. **零依赖** — 不引入任何新的 Python 依赖
2. **向后兼容** — 旧格式记忆必须正常工作
3. **双文件同步** — skills/ 和 Universal Memory/ 下的 memory_cli.py 保持一致
4. **纯规则驱动** — 归档由用户决定，不自动执行

## 验证方式

```bash
# Phase 1 验证
python3 scripts/memory_cli.py remember "测试溯源" --type preference --source user_dialog --confidence 0.95
# 检查 RULES.md 中是否包含 META 注释

# Phase 2 验证
python3 scripts/memory_cli.py remember "使用 PostgreSQL" --type decision --project-dir .
python3 scripts/memory_cli.py remember "改用 MongoDB" --type decision --project-dir .
# 检查第一条是否被标记为 DEPRECATED

# Phase 3 验证
python3 scripts/memory_cli.py archive --project-dir .
# 检查 history/ 目录是否创建，归档文件是否正确
```

---

**等待确认**: 是否继续执行此计划？(yes / no / modify)
