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
    PersonalityOrderPairs,
    PersonalitySourcePairs,
    QuestionSourcePairs,
    QuestionAnswerPairs,
    AnswerScoreTriples

PersonalitySources(p) ==
    {src \in RandsSources : <<p, src>> \in PersonalitySourcePairs}

QuestionSources(q) ==
    {src \in RandsSources : <<q, src>> \in QuestionSourcePairs}

QuestionAnswers(q) ==
    {a \in Answers : <<q, a>> \in QuestionAnswerPairs}

ScoresFor(a, p) ==
    {n \in ScoreValues : <<a, p, n>> \in AnswerScoreTriples}

AnswerScore(a, p) ==
    IF ScoresFor(a, p) = {} THEN 0 ELSE CHOOSE n \in ScoresFor(a, p) : TRUE

PersonalityOrder(p) ==
    CHOOSE n \in 1..Cardinality(Personalities) : <<p, n>> \in PersonalityOrderPairs

CompleteSelections ==
    {selection \in [Questions -> Answers] :
        \A q \in Questions : selection[q] \in QuestionAnswers(q)}

RECURSIVE SumScores(_, _, _)

SumScores(remaining, selection, p) ==
    IF remaining = {} THEN 0
    ELSE
        LET q == CHOOSE question \in remaining : TRUE
        IN AnswerScore(selection[q], p) + SumScores(remaining \ {q}, selection, p)

Score(selection, p) ==
    SumScores(Questions, selection, p)

Winner(selection) ==
    CHOOSE p \in Personalities :
        /\ \A rival \in Personalities : Score(selection, p) >= Score(selection, rival)
        /\ \A rival \in Personalities :
            (Score(selection, p) = Score(selection, rival) =>
                PersonalityOrder(p) <= PersonalityOrder(rival))

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
        \E first \in CompleteSelections :
            \E second \in CompleteSelections :
                /\ first[q] # second[q]
                /\ \A other \in Questions \ {q} : first[other] = second[other]
                /\ Winner(first) # Winner(second)

INV006 ==
    \A p \in Personalities :
        \E selection \in CompleteSelections : Winner(selection) = p

=============================================================================
