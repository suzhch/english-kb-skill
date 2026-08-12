# Knowledge Point Task

## Goal

Create or maintain a canonical English Knowledge Point in the `base/` knowledge
base.

A Knowledge Point describes the underlying knowledge. It should not be a personal
note, a question, or a collection of examples.

## Required Inputs

Use:

- `schemas/schema-base.json`
- `schemas/schema-taxonomy.json`

Optional:

- learner age
- CEFR level
- audience
- language

## Procedure

1. Read `schema-base.json`.
2. Read `schema-taxonomy.json`.
3. Search existing `base/` records for the requested concept.
4. Decide whether the request maps to an existing Knowledge Point.
5. If an existing Knowledge Point is suitable:
   - do not create a duplicate;
   - update it only if the user explicitly requested an update.
6. If no suitable Knowledge Point exists:
   - create a new ID following the schema;
   - classify it using only taxonomy values;
   - write a concise, canonical definition.
7. Keep the Knowledge Point independent of personal learning history.
8. Save the result under the repository's established `base/` directory.
9. Validate the file against `schema-base.json`.

## Classification Rules

Use:

```text
category
    ↓
subcategory
```

as the primary classification.

Category answers:

> What broad area of English knowledge is this?

Subcategory answers:

> What specific kind of knowledge is it?

Do not use category/subcategory as a list of every characteristic of the
knowledge point.

## Quality Rules

A good Knowledge Point:

- represents one coherent concept;
- has a stable identity;
- is reusable by multiple Learning Assets;
- is not tied to one learner's mistake;
- does not contain excessive examples;
- does not contain personal learning notes.

## Language

Write the Knowledge Point in the learner's explanation language. For Chinese
learners this is Chinese:

- Chinese: `definition.name`, `definition.description`, `examples[].translation`,
  `examples[].note`, `expressions[].meaning`, `expressions[].scenario`.
- English: `examples[].english`, `expressions[].expression`, `tags`,
  `relatedTopics`, and the `register` enum value.

## Output

Write the JSON file directly.

After completion, report:

- created or updated path;
- Knowledge Point ID;
- category/subcategory;
- validation result.

Do not print the complete JSON unless explicitly requested.
