# Validation Artifacts

These validation artifacts are AI-derived proof obligations from `KERNEL/`.
They are not authority over the kernel.

Use `validation-plan.md` as the checklist for implementation, refactoring, and
release readiness.

`tla.md` describes the generated TLA+ model and how to bind it to concrete app
data for TLC validation.

`RandsPersonalityGameInvariantCheck.tla` and `.cfg` provide the runnable TLC
harness for the generated invariant spec.
