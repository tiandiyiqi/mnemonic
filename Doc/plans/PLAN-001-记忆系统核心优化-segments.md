# 任务组结构：记忆系统核心优化

## 元信息
- 源计划：PLAN-001-记忆系统核心优化.md
- 创建时间：2026-03-16 14:30
- 任务组数量：10
- 总任务数：19

## 执行顺序

### 任务组 1：Phase 1 基础 - WAL 格式扩展
**类型：** 串行
**前置条件：** 无

#### 任务 1-1：扩展 WAL 写入格式
- [ ] TASK-001: 扩展 WAL 写入格式，在行末追加 HTML 注释形式的元数据
  - 依赖：无
  - 文件：`skills/universal-memory/scripts/memory_cli.py`, `Universal Memory/scripts/memory_cli.py`
  - 复杂度：中
  - 说明：新格式 `- [时间戳] [类型] 内容 (nonce: xxx) <!-- META: {"source":"user","confidence":0.9} -->`

---

### 任务组 2：Phase 1 扩展 - 参数和解析
**类型：** 并行
**前置条件：** 任务组 1 完成

#### 任务 2-1：CLI 参数扩展
- [ ] TASK-002: cmd_remember 增加 --source 和 --confidence 参数
  - 依赖：TASK-001
  - 文件：`memory_cli.py` (两份)
  - 复杂度：低
  - 说明：--source (user_dialog/agent_infer/reflection, 默认 user_dialog), --confidence (0.0-1.0, 默认 0.9)

#### 任务 2-2：审计日志扩展
- [ ] TASK-003: 扩展 write_audit() 将 source/confidence 写入 audit.jsonl
  - 依赖：TASK-001
  - 文件：`memory_cli.py` (两份)
  - 复杂度：低
  - 说明：审计日志增加元数据字段

#### 任务 2-3：搜索解析更新
- [ ] TASK-004: 更新 search/perceive 解析逻辑，识别并展示元数据
  - 依赖：TASK-001
  - 文件：`memory_cli.py` (两份)
  - 复杂度：中
  - 说明：search 结果增加 source/confidence 字段，perceive 推荐中展示置信度

---

### 任务组 3：Phase 1 兼容 - 向后兼容
**类型：** 串行
**前置条件：** 任务组 2 完成

#### 任务 3-1：向后兼容处理
- [ ] TASK-005: 向后兼容 — 旧格式记忆（无 META 注释）正常解析
  - 依赖：TASK-004
  - 文件：`memory_cli.py` (两份)
  - 复杂度：低
  - 说明：默认 source=unknown, confidence=0.8

---

### 任务组 4：Phase 2 基础 - 冲突检测函数
**类型：** 并行
**前置条件：** 任务组 3 完成

#### 任务 4-1：冲突检测函数
- [ ] TASK-006: 新增 detect_conflict() 函数
  - 依赖：Phase 1 完成
  - 文件：`memory_cli.py` (两份)
  - 复杂度：中
  - 说明：扫描同类型记忆，提取关键词计算相似度，相似度 > 0.7 视为冲突

#### 任务 4-2：标记废弃函数
- [ ] TASK-007: 新增 mark_deprecated() 函数
  - 依赖：Phase 1 完成
  - 文件：`memory_cli.py` (两份)
  - 复杂度：低
  - 说明：格式 `- ~~[旧时间戳] [旧类型] 旧内容~~ [DEPRECATED by nonce:新nonce]`

---

### 任务组 5：Phase 2 集成 - 冲突检测流程
**类型：** 串行
**前置条件：** 任务组 4 完成

#### 任务 5-1：集成冲突检测
- [ ] TASK-008: 修改 cmd_remember 流程，写入前调用冲突检测
  - 依赖：TASK-006, TASK-007
  - 文件：`memory_cli.py` (两份)
  - 复杂度：中
  - 说明：检测到冲突 → 自动标记旧记忆为 DEPRECATED → 写入新记忆，输出信息告知 Agent

---

### 任务组 6：Phase 2 更新 - 过滤和审计
**类型：** 并行
**前置条件：** 任务组 5 完成

#### 任务 6-1：过滤废弃记忆
- [ ] TASK-009: 更新 search/perceive 过滤逻辑，跳过 DEPRECATED 记忆
  - 依赖：TASK-007, TASK-008
  - 文件：`memory_cli.py` (两份)
  - 复杂度：低
  - 说明：搜索和推荐时自动跳过已废弃记忆

