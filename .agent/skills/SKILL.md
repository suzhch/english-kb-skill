---
name: english-kb
description: >
  Create and maintain a structured English learning knowledge base.
  Use this skill when creating or updating English Knowledge Points,
  Learning Assets, Personal Enhancements, or assessment Questions.
  The skill uses the project's JSON Schemas and taxonomy, checks existing
  records before creating new ones, avoids duplicates, and writes validated
  JSON files to the appropriate directories.
---

# English Knowledge Base Skill

## Purpose

Manage a structured English learning knowledge base with four main artifact types:

1. Knowledge Point
2. Learning Asset
3. Personal Enhancement
4. Question / Assessment

The project uses JSON Schema as the structural contract and `schema-taxonomy.json`
as the controlled vocabulary for Knowledge Point classification.

## Repository Layout

Expected project layout:

```text
.
├── schemas/
│   ├── schema-base.json
│   ├── schema-taxonomy.json
│   ├── schema-learning-asset.json
│   ├── schema-personal-enhancement.json
│   └── schema-question.json
│
├── base/
│   └── <knowledge-point>.json
│
├── personal/
│   └── Enhancement/
│
└── questions/
```

If the repository uses different paths, inspect the existing project structure and
follow it rather than creating a competing directory structure.

## Task Routing

When the user asks to:

- create/find/classify/update a Knowledge Point:
  read `instructions/knowledge-point.md`
- generate Learning Assets:
  read `instructions/learning-asset.md`
- generate Personal Enhancements:
  read `instructions/personal-enhancement.md`
- generate Questions:
  read `instructions/question.md`

Always read the relevant schema before creating or modifying JSON.

## Global Rules

### 1. Existing data comes first

Before creating a new Knowledge Point or enhancement:

- inspect the relevant existing files;
- determine whether the requested concept already exists;
- reuse an existing Knowledge Point when it represents the same concept;
- do not create duplicates merely because the wording differs.

### 2. Taxonomy is controlled

For Knowledge Points, use only values defined by:

```text
schemas/schema-taxonomy.json
```

Do not invent category or subcategory values.

When category/subcategory is ambiguous, inspect the taxonomy descriptions and
selection criteria if available. If the ambiguity cannot be resolved reliably,
make the smallest defensible choice and record the uncertainty in the artifact
when the schema permits it.

### 3. Schema is the contract

The JSON Schema is authoritative for:

- required fields
- field types
- enum values
- formats
- ID patterns
- allowed structure

Do not silently add fields that are forbidden by `additionalProperties: false`.

### 4. Do not modify base knowledge unintentionally

Generating Learning Assets, Personal Enhancements, or Questions must not modify
the original Knowledge Point unless the user explicitly asks for a Knowledge Point
update.

### 5. Avoid duplicate content

Before appending content to an existing collection:

- read the existing file;
- compare semantic meaning, not only exact strings;
- do not add a duplicate;
- prefer updating an existing item when the new information is a correction or
  materially better version.

### 6. Difficulty and audience

Respect explicitly supplied:

- CEFR difficulty
- audience
- language

If they are not supplied, infer conservatively from the existing Knowledge Point
and repository conventions.

### 7. File writing

Follow `instructions/file-writing.md`.

Do not print large JSON payloads to the console when the task asks for file output.
The final response should be a concise operation summary.

### 8. Validation

After writing or modifying a JSON file:

1. validate its syntax;
2. validate it against the relevant JSON Schema when a validator is available;
3. re-read the resulting file;
4. verify references and IDs;
5. report validation failures instead of claiming success.

### 9. Minimal side effects

Only create or modify files required by the user's request.

Do not rename, reorganize, or delete unrelated knowledge-base files.

### 10. Language policy

Explanation fields and target-language corpus fields use different languages:

- Write explanation fields in the learner's explanation language. For Chinese
  learners this is Chinese. This covers judgment basis, error reasons, learning
  rationale, comparison reasons, selection basis, definitions, notes,
  comments, feedback, and translations.
- Keep target-language corpus fields in English. This covers English example
  sentences, vocabulary, expressions, dialogue text, and learner-facing
  question or answer content that must stay in the target language.
- Keep English terms for references such as topic names, tags, and
  identifiers; add a short Chinese gloss when it helps the learner.

The `Language` / `language` parameter selects the explanation language only. It
never switches the target-language corpus fields to another language.
Field-level lists are defined in each task instruction.

## Recommended Workflow

```text
User request
    ↓
Identify artifact type
    ↓
Read relevant task instruction
    ↓
Read relevant schema
    ↓
Read existing related data
    ↓
Check taxonomy / references / duplicates
    ↓
Generate or update content
    ↓
Write JSON file(s)
    ↓
Validate
    ↓
Re-read and verify
    ↓
Concise summary
```

## User Parameters

The user may provide:

```text
Knowledge Point
Target Type
Difficulty
Audience
Language
Compare With
Question Type
Question Count
Output Directory
```

Use only parameters that are relevant to the requested task.

Do not ask the user to repeat information already available in the repository.

## Important Boundary

This skill creates and maintains structured learning data. It does not decide
the learner's mastery score from a single question unless the repository has an
explicit assessment-scoring rule.
