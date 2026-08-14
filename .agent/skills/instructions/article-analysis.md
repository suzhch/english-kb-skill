# Article Knowledge Point Analysis Task

## Goal

Analyze an English article and report the knowledge points it contains, each
tagged with a CEFR difficulty and an existence status against the existing
knowledge base.

This is a read-only analysis task. It reports findings; it never creates or
modifies Knowledge Points, Learning Assets, Personal Enhancements, or
Questions. If the user wants the missing Knowledge Points created afterwards,
run the Knowledge Point task with explicit confirmation.

## Required Inputs

Use:

- `schemas/schema-taxonomy.json` for category/subcategory values
- existing `base/*.json` Knowledge Point records for existence checks

Typical parameters:

```text
Article / 文章
Difficulty
Audience
Language
```

- `Article / 文章`: the English article, supplied as inline text or as a file
  path inside the repository.
- `Difficulty`: the article's CEFR level. When not supplied, estimate it from
  the text.
- `Audience`, `Language`: used only to tune how the report is written.

## Procedure

1. Read `schema-taxonomy.json`.
2. Determine the article difficulty:
   - use the user-supplied `Difficulty` when provided;
   - otherwise estimate the CEFR level from vocabulary frequency, sentence
     length, clause complexity, grammatical structures, and cohesion.
3. Scan the article and extract the knowledge points it exercises:
   - grammar points: tenses, aspect, voice, modals, articles, prepositions,
     pronouns, clauses, conditionals, reported speech, and so on;
   - vocabulary points: words, phrases, phrasal verbs, idioms, collocations,
     word families;
   - expression and discourse points: fixed/common/functional expressions,
     discourse markers;
   - semantics and pragmatics features when clearly present in the text.
   - PRONUNCIATION, LISTENING, and SPEAKING knowledge points cannot be
     reliably detected from plain text. Do not invent them.
4. Classify each knowledge point with `category > subcategory` using only
   taxonomy values.
5. Assign each knowledge point its own CEFR difficulty, the level at which the
   point is normally mastered. Note whether it sits at, below, or above the
   article's difficulty. Knowledge points at the article level are the primary
   target; below-level items are prerequisites and above-level items are
   extensions.
6. Read all existing Knowledge Points from `base/`: files ending in `.json`,
   excluding `*.learning-assets.json`.
7. For each extracted knowledge point, determine its existence status by
   semantic matching (see rules below).
8. Deduplicate: report each concept once even when the article exercises it
   many times.
9. Report the list.

## Existence Matching Rules

- Match by concept, not by wording. `at/on/in prepositions` and
  `prepositions of time and place` may be the same concept; `prepositions of
  place` and `prepositions of time` are separate concepts.
- Status values:
  - `EXISTS`: an existing Knowledge Point covers the same concept at the same
    difficulty.
  - `EXISTS_OTHER_DIFFICULTY`: an existing Knowledge Point covers the same
    concept at a different difficulty. Report both difficulties.
  - `MISSING`: no existing Knowledge Point covers the concept.
- When only a broader or narrower Knowledge Point exists, mark the item
  `MISSING` and record the closest existing ID as `closestMatch`.
- Learning Asset, Personal Enhancement, and Question files are never treated
  as Knowledge Points.

## Output

Present the list directly in the response. Do not write knowledge-base files.

Language policy for the report:

- Chinese: list title, status labels, notes, and explanations (for Chinese
  learners).
- English: knowledge point names, IDs, category/subcategory, difficulty
  values, and quoted evidence from the article.

Group the list by status. For every item include:

- category/subcategory;
- concise knowledge point name;
- the knowledge point's difficulty and whether it is at/below/above the
  article level;
- one short quoted piece of evidence from the article;
- the existing ID for `EXISTS` cases, or a suggested ID following the
  repository's `eng_<category>_<subcategory>_<keyword>_<difficulty>` pattern
  for `MISSING` cases.

Example shape:

```text
文章难度: B1

[已存在 · EXISTS]
- GRAMMAR > PREPOSITION | at/on/in prepositions (B1, 与文章同级)
  证据: “We meet at 7:30 on Friday.”
  ID: eng_grammar_prepositions_at_on_in_b1

[已存在 · 难度不同 · EXISTS_OTHER_DIFFICULTY]
- GRAMMAR > TENSE | present continuous (文章 B1 / 现有 A1)
  证据: “I am looking for my key.”
  ID: eng_grammar_present_continuous_a1

[不存在 · MISSING]
- GRAMMAR > CONDITIONAL | first conditional (B1, 与文章同级)
  证据: “If it rains, we will stay at home.”
  建议ID: eng_grammar_first_conditional_b1
```

End the response with a one-line summary, for example:

```text
共 12 个知识点：5 个已存在，2 个难度不同，5 个不存在。
```

## Boundary

This task only reports findings. Creating missing Knowledge Points, Learning
Assets, or Questions requires a separate task and explicit user confirmation.