#### 任务 6-2：冲突审计日志
- [ ] TASK-010: 审计日志记录冲突事件（event_type: "conflict"）
  - 依赖：TASK-008
  - 文件：`memory_cli.py` (两份)
  - 复杂度：低
  - 说明：记录冲突替换事件到 audit.jsonl

---

### 任务组 7：Phase 3 基础 - 归档基础设施
**类型：** 并行
**前置条件：** 任务组 3 完成（Phase 3 独立于 Phase 2）

#### 任务 7-1：文件大小检查
- [ ] TASK-011: 新增 check_file_size() 函数
  - 依赖：Phase 1 完成
  - 文件：`memory_cli.py` (两份)
  - 复杂度：低
  - 说明：检查 RULES.md/SESSION.md/DECISIONS.md 行数，阈值 200 行

#### 任务 7-2：创建归档目录
- [ ] TASK-015: 创建 history/ 目录结构
  - 依赖：无
  - 文件：文件系统
  - 复杂度：低
  - 说明：全局 `~/.mnemonic/history/`，项目 `项目/.mnemonic/history/`

---

### 任务组 8：Phase 3 命令 - 归档和警告
**类型：** 并行
**前置条件：** 任务组 7 完成

#### 任务 8-1：归档命令
- [ ] TASK-012: 新增 archive 子命令
  - 依赖：TASK-011
  - 文件：`memory_cli.py` (两份)
  - 复杂度：高
  - 说明：`python3 memory_cli.py archive --project-dir /path`，交互式选择归档记忆，归档文件命名 `{原文件名}_{日期}.md`

#### 任务 8-2：文件大小警告
- [ ] TASK-013: 在 remember/search/perceive 执行时检查文件大小
  - 依赖：TASK-011
  - 文件：`memory_cli.py` (两份)
  - 复杂度：低
  - 说明：超过阈值输出警告 `⚠️ {文件名} 已有 {行数} 行，建议运行 archive 命令整理`，仅警告不阻断

---

### 任务组 9：Phase 3 搜索 - 归档搜索支持
**类型：** 串行
**前置条件：** 任务组 8 完成

#### 任务 9-1：归档搜索
- [ ] TASK-014: 更新 search/perceive 支持搜索归档文件
  - 依赖：TASK-012
  - 文件：`memory_cli.py` (两份)
  - 复杂度：中
  - 说明：新增 --include-archive 参数，默认不搜索归档，加参数后搜索 history/ 目录

---

### 任务组 10：文档更新
**类型：** 并行
**前置条件：** 任务组 6 和任务组 9 完成（所有代码完成）

#### 任务 10-1：技能文档更新
- [ ] TASK-016: 更新两份 SKILL.md — 新增 archive 命令文档、更新 remember 参数
  - 依赖：所有代码任务完成
  - 文件：`skills/universal-memory/SKILL.md`, `Universal Memory/SKILL.md`
  - 复杂度：低

#### 任务 10-2：README 更新
- [ ] TASK-017: 更新 README.md — 新增归档和溯源功能说明
  - 依赖：所有代码任务完成
  - 文件：`README.md`
  - 复杂度：低

#### 任务 10-3：PRD 更新
- [ ] TASK-018: 更新 Doc/PRD-Mnemonic.md — 将三项功能标记为已实现
  - 依赖：所有代码任务完成
  - 文件：`Doc/PRD-Mnemonic.md`
  - 复杂度：低

#### 任务 10-4：架构文档更新
- [ ] TASK-019: 更新 Doc/ARCH-Mnemonic.md — 更新 WAL 格式和文件结构说明
  - 依赖：所有代码任务完成
  - 文件：`Doc/ARCH-Mnemonic.md`
  - 复杂度：低

---

## 执行顺序可视化

