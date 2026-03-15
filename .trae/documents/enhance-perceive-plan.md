# 增强 perceive 功能计划

## 目标

增强 `perceive` 功能，使其能够主动检索相关记忆并返回可操作的推荐，让 `reflect` 的洞察真正发挥作用。

## 应用场景分析

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

## 实现步骤

### 步骤1：增强 cmd_perceive 函数

修改 `Universal Memory/scripts/memory_cli.py`：

```python
def cmd_perceive(args):
    context = args.context
    
    # 1. 提取关键词（中英文）
    keywords = extract_keywords(context)
    
    # 2. 搜索所有记忆源
    memories = search_all_sources(keywords, args.project_dir)
    
    # 3. 计算相关性并排序
    scored_memories = calculate_relevance(memories, keywords)
    
    # 4. 生成推荐
    recommendations = format_recommendations(scored_memories[:5])
    
    # 5. 返回结果
    result = {
        "keywords": keywords[:5],
        "related_memories": scored_memories[:5],
        "recommendations": recommendations
    }
    
    print(json.dumps(result, ensure_ascii=False, indent=2))
```

### 步骤2：添加辅助函数

```python
def extract_keywords(context):
    """提取中英文关键词"""
    # 中文分词（简单实现：按字符匹配）
    # 英文分词（正则提取单词）
    # 过滤停用词
    # 返回关键词列表

def search_all_sources(keywords, project_dir):
    """搜索所有记忆源"""
    sources = [
        ("global/rules", GLOBAL_RULES_FILE),
        ("global/journal", GLOBAL_JOURNAL_DIR),
        ("project/session", project_session_file),
        ("project/decisions", project_decisions_file),
    ]
    # 遍历每个源，匹配关键词
    # 返回匹配的记忆列表

def calculate_relevance(memories, keywords):
    """计算相关性评分"""
    # 精确匹配：1.0
    # 部分匹配：0.7-0.9
    # 时间衰减：近期记忆权重更高
    # 返回排序后的记忆列表

def format_recommendations(memories):
    """格式化为可读的推荐"""
    # 提取 insight 和 content
    # 生成自然语言推荐
```

### 步骤3：更新 SKILL.md

更新 `perceive` 工具说明：

```markdown
### `perceive`
Proactively find relevant memories based on current conversation context.

**Arguments:**
- `context` (string, required): The recent conversation text
- `project_dir` (string, optional): Project directory path

**Returns:**
- `keywords`: Extracted keywords from context
- `related_memories`: Matching memories with relevance scores
- `recommendations`: Actionable suggestions based on memories

**Example:**
Input: "用户正在询问关于登录模块的重构"
Output:
{
  "keywords": ["登录", "重构"],
  "related_memories": [
    {
      "source": "journal/2026-03-15",
      "task": "重构登录模块",
      "insight": "应使用具体异常而非通用捕获",
      "relevance": 0.9
    }
  ],
  "recommendations": [
    "上次重构登录时发现：应使用具体异常而非通用捕获"
  ]
}
```

### 步骤4：更新 README.md

添加应用场景说明和使用示例。

## 文件修改清单

| 文件 | 修改内容 |
|-----|---------|
| `Universal Memory/scripts/memory_cli.py` | 增强 perceive，添加辅助函数 |
| `Universal Memory/SKILL.md` | 更新工具说明，添加示例 |
| `README.md` | 添加应用场景和使用示例 |

## 技术细节

### 关键词提取策略
- 中文：匹配常见词汇模式
- 英文：正则 `\w+` 提取
- 停用词：中英文停用词表
- 权重：动词 > 名词 > 其他

### 相关性评分
```
score = base_score * time_decay * source_weight

base_score:
  - 精确匹配：1.0
  - 包含匹配：0.8
  - 前缀匹配：0.6

time_decay:
  - 7天内：1.0
  - 30天内：0.9
  - 90天内：0.8
  - 更早：0.7

source_weight:
  - project/session：1.2（最相关）
  - project/decisions：1.1
  - global/journal：1.0
  - global/rules：0.9
```

### 性能考虑
- 限制搜索文件数量（最近 30 天的 journal）
- 限制返回结果数量（最多 5 条）
- 使用生成器避免内存问题

## 验证方式

```bash
# 1. 先记录一些反思
python3 scripts/memory_cli.py reflect \
  --task "重构登录模块" \
  --outcome success \
  --insight "使用具体异常类型而非通用 Exception"

# 2. 测试 perceive
python3 scripts/memory_cli.py perceive "用户询问如何重构认证系统"

# 期望输出包含：
# - keywords: ["认证", "重构", "系统"]
# - related_memories: 包含刚才的反思
# - recommendations: 包含具体建议
```
