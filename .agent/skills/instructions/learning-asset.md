# Learning Asset Task

## Goal

Create learning material that helps a learner understand, distinguish, remember,
or apply an existing Knowledge Point.

Learning Assets are pedagogical representations of the Knowledge Point. They are
not replacements for the canonical Knowledge Point.

The fundamental storage rule is:

> ONE Knowledge Point = ONE Learning Asset collection file.

`schema-learning-asset.json` only supports the collection form. A Learning Asset
file always represents one Knowledge Point and contains generated strategy items
under top-level `assets[]`.

## Required Inputs

Use:

- `schemas/schema-learning-asset.json`
- the target Knowledge Point
- existing Learning Assets if the repository contains them

Typical parameters:

```text
Strategy
Difficulty
Audience
Language
Compare With
```

## Strategies

Supported strategies are those defined by `schema-learning-asset.json` at:

```text
$defs.Strategy.enum
```

Common examples include:

- `CLASSIFICATION`
- `COMPARISON`
- `ASSOCIATION`
- `EXAMPLE`
- `COUNTER_EXAMPLE`
- `PRODUCTION`
- `EXPLANATION`
- `SCENARIO`
- `DIALOGUE`
- `MNEMONIC`
- `CONFUSION`
- `EXTENSION`

Do not invent strategies.

## Collection Rules

When the user asks for all strategies, every strategy, or a full Learning Assets
set for one Knowledge Point:

- create one top-level Learning Asset collection file;
- set top-level `knowledgePointId` to the target Knowledge Point ID;
- put one asset object per strategy under top-level `assets[]`;
- include every strategy listed in `schema-learning-asset.json`
  `$defs.Strategy.enum`;
- do not create separate files for each strategy unless the user explicitly asks.

When the user specifies one strategy or a subset of strategies:

- find the existing Learning Asset collection file for the target Knowledge
  Point, if it exists;
- if it does not exist, create the collection file first;
- append one new item to `assets[]` for each requested strategy that is not
  already present;
- never overwrite or replace an existing strategy item;
- if a requested strategy already exists in `assets[]`, skip it and report it as
  skipped;
- update only the top-level `updatedAt` timestamp when new items are appended.

## Generation Rules

1. Read the target Knowledge Point completely.
2. Read existing Learning Assets for that Knowledge Point.
3. If `COMPARISON` is requested and `Compare With` is supplied, compare exactly
   those concepts.
4. Do not simply copy the base definition.
5. Prefer learner-useful explanations, examples, contrasts, and application.
6. Keep examples appropriate to the requested difficulty.
7. Avoid semantically duplicate assets.
8. Treat `assets[].strategy` as unique within one Learning Asset collection.
9. Do not overwrite an existing `assets[]` item for the same strategy.
10. If an existing strategy item could be improved, leave it unchanged unless
    the user explicitly asks to update or replace it.

## Language

Write explanation and rationale fields in the learner's explanation language.
For Chinese learners this is Chinese:

- Chinese: `classification.reason`, `comparison.similarities`,
  `comparison.differences`, `association.note`, `example.note`,
  `example.translation`, `counterExample.reason`, `explanation.myUnderstanding`,
  `confusion.reason`, `scenario.description`, `mnemonic.method`,
  `mnemonic.content`, `production.mySentence` (the task prompt),
  `production.feedback`.
- English: `example.english`, `association.relatedWords`, `counterExample.wrong`,
  `dialogue.conversation[].text`, and English terms in `compareWith`,
  `confusedWith`, `parent`, and `extension.nextTopics`.

Learner production (sentences the learner writes in `production`) stays in
English; only the surrounding prompt and feedback are in the explanation
language.

## Output

Write the generated Learning Asset collection to the repository's established
Learning Asset directory.

Validate against `schema-learning-asset.json`.

Report only a concise summary after writing.
