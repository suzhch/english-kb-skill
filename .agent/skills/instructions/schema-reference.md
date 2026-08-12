# Schema Reference Rules

## Authoritative Schemas

The schemas are the structural source of truth:

```text
schemas/schema-base.json
schemas/schema-taxonomy.json
schemas/schema-learning-asset.json
schemas/schema-personal-enhancement.json
schemas/schema-question.json
```

## Reference Order

Before generating an artifact:

1. read the task instruction;
2. read the artifact schema;
3. read `schema-taxonomy.json` when classification is involved;
4. inspect existing records;
5. generate;
6. validate.

## `$ref`

If schemas use local references, preserve the repository's relative reference
style.

For example:

```json
"$ref": "schema-taxonomy.json#/$defs/Category"
```

Do not replace working local references with invented URLs.

## Schema Changes

Do not modify a schema merely to make generated content pass validation.

If the requested content cannot be represented by the current schema:

1. explain the mismatch briefly;
2. propose the minimum schema change;
3. wait for explicit permission before changing the schema when the user has not
   asked for a schema change.

## additionalProperties

If a schema has:

```json
"additionalProperties": false
```

do not add undocumented fields.

## IDs

Follow ID patterns defined by the schema.

Never invent an ID pattern that conflicts with the schema.

## Cross-References

When an artifact refers to a Knowledge Point:

- use the existing Knowledge Point ID;
- do not copy or invent a replacement ID;
- verify that the referenced file exists when possible.
