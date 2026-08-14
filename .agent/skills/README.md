# english-kb Agent Skill

This directory contains the reusable Agent Skill for maintaining an English
Knowledge Base.

## Installation

Copy this directory to the project's skills location:

```text
.agents/skills/english-kb/
```

The resulting layout should be:

```text
.agents/
└── skills/
    └── english-kb/
        ├── SKILL.md
        └── instructions/
            ├── knowledge-point.md
            ├── learning-asset.md
            ├── article-analysis.md
            ├── personal-enhancement.md
            ├── question.md
            ├── schema-reference.md
            └── file-writing.md
```

The Skill expects the project's schemas to remain in the repository, normally:

```text
schemas/
├── schema-base.json
├── schema-taxonomy.json
├── schema-learning-asset.json
├── schema-personal-enhancement.json
└── schema-question.json
```

This Skill package intentionally does not duplicate those project schemas.
It references them so that there is one authoritative copy.

## Example Requests

```text
Create a B1 Knowledge Point for at/on/in.
```

```text
For eng_grammar_preposition_at_on_in_b1, generate EXAMPLE Learning Assets
for middle-school learners in Chinese.
```

```text
For eng_grammar_preposition_at_on_in_b1, add COMPARISON Personal Enhancements.
Compare at, on, and in. Difficulty B1. Audience: 中学生. Language: 中文.
```

```text
Generate 10 B1 MULTIPLE_CHOICE questions for
eng_grammar_preposition_at_on_in_b1.
```

```text
Analyze this article and list the knowledge points it contains at B1. For each
knowledge point, mark whether it already exists in the knowledge base or is
missing.
```

## Logging

Generation requests are recorded in the project's `logs/generation.log.jsonl`
by `scripts/log-generation.mjs`, invoked as part of the `file-writing.md`
workflow. Use its `--sync` mode to backfill missed entries:

```powershell
node scripts/log-generation.mjs --sync
```
