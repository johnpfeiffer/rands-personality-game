# MVP Implementation Plan

This plan is AI-derived and must not be treated as authority over `KERNEL/`.

## Principles

- Use Red/Green TDD for behavior changes.
- Prefer concise table-driven tests.
- Keep business logic in `models`.
- Keep React views focused on presentation, routing, and user interaction.
- Do not modify `KERNEL/`.
- Update `docs/architecture.md` after refactors or new features.
- No task is complete if required tests are failing.

## Phase 1: Data Validation

1. Add data tests for the six kernel invariants.
2. Validate at least one personality exists.
3. Validate every personality has at least one Rands source reference.
4. Validate every question has at least one answer.
5. Validate every question has source grounding.
6. Validate every question modifies at least one score.
7. Validate every personality is reachable through a complete answer path.

## Phase 2: Source Ingestion

1. Test downloader/parser behavior with local fixtures.
2. Prefer the WordPress REST API.
3. Keep sitemap/page scraping as fallback.
4. Write structured article JSON, JSONL corpus, and manifest outputs.
5. Exclude blog comments for MVP.
6. Run a live download when network access is available.

## Phase 3: Curated Quiz Data

1. Curate personalities from source material.
2. Ensure each personality has source slugs.
3. Create versioned questions with source references.
4. Ensure every answer score key is a known personality id.
5. Prove each personality can be the top-ranked result.

## Phase 4: Linear Quiz App

1. Ask questions in question-bank order.
2. Accumulate sparse scores as answers are selected.
3. Keep restart available during the quiz.
4. Do not allow previous-answer editing in MVP.
5. Navigate to a readable result route after the final question.
6. Show the result personality, source links, and expandable full scores.

## Phase 5: Final Verification

Run the relevant checks before marking work complete:

```bash
rtk npm --prefix app exec vitest run
rtk npm --prefix app run lint
rtk npm --prefix app run build
```

For TLA+ validation:

Use the temporary TLC harness workflow documented in
`VALIDATION/tla.md`. The domain TLA+ module must keep only `INV001` through
`INV006` as boolean predicates.

When source ingestion changes are included, also run downloader/parser tests and
a live download where network access is available.
