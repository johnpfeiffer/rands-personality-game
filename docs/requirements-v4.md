# Goal

Replace the linear question order with an adaptive question engine so users reach a confident personality result in fewer than 20 questions.

## Requirements

- pick the next question by **expected information gain** rather than sequential order
- stop early when the leading personality is either:
  - **mathematically uncatchable**: raw score exceeds every rival's best possible final score
  - **probabilistically dominant**: Bayesian posterior ≥ 0.9 and raw score margin ≥ 2
- every personality must still be reachable (no personality locked out by question ordering)
- restart still resets all state (engine + scores)
- the final result uses the same `tallyScores` / `rankResults` scoring as v3

## Design

- the engine is a pure function module
- SurveyPage progress bar should reflect "questions answered / questions needed" (dynamic, not fixed /20)
- when the quiz ends early, the result page experience is identical to a full-length quiz

