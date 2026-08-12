# Personal Enhancement Task

## Goal

Create personal learning supplements for an existing Knowledge Point or Learning
Asset without modifying the canonical base knowledge.

Use this task when the learner needs additional explanations, examples,
comparisons, memory methods, scenarios, confusion notes, or other personally
useful material.

## Required Inputs

Use:

- `schemas/schema-personal-enhancement.json`
- target Knowledge Point
- existing Personal Enhancement records

Typical parameters:

```text
Target Type
Difficulty
Audience
Language
Compare With
```

## Core Rules

1. Read the Knowledge Point first.
2. Read existing enhancements for the same Knowledge Point and Target Type.
3. Generate only the requested `targetType`.
4. Do not create unrelated Target Types.
5. Do not rewrite the base Knowledge Point.
6. Do not duplicate existing enhancement content.
7. Each new content item must add meaningful learning value.
8. Match the requested CEFR difficulty and audience.
9. Use the requested language.
10. If no meaningful new content exists, do not create an unnecessary record.

## Content Array Rule

When `schema-personal-enhancement.json` defines:

```json
"content": {
  "type": "array"
}
```

the default behavior is:

- create one Personal Enhancement object;
- put multiple related samples in its `content` array;
- do not create one file per sample.

For example:

```json
{
  "targetType": "EXAMPLE",
  "enhancementType": "BETTER_EXAMPLE",
  "content": [
    {
      "...": "sample 1"
    },
    {
      "...": "sample 2"
    },
    {
      "...": "sample 3"
    }
  ]
}
```

If an existing file already contains the same logical enhancement, append only
new non-duplicate items when appropriate.

## Target Type Guidance

### DEFINITION

Generate easier, alternative, or learner-friendly explanations.

### EXAMPLE

Generate practical, natural, frequent, or context-rich examples.

### COMPARISON

Explain similarities, differences, selection rules, and likely confusion.
Use `Compare With` when supplied.

### ASSOCIATION

Connect the knowledge to related grammar, vocabulary, collocations, word
families, or concepts.

### SCENARIO

Show realistic situations in which the knowledge is naturally used.

### COUNTER_EXAMPLE

Show cases where an intuitive but incorrect rule fails.

### CONFUSION

Explain common learner mistakes and how to distinguish the correct usage.

### MNEMONIC

Provide logical and memorable memory methods. Do not invent false etymologies.

### EXTENSION

Recommend closely related knowledge that should be studied next.

## Language

Write enhancement content in the learner's explanation language. For Chinese
learners this is Chinese:

- Chinese: `title` and the explanatory parts of `content[]` items.
- English: example sentences, vocabulary, expressions, and other quoted
  target-language material inside `content[]` items; they keep their original
  English form.

## Output

Write the enhancement file under the configured Personal Enhancement directory.

Do not print the complete JSON to the console.

After writing, report:

- created/updated file;
- Knowledge Point ID;
- Target Type;
- number of content items;
- validation result.
