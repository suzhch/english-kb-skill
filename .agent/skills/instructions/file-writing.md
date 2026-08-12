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

## Output Summary

After file operations, return a concise summary such as:

```text
Created:
- base/eng_grammar_preposition_at_on_in_b1.json

Updated:
- personal/Enhancement/eng_grammar_preposition_at_on_in_b1_examples.json

Skipped:
- 2 duplicate examples

Validation:
- PASS
```

Do not print the entire JSON unless explicitly requested.
