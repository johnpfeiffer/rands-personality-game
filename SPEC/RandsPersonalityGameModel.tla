------------------------- MODULE RandsPersonalityGameModel -------------------------
EXTENDS RandsPersonalityGame

(*
Literal bounded TLC model data for the MVP invariant spec.

The model file intentionally contains only literal test data. Derived values are
operators in RandsPersonalityGame.tla.
*)

CPersonalities == {"wolf", "coach"}

CQuestions == {"q1-v1", "q2-v1"}

CAnswers == {"q1-a1", "q1-a2", "q2-a1", "q2-a2"}

CRandsSources == {
    "https://randsinrepose.com/archives/the-wolf/",
    "https://randsinrepose.com/archives/the-coach-and-the-fixer/"
}

CScoreValues == {0, 1}

CPersonalityOrderPairs == {
    <<"coach", 1>>,
    <<"wolf", 2>>
}

CPersonalitySourcePairs == {
    <<"wolf", "https://randsinrepose.com/archives/the-wolf/">>,
    <<"coach", "https://randsinrepose.com/archives/the-coach-and-the-fixer/">>
}

CQuestionSourcePairs == {
    <<"q1-v1", "https://randsinrepose.com/archives/the-wolf/">>,
    <<"q2-v1", "https://randsinrepose.com/archives/the-coach-and-the-fixer/">>
}

CQuestionAnswerPairs == {
    <<"q1-v1", "q1-a1">>,
    <<"q1-v1", "q1-a2">>,
    <<"q2-v1", "q2-a1">>,
    <<"q2-v1", "q2-a2">>
}

CAnswerScoreTriples == {
    <<"q1-a1", "wolf", 1>>,
    <<"q1-a1", "coach", 0>>,
    <<"q1-a2", "wolf", 0>>,
    <<"q1-a2", "coach", 1>>,
    <<"q2-a1", "wolf", 1>>,
    <<"q2-a1", "coach", 0>>,
    <<"q2-a2", "wolf", 0>>,
    <<"q2-a2", "coach", 1>>
}

=============================================================================
