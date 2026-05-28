--------------------------- MODULE RandsPersonalityGame ---------------------------
EXTENDS Integers, FiniteSets

(*
AI-generated MVP TLA+ model derived from KERNEL/INVARIANTS.md.

Authority rule: this module is not authority over KERNEL/. If this model and
the kernel disagree, the kernel wins.

Specification generation rule:
Every predicate below is named after and traces directly to a numbered
INV-xxx entry in KERNEL/INVARIANTS.md. Non-boolean operators only transform
literal model data into convenient sets for those predicates.
*)

CONSTANTS
    Personalities,
    Questions,
    Answers,
    RandsSources,
    ScoreValues,
    PersonalitySourcePairs,
    QuestionSourcePairs,
    QuestionAnswerPairs,
    AnswerScoreTriples,
    ReachableOutcomes

PersonalitySources(p) ==
    {src \in RandsSources : <<p, src>> \in PersonalitySourcePairs}

QuestionSources(q) ==
    {src \in RandsSources : <<q, src>> \in QuestionSourcePairs}

QuestionAnswers(q) ==
    {a \in Answers : <<q, a>> \in QuestionAnswerPairs}

INV001 ==
    Personalities # {}

INV002 ==
    \A p \in Personalities : PersonalitySources(p) # {}

INV003 ==
    \A q \in Questions : QuestionAnswers(q) # {}

INV004 ==
    \A q \in Questions : QuestionSources(q) # {}

INV005 ==
    \A q \in Questions :
        \E a \in QuestionAnswers(q) :
            \E p \in Personalities :
                \E n \in ScoreValues :
                    /\ <<a, p, n>> \in AnswerScoreTriples
                    /\ n # 0

INV006 ==
    ReachableOutcomes = Personalities

=============================================================================
