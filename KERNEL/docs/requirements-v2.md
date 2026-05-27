Goal: analyzing the source data to extract "Personalities" (and references to source articles)

- extract a list of all Categories (probably the only relevant one is Management but just in case)
- given the example-personalities.json , extract each Personality and its source slug

Creating these files (categories.json, personalities.json) does not need a pipeline or python scripts

## Data Schema

Flat JSON files in `data/` serve as the persistence layer for the MVP.

### Personalities

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier, (e.g. `"fixer"`, `"free-electron"`) |
| `name` | string | Display name (e.g. `"The Fixer"`) |
| `description` | string | Second-person description shown as the quiz result |
| `source_slugs` | string[] | Rands in Repose article slugs that define this personality |

### Questions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Versioned identifier in the format `qN-vN` (e.g. `"q1-v1"`) |
| `text` | string | The question prompt shown to the user |
| `answers` | array | 3–4 answer options per question |
| `answers[].text` | string | The answer text shown to the user |
| `answers[].scores` | object | Sparse map of personality `id` → integer weight |

#### Question versioning

Question IDs include a version suffix (`-v1`, `-v2`, etc.) so that questions can be revised over time without breaking references to earlier versions (e.g. in saved results or analytics).

When a question is reworded or its scoring is rebalanced, bump the version rather than editing in place.

### Scoring

Scores are sparse — each answer only lists the personalities it influences. The quiz result is computed by summing scores across all answered questions and ranking personalities by total.