```
执行顺序：

1️⃣ 任务组 1（Phase 1 基础）
   └─ TASK-001: WAL 格式扩展
       ↓
2️⃣ 任务组 2（Phase 1 扩展）← 并行执行
   ├─ TASK-002: CLI 参数
   ├─ TASK-003: 审计日志
   └─ TASK-004: 搜索解析
       ↓
3️⃣ 任务组 3（Phase 1 兼容）
   └─ TASK-005: 向后兼容
       ↓
       ├──────────────────────────────────┐
       ↓                                  ↓
4️⃣ 任务组 4（Phase 2 基础）        7️⃣ 任务组 7（Phase 3 基础）
   ├─ TASK-006: 冲突检测              ├─ TASK-011: 文件大小检查
   └─ TASK-007: 标记废弃              └─ TASK-015: 创建目录
       ↓                                  ↓
5️⃣ 任务组 5（Phase 2 集成）        8️⃣ 任务组 8（Phase 3 命令）
   └─ TASK-008: 集成冲突检测          ├─ TASK-012: 归档命令
       ↓                              └─ TASK-013: 文件警告
6️⃣ 任务组 6（Phase 2 更新）            ↓
   ├─ TASK-009: 过滤废弃          9️⃣ 任务组 9（Phase 3 搜索）
   └─ TASK-010: 冲突审计              └─ TASK-014: 归档搜索
       ↓                                  ↓
       └──────────────────────────────────┘
                      ↓
              🔟 任务组 10（文档更新）← 并行执行
                 ├─ TASK-016: SKILL.md
                 ├─ TASK-017: README.md
                 ├─ TASK-018: PRD
                 └─ TASK-019: ARCH
```

## 关键依赖说明

### 串行依赖链
1. **Phase 1 主线**: TASK-001 → TASK-002/003/004 → TASK-005
2. **Phase 2 主线**: TASK-006/007 → TASK-008 → TASK-009/010
3. **Phase 3 主线**: TASK-011 → TASK-012/013 → TASK-014

### 跨阶段依赖
- Phase 2 依赖 Phase 1 完成（需要元数据格式）
- Phase 3 独立于 Phase 2（可在 Phase 1 完成后并行执行）
- 文档更新依赖所有代码任务完成

### 资源冲突管理
- **双文件同步**: 所有修改 memory_cli.py 的任务必须同时更新两份文件
  - `skills/universal-memory/scripts/memory_cli.py`
  - `Universal Memory/scripts/memory_cli.py`
- **建议策略**: 每个任务完成后立即同步两份文件，避免累积差异

## 并行执行收益分析

| 任务组 | 并行任务数 | 预估节省时间 | 上下文切换成本 | 建议 |
|--------|-----------|-------------|---------------|------|
| 任务组 2 | 3 | 高 | 低（修改不同函数） | 强烈推荐并行 |
| 任务组 4 | 2 | 中 | 低（独立函数） | 推荐并行 |
| 任务组 6 | 2 | 中 | 低（修改不同部分） | 推荐并行 |
| 任务组 7 | 2 | 低 | 极低（不同文件） | 推荐并行 |
| 任务组 8 | 2 | 高 | 低（修改不同函数） | 强烈推荐并行 |
| 任务组 10 | 4 | 高 | 极低（不同文件） | 强烈推荐并行 |
| Phase 2 vs Phase 3 | 2 阶段 | 极高 | 中（共享 memory_cli.py） | 谨慎并行，需协调 |

## 验证检查点

### 检查点 1: Phase 1 完成后
```bash
python3 scripts/memory_cli.py remember "测试溯源" --type preference --source user_dialog --confidence 0.95
# 验证：RULES.md 中包含 META 注释
```

### 检查点 2: Phase 2 完成后
```bash
python3 scripts/memory_cli.py remember "使用 PostgreSQL" --type decision --project-dir .
python3 scripts/memory_cli.py remember "改用 MongoDB" --type decision --project-dir .
# 验证：第一条被标记为 DEPRECATED
```

### 检查点 3: Phase 3 完成后
```bash
python3 scripts/memory_cli.py archive --project-dir .
# 验证：history/ 目录创建，归档文件正确
```

## 风险提示

1. **双文件同步风险**: 修改一份忘记同步另一份 → 建议每个任务完成后立即同步
2. **并行冲突风险**: Phase 2 和 Phase 3 同时修改 memory_cli.py → 建议串行执行或严格协调
3. **向后兼容风险**: TASK-005 必须充分测试旧格式记忆
4. **冲突检测误判**: 相似度阈值 0.7 可能需要调整 → 建议先测试后调优

---

**生成时间**: 2026-03-16 14:30
**状态**: 待执行
