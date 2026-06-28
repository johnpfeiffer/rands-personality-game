# Architecture

This document is AI-derived from `KERNEL/`, `SPEC/`, and `VALIDATION/`.
`KERNEL/` remains the authority if this document conflicts with it.

## System Design

```mermaid
flowchart TD
    subgraph Source["Source Data"]
        Downloader["get-data/download_rands_posts.py"] --> Articles["Rands article JSON/JSONL"]
    end

    subgraph Data["Curated Quiz Data"]
        Articles --> Personalities["app/src/data/personalities.json"]
        Articles --> Questions["app/src/data/questions.json"]
        Personalities --> Questions
    end

    subgraph Models["Domain Models"]
        Questions --> QuizModel["models/quiz.ts"]
        Questions --> ScoringModel["models/scoring.ts"]
        Personalities --> ScoringModel
    end

    subgraph Views["React Views"]
        Home["HomePage"] --> Survey["SurveyPage"]
        QuizModel --> Survey
        ScoringModel --> Survey
        ScoringModel --> Result["ResultPage"]
        Personalities --> Result
        Result --> Chat["ChatSection"]
        ChatModel["models/chat.ts"] --> Chat
        ScoringModel --> Chat
        Personalities --> Chat
    end

    subgraph ChatBackend["Chat Backend"]
        Chat -->|POST /rands/chat| Worker["Cloudflare Worker"]
        Worker --> Provider["Gemini provider"]
        Provider --> Worker
        Worker -->|JSON response| Chat
    end
```

## User Journey

```mermaid
flowchart LR
    A["/rands"] --> B["Start quiz"]
    B --> C["/rands/survey"]
    C --> D["Answer current linear question"]
    D --> E{"More questions?"}
    E -->|Yes| C
    E -->|No| F["/rands/result/:id"]
    C -->|Restart| C
    F --> G["Expand source articles"]
    F --> H["Expand full scores"]
    F --> I["Take the quiz again"]
    F --> J["Ask about result (chat)"]
    J -->|3 queries max| J
    I --> C
```

## Chat Journey

```mermaid
sequenceDiagram
  participant User
  participant ChatSection
  participant Worker as POST /rands/chat
  participant Gemini

  User->>ChatSection: Submit question
  ChatSection->>ChatSection: Build prompt from result + top 3 personalities
  ChatSection-->>User: Show animated pending state
  ChatSection->>Worker: Send JSON message
  Worker->>Gemini: Provider request
  Gemini-->>Worker: JSON response text
  Worker-->>ChatSection: message with text + ids/slugs
  ChatSection->>ChatSection: Validate ids/slugs against existing personalities
  ChatSection-->>User: Show grounded response text
  ChatSection->>ChatSection: Disable after 3 answers (INV-008)
```

## Layers

- `app/src/models/quiz.ts` owns linear quiz progression: current question,
  selected answers, completion, restart state, and progress.
- `app/src/models/scoring.ts` owns sparse score aggregation and deterministic
  result ranking.
- `app/src/models/chat.ts` owns chat prompt construction, response parsing,
  practical application guidance, grounding validation (INV-007), session
  limits (INV-008), and response truncation (max 9 paragraphs or 300
  sentences).
- `app/src/components/ChatSection.tsx` owns the chat UI: input, query counter,
  animated pending state, turn history, and error display. Calls model
  functions for all business logic.
- `app/src/data/` owns static curated personality and question JSON. The MVP
  question bank is capped at 12 questions.
- `app/src/views/` owns presentation, routing, and user interaction.

Business logic should stay in `models`; React views should call model functions
instead of embedding scoring or quiz-progression rules.

## Invariants

The app validates the kernel invariants in
`app/src/data/data-integrity.test.ts` and `app/src/models/chat.test.ts`:

- at least one personality exists
- every personality has source slugs that resolve to Rands in Repose links
- every question has at least one answer
- every question has source slugs that resolve to Rands in Repose links
- every question has answer choices that can change the final winner
- every personality is reachable through answer choices
- chat responses only reference existing personality types and source slugs (INV-007)
- chat sessions disable after 3 answers with a visible counter (INV-008)

## TLA+

The generated formal model lives in `SPEC/RandsPersonalityGame.tla`.
The runnable TLC harness lives in `VALIDATION/`.

The TLA+ domain predicates are exactly `INV001` through `INV008`, matching
`KERNEL/INVARIANTS.md`.

## Validation

For app changes:

```bash
cd app
npm test
npm run build
```

Run `npm run lint` when TypeScript, React, or build configuration changes.

For the generated TLA+ invariant check, use the command documented in
`VALIDATION/tla.md`.
