---------------------- MODULE RandsPersonalityGameInvariantCheck ----------------------
EXTENDS RandsPersonalityGameModel

(*
TLC validation harness for the generated invariant spec.

The domain TLA+ spec in SPEC/RandsPersonalityGame.tla intentionally contains
only INV001 through INV006 as boolean predicates. TLC still needs a stateful
INIT/NEXT pair to produce a non-zero state graph, so this validation artifact
provides a one-state harness.
*)

VARIABLE checked

CheckInit ==
    checked = TRUE

CheckNext ==
    checked' = checked

=============================================================================
