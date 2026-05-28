# AI Generated Specifications

These files are AI-derived interpretations of the immutable kernel in `KERNEL/`.
They are not authority. If any generated spec conflicts with `KERNEL/`, the
kernel wins.

## Kernel Inputs

- `KERNEL/AGENTS.md`
- `KERNEL/INVARIANTS.md`
- `KERNEL/docs/requirements-v1.md`
- `KERNEL/docs/requirements-v2.md`
- `KERNEL/docs/requirements-v3.md`
- `KERNEL/docs/architecture.md`
- `KERNEL/docs/example-personalities.json`
- `KERNEL/docs/example-download.html`

This generated spec set is scoped to the current kernel files. If a derived
artifact conflicts with `KERNEL/`, the kernel wins. If two kernel documents
appear to conflict, implementation work must escalate instead of silently
choosing one.

## Generated Spec Set

- `product-spec.md` defines the user-facing game behavior.
- `data-spec.md` defines source, personality, and question data contracts.
- `engine-spec.md` defines MVP scoring behavior. The filename is retained for
  continuity with the prior generated spec set.
- `implementation-plan.md` defines the Red/Green implementation sequence.
- `RandsPersonalityGame.tla` defines a formal TLA+ model of the six MVP kernel
  invariants. Its boolean predicates are exactly `INV001` through `INV006`.
- `RandsPersonalityGameModel.tla` defines bounded literal model data for TLC
  validation.

## Authority Rule

Derived artifacts may clarify or make kernel requirements testable, but they
must not weaken kernel invariants:

- At least one personality type exists.
- Every personality type links back to `randsinrepose.com`.
- Every question has at least one answer.
- Every question references source material from `randsinrepose.com`.
- Every question can change the final outcome.
- Every personality type is reachable as a quiz outcome.
