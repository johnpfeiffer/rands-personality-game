# TLA+ Validation Notes

The generated TLA+ model is at `SPEC/RandsPersonalityGame.tla`.
The bounded literal model data is at `SPEC/RandsPersonalityGameModel.tla`.
The runnable TLC harness is at
`VALIDATION/RandsPersonalityGameInvariantCheck.tla` with config
`VALIDATION/RandsPersonalityGameInvariantCheck.cfg`.

## What It Models

The model focuses only on the six MVP kernel invariants:

- there is at least one personality
- every personality has at least one Rands in Repose source
- every question has at least one answer
- every question has at least one Rands in Repose source
- every question contributes to scoring
- every personality is reachable as an outcome

## Abstractions

The spec intentionally abstracts the reachability computation behind literal
model data for `ReachableOutcomes`.

For implementation validation, `ReachableOutcomes` should be computed from the
real personality and question JSON data by tests or a model-generation script.

## Suggested Next Step

Replace the hand-written bounded config with a generator that reads the
application JSON data and emits a TLC model configuration. Keep generated
validation artifacts outside `KERNEL/`.

## Verification

Homebrew's OpenJDK may need to be added to `PATH` for `tla`:

```bash
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
```

TLC needs a stateful harness even though the domain TLA+ spec is intentionally
constant-only. The validation harness provides a one-state `INIT`/`NEXT` so TLC
generates a non-zero state graph while checking `INV001` through `INV006`.

To run it from the repository root:

```bash
rtk /bin/zsh -lc 'tmp=/private/tmp/rands-tla-check; rm -rf "$tmp"; mkdir -p "$tmp"; cp SPEC/RandsPersonalityGame.tla "$tmp"/; cp SPEC/RandsPersonalityGameModel.tla "$tmp"/; cp VALIDATION/RandsPersonalityGameInvariantCheck.tla "$tmp"/; cp VALIDATION/RandsPersonalityGameInvariantCheck.cfg "$tmp"/; cd "$tmp"; export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"; tla tlc RandsPersonalityGameInvariantCheck'
```

The harness config checks each invariant separately:

```tla
INIT CheckInit
NEXT CheckNext
INVARIANT INV001
INVARIANT INV002
INVARIANT INV003
INVARIANT INV004
INVARIANT INV005
INVARIANT INV006
```

Latest local result:

- SANY parsed the validation harness plus `RandsPersonalityGameModel.tla` and
  `RandsPersonalityGame.tla`.
- TLC completed successfully.
- States generated: 2.
- Distinct states found: 1.
- Search depth: 1.
- Invariant violations: 0.
