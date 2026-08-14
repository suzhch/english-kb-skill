# File Writing Rules

## General Principle

The filesystem is the source of truth.

When the user asks the Agent to create or update the knowledge base, write the
artifact to disk instead of printing the complete JSON in the final response.

## Before Writing

1. Determine the correct output directory from the repository.
2. Inspect existing files.
3. Determine whether the requested artifact already exists.
4. Check for semantic duplicates.
5. Preserve unrelated files.

## Creating

Create only the files required by the task.

Use UTF-8 JSON.

Prefer 2-space indentation unless the repository uses another established style.

Ensure the final file contains valid JSON, not a Markdown code fence.

## Updating

When updating an existing JSON file:

1. read the current file;
2. preserve unrelated content;
3. make the smallest necessary change;
4. avoid reformatting unrelated content when practical;
5. write the complete valid JSON back;
6. validate after writing.

## Multiple Content Items

If the schema contains:

```json
"content": {
  "type": "array"
}
```

group related samples in the same object unless the user explicitly asks for
separate files.

For example:

```text
personal/Enhancement/eng_xxx_examples.json
```

should normally contain one enhancement object with:

```text
content[]
```

containing multiple samples.

## Duplicate Handling

For exact or semantic duplicates:

- do not create a new duplicate;
- if the new version is materially better and the task allows updates, update
  the existing item;
- otherwise skip it.

## Existing File Policy

Default:

```text
create if missing
update when clearly appropriate
never overwrite unrelated data
never delete unless explicitly requested
```

## Generation Logging

Every generation request must append one log entry per file operation to:

```text
logs/generation.log.jsonl
```

Use `scripts/log-generation.mjs` instead of writing the log line by hand. The
script reads the generated JSON to extract `id`, `createdAt`, `updatedAt`, and
classification fields, then appends one JSON line with the current time.

After creating or updating an artifact:

```powershell
node scripts/log-generation.mjs --action CREATED `
  --file base/eng_grammar_modal_can_a2.json `
  --artifact-type KNOWLEDGE_POINT `
  --request "Create an A2 knowledge point for can" `
  --validation PASS
```

Pass `--prompt "..."` to record the exact user input prompt verbatim in the
`userPrompt` log field; `--request` remains the short summary.

Use `--action UPDATED` when modifying an existing file, and `--action SKIPPED`
with `--id` and no `--file` when a duplicate or unneeded item is skipped.

To backfill missing entries after the fact:

```powershell
node scripts/log-generation.mjs --sync
```

Sync scans `base/`, `personal/`, and `questions/`, compares file modification
times against `logs/manifest.json`, and appends `CREATED`, `UPDATED`, and
`DELETED` entries for every change since the last run.

Log line fields (one JSON object per line):

- `ts`: ISO 8601 time the entry was appended.
- `action`: `CREATED`, `UPDATED`, `SKIPPED`, `SYNC`, or `DELETED`.
- `artifactType`: `KNOWLEDGE_POINT`, `LEARNING_ASSET`, `PERSONAL_ENHANCEMENT`,
  or `QUESTION`.
- `id`: artifact ID.
- `file`: repository-relative path.
- `request`: concise summary of the user request.
- `validation`: `PASS`, `FAIL`, or `N/A`.
- Optional: `category`, `subcategory`, `difficulty`, `createdAt`, `updatedAt`,
  `knowledgePointId`.

Example line:

```json
{"ts":"2026-08-14T15:55:28+09:00","action":"CREATED","artifactType":"KNOWLEDGE_POINT","id":"eng_grammar_modal_can_a2","file":"base/eng_grammar_modal_can_a2.json","request":"Create an A2 knowledge point for can","validation":"PASS","category":"GRAMMAR","subcategory":"MODAL","difficulty":"A2","createdAt":"2026-08-14T09:00:00+09:00"}
```
## Output Summary

After file operations, return a concise summary such as:

```text
Created:
- base/eng_grammar_preposition_at_on_in_b1.json

Updated:
- personal/Enhancement/eng_grammar_preposition_at_on_in_b1_examples.json

Skipped:
- 2 duplicate examples

Log:
- logs/generation.log.jsonl appended

Validation:
- PASS
```

Do not print the entire JSON unless explicitly requested.
