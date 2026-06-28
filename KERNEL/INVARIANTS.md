# Invariants

Invariants are properties that must remain true across all derived artifacts and implementation work.

## INV-001: There is at least 1 personality type

There is a defined personality type that is the end result of the game.

## INV-002: Personality Types come from the Source

Every personality type must have at least 1 source link back to randsinrepose.com

## INV-003: Each Question has at least 1 answer

## INV-004: Each Question references the Source

Questions must be grounded from source data from randsinrepose.com

## INV-005: Every question can change the outcome

For each question, there exist answer choices that produce different final personality types.

## INV-006: Each Personality Type must be reachable

For each personality type defined, there must be a series of questions with answers that modify the scores, that results in that personality type being the outcome.

## INV-007: Chat responses are grounded only in existing personality types and their sources

A user must have a final personality score in order to chat.

A chat response can only reference personality types that exist in the game and sources that trace to their source_slugs.

Chat must not invent or mutate personality types, descriptions, or source articles.

## INV-008: Chat sessions have a maximum number of interactions

There is a visible count of chat interactions. At the maximum of 3 chat answers, new submissions are disabled.

## INV-009: Chat incorporates questions and answers

The questions used and User responses must inform Chat answers.

the Chat responses to the User persist like the answers to the question and final score, until the User resets or restarts.

