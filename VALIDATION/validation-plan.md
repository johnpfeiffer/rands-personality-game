# Validation Plan

## Goal

Prove that derived specs and implementation preserve the immutable kernel
invariants and MVP requirements.

## Required Commands

For app changes:

```bash
cd app
npm test
npm run build
```

Run lint for implementation changes that touch TypeScript, React, or build
configuration:

```bash
cd app
npm run lint
```

For source ingestion changes:

```bash
rtk python3 get-data/download_rands_posts.py --max-posts 5
```

A full live download should be run when the downloader implementation changes
and network access is available.

## Invariant Proof Matrix

| Invariant | Proof obligation | Suggested validation |
| --- | --- | --- |
| INV-001 | At least one personality exists. | Data test counts personalities. |
| INV-002 | Every personality links to Rands in Repose. | Data test validates source URLs or derived URLs from slugs. |
| INV-003 | Every question has at least one answer. | Data test validates non-empty `answers`. |
| INV-004 | Every question references source data. | Data test validates question `source_slugs` or `source_urls`. |
| INV-005 | Every question contributes to score. | Data test validates at least one non-zero score across answers. |
| INV-006 | Every personality is reachable. | Reachability test searches answer paths or uses a deterministic solver. |

## Product Requirement Proof Matrix

| Requirement | Proof obligation | Suggested validation |
| --- | --- | --- |
| Linear MVP flow. | Questions are asked in question-bank order. | Survey view test. |
| Restart resets all state. | Previous answers and scores are cleared. | Survey and result view tests. |
| No back-editing in MVP. | UI offers no previous-answer mutation path. | Survey view test. |
| Readable result URL. | Result route includes personality id. | Router/view test. |
| Result shows source links. | Winning personality links to source articles. | Result view test. |
| Result can show all scores. | Score details are expandable. | Result view test. |
| Final result uses sparse scoring. | Winner equals `rankResults(tallyScores(...))` after all questions. | Scoring and survey tests. |

## Data Validation Cases

- Empty personality list fails.
- Personality without source references fails.
- Personality source not on `randsinrepose.com` fails.
- Question without answers fails.
- Question without source references fails.
- Question with only zero or empty scores fails.
- Answer score key not matching a personality id fails.
- Duplicate personality id fails.
- Duplicate question id fails.
- Question id without `qN-vN` format fails.
- Unreachable personality fails.

## Scoring Validation Cases

- Sparse scores accumulate across selected answers.
- Missing personality score keys count as zero.
- Highest score ranks first.
- Ties use deterministic ordering.
- All configured personalities appear in the ranked result list.
- Restarted scoring state behaves like a fresh quiz.

## UI Validation Cases

- Home page links to survey.
- Survey displays one question at a time.
- Answering a question advances to the next linear question or completes after
  the final question.
- Restart is available during survey.
- Result page displays the matched personality.
- Result page exposes source links through an expander.
- Result page exposes all scores through an expander.
- Unknown result ids are handled without crashing.
- Mobile viewport has no overlapping primary content.

## Documentation Validation

After completing refactors or features:

- Update `docs/architecture.md`.
- Include system design and user journey Mermaid diagrams.
- Ensure documentation reflects model, view, and controller boundaries.
- Record any validation that could not be run.
