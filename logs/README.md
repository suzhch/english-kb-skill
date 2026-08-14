# 生成日志（Generation Log）

每次知识生成请求结束后，AI 会往 `logs/generation.log.jsonl` 追加一行 JSON，
记录生成时间、知识 ID、操作类型、来源请求等信息。

## 文件

- `logs/generation.log.jsonl`：追加式事件日志，每行一个 JSON 对象。
- `logs/manifest.json`：`--sync` 模式的状态文件，记录每个文件最后扫描时的
  mtime 和 size，用于判断新增/修改/删除，不需要手工编辑。

## 日志行字段

| 字段 | 说明 |
| --- | --- |
| `ts` | 记录时间（ISO 8601，含时区） |
| `action` | `CREATED` / `UPDATED` / `SKIPPED` / `SYNC` / `DELETED` |
| `artifactType` | `KNOWLEDGE_POINT` / `LEARNING_ASSET` / `PERSONAL_ENHANCEMENT` / `QUESTION` |
| `id` | 知识 ID |
| `file` | 仓库相对路径 |
| `request` | 用户请求摘要 |
| `userPrompt` | 用户原始提示词（`--prompt` 传入，保留原文；可选） |
| `validation` | `PASS` / `FAIL` / `N/A` |
| `category` / `subcategory` / `difficulty` | 分类与难度（有则填） |
| `createdAt` / `updatedAt` | 产物文件中的时间字段 |
| `knowledgePointId` | 学习资产/个人增强/题目关联的知识点 ID |

## 使用

生成/更新后由 AI 调用：

```powershell
node scripts/log-generation.mjs --action CREATED --file base/eng_grammar_modal_can_a2.json --artifact-type KNOWLEDGE_POINT --request "生成 can 的 A2 知识点" --validation PASS
```

- 更新已有文件用 `--action UPDATED`。
- 跳过重复内容用 `--action SKIPPED --id <id> --artifact-type <type>`（不传 `--file`）。
- 需要记录用户原始提示词时加 `--prompt "..."`，会写入日志行的 `userPrompt` 字段；`--request` 仍保留简短摘要。

## 兜底同步

漏记或想重建历史时：

```powershell
node scripts/log-generation.mjs --sync
```

会扫描 `base/`、`personal/`、`questions/`，对比 `logs/manifest.json`，
把新增/修改/删除的文件补记进日志。