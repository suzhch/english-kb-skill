# Question / Assessment Task

## Goal

Generate assessment questions that measure a specific English Knowledge Point
and, when applicable, a specific skill or learning objective.

## Required Inputs

Use:

- `schemas/schema-question.json`
- target Knowledge Point
- relevant Learning Assets
- existing questions for duplicate detection

Typical parameters:

```text
Difficulty
Question Type
Question Count
Audience
Language
Skill / Objective
```

## Question Types

Use only values defined by the question schema.

The project may include:

- `MULTIPLE_CHOICE`
- `MULTIPLE_SELECT`
- `TRUE_FALSE`
- `FILL_IN_THE_BLANK`
- `SHORT_ANSWER`
- `ORDERING`
- `MATCHING`
- `ERROR_CORRECTION`
- `TRANSLATION`

Do not assume two types are equivalent.

For example:

- `MULTIPLE_CHOICE`: exactly one correct option unless the schema says otherwise.
- `MULTIPLE_SELECT`: more than one option may be correct.
- `TRUE_FALSE`: evaluates a proposition.
- `FILL_IN_THE_BLANK`: requires the learner to supply missing content.
- `ERROR_CORRECTION`: presents an incorrect form and asks the learner to correct it.

## Generation Rules

1. Read the Knowledge Point.
2. Read relevant Learning Assets.
3. Identify exactly what the question should assess.
4. Match the requested CEFR difficulty.
5. Make the correct answer unambiguous.
6. Ensure distractors are plausible but objectively incorrect.
7. Avoid testing knowledge that is unrelated to the target Knowledge Point.
8. Avoid duplicate questions already present in the repository.
9. Do not leak the answer through wording, option length, formatting, or metadata.
10. Include explanations/rationales only when allowed by the schema.

## Language

- Chinese: the learner-facing instructions in `question.stem` (the tested
  English sentence stays in English), `question.context` when it explains a
  scenario, `explanation`, and `distractors[].reason`.
- English: `question.context` when it is an English passage the learner must
  read, `options[].text`, `answer.value`, `acceptedAnswers`,
  `blanks[].acceptedAnswers`, and English sentences inside `question.stem`.

## Question Quality

A good question should answer:

> What specific knowledge or skill does this question measure?

A question should not merely contain the target word or grammar point. The
learner's response must actually provide evidence about the target knowledge.

## Output

Write questions directly to the configured question directory.

Prefer grouping multiple questions into the repository's normal collection format
when the schema supports arrays.

Do not create one file per question unless the schema or existing repository
convention requires it.

Validate the result against `schema-question.json`.

Report:

- file path;
- number of questions;
- question type;
- difficulty;
- validation result.
