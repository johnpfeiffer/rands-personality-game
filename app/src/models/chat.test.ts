import { describe, it, expect } from 'vitest'
import {
  CHAT_API_PATH,
  MAX_CHAT_ANSWERS,
  MAX_PARAGRAPHS,
  MAX_SENTENCES,
  buildChatQuizResponses,
  buildChatPrompt,
  chatIsDisabled,
  parseChatResponse,
  truncateResponse,
  topNearbyPersonalities,
} from './chat'
import type { Answer, Personality, Question, ScoredResult } from './types'

const personalities: Personality[] = [
  {
    id: 'wolf',
    name: 'The Wolf',
    description: 'You thrive in chaos.',
    source_slugs: ['the-wolf', 'sometimes-your-job-is-to-stay-the-hell-out-of-the-way'],
  },
  {
    id: 'fixer',
    name: 'The Fixer',
    description: 'You dive in headfirst.',
    source_slugs: ['a-deep-breath', 'the-coach-and-the-fixer'],
  },
  {
    id: 'coach',
    name: 'The Coach',
    description: 'You make others better.',
    source_slugs: ['the-coach-and-the-fixer'],
  },
]

const ranked: ScoredResult[] = [
  { personality: personalities[0], score: 10 },
  { personality: personalities[1], score: 7 },
  { personality: personalities[2], score: 4 },
]

describe('chatIsDisabled', () => {
  it('disables at the maximum answer count', () => {
    expect(chatIsDisabled(0)).toBe(false)
    expect(chatIsDisabled(1)).toBe(false)
    expect(chatIsDisabled(2)).toBe(false)
    expect(chatIsDisabled(3)).toBe(true)
    expect(chatIsDisabled(4)).toBe(true)
  })

  it('uses a max of 3', () => {
    expect(MAX_CHAT_ANSWERS).toBe(3)
  })
})

describe('topNearbyPersonalities', () => {
  it('returns the top N personalities from ranked results', () => {
    const top3 = topNearbyPersonalities(ranked, 3)
    expect(top3.map((p) => p.id)).toEqual(['wolf', 'fixer', 'coach'])
  })

  it('handles count larger than available', () => {
    const top = topNearbyPersonalities(ranked, 10)
    expect(top).toHaveLength(3)
  })
})

describe('buildChatQuizResponses', () => {
  it('pairs completed questions with the selected answers', () => {
    const questions: Question[] = [
      {
        id: 'q1-v1',
        text: 'How do you plan?',
        source_slugs: ['the-wolf'],
        answers: [],
      },
      {
        id: 'q2-v1',
        text: 'How do you react to ambiguity?',
        source_slugs: ['a-deep-breath'],
        answers: [],
      },
    ]
    const answers: Answer[] = [
      { text: 'I make a map.', scores: { wolf: 1 } },
      { text: 'I move first and refine later.', scores: { fixer: 1 } },
    ]

    expect(buildChatQuizResponses(questions, answers)).toEqual([
      {
        questionId: 'q1-v1',
        questionText: 'How do you plan?',
        answerText: 'I make a map.',
      },
      {
        questionId: 'q2-v1',
        questionText: 'How do you react to ambiguity?',
        answerText: 'I move first and refine later.',
      },
    ])
  })

  it('ignores answers without a matching question', () => {
    expect(
      buildChatQuizResponses([], [{ text: 'orphan', scores: { wolf: 1 } }]),
    ).toEqual([])
  })
})

describe('buildChatPrompt', () => {
  it('includes the user question, result personality, and context', () => {
    const prompt = buildChatPrompt({
      message: 'Tell me about my result',
      resultPersonality: personalities[0],
      nearbyPersonalities: topNearbyPersonalities(ranked, 3),
    })

    expect(prompt).toContain('Tell me about my result')
    expect(prompt).toContain('wolf')
    expect(prompt).toContain('The Wolf')
    expect(prompt).toContain('fixer')
    expect(prompt).toContain('the-wolf')
    expect(prompt).toContain('sometimes-your-job-is-to-stay-the-hell-out-of-the-way')
    expect(prompt).toContain('Do not invent')
  })

  it('marks the user result personality', () => {
    const prompt = buildChatPrompt({
      message: 'Why am I a wolf?',
      resultPersonality: personalities[0],
      nearbyPersonalities: topNearbyPersonalities(ranked, 3),
    })

    expect(prompt).toContain('The user result is: The Wolf (wolf)')
  })

  it('includes response format and conciseness instructions', () => {
    const prompt = buildChatPrompt({
      message: 'Explain',
      resultPersonality: personalities[0],
      nearbyPersonalities: [personalities[0], personalities[1]],
    })

    expect(prompt).toContain('Return JSON only')
    expect(prompt).toContain(`${MAX_PARAGRAPHS} paragraphs`)
    expect(prompt).toContain(`${MAX_SENTENCES} sentences`)
  })

  it('allows practical application answers without a fixed template', () => {
    const prompt = buildChatPrompt({
      message: 'How does that help me with quarterly roadmap planning?',
      resultPersonality: personalities[0],
      nearbyPersonalities: [personalities[0], personalities[1]],
    })

    expect(prompt).toContain('Answer the user question directly and practically')
    expect(prompt).toContain('instead of using a fixed template')
    expect(prompt).toContain('general workplace reasoning')
    expect(prompt).toContain(
      'How does that help me with quarterly roadmap planning?',
    )
  })

  it('includes quiz questions and selected answers for chat context', () => {
    const prompt = buildChatPrompt({
      message: 'How does this affect planning?',
      resultPersonality: personalities[0],
      nearbyPersonalities: [personalities[0], personalities[1]],
      quizResponses: [
        {
          questionId: 'q1-v1',
          questionText: 'How do you make roadmap decisions?',
          answerText: 'I pick the most interesting hard problem.',
        },
      ],
    })

    expect(prompt).toContain('Use the quiz response context')
    expect(prompt).toContain('Quiz responses:')
    expect(prompt).toContain('How do you make roadmap decisions?')
    expect(prompt).toContain('I pick the most interesting hard problem.')
  })

  it('stays within the character limit', () => {
    const prompt = buildChatPrompt({
      message: 'A'.repeat(500),
      resultPersonality: personalities[0],
      nearbyPersonalities: topNearbyPersonalities(ranked, 3),
    })

    expect(prompt.length).toBeLessThanOrEqual(8000)
  })

  it('uses the correct API path', () => {
    expect(CHAT_API_PATH).toBe('/links/chat')
  })
})

describe('parseChatResponse', () => {
  it('parses a valid response with grounded ids and slugs', () => {
    const result = parseChatResponse(
      JSON.stringify({
        text: 'The Wolf is about thriving in chaos.',
        personalityIds: ['wolf'],
        sourceSlugs: ['the-wolf'],
      }),
      personalities,
    )

    expect(result).not.toBeNull()
    expect(result!.text).toBe('The Wolf is about thriving in chaos.')
    expect(result!.personalityIds).toEqual(['wolf'])
    expect(result!.sourceSlugs).toEqual(['the-wolf'])
  })

  it('rejects responses with unknown personality ids', () => {
    const result = parseChatResponse(
      JSON.stringify({
        text: 'Some text.',
        personalityIds: ['wolf', 'invented-type'],
        sourceSlugs: [],
      }),
      personalities,
    )

    expect(result).toBeNull()
  })

  it('rejects responses with unknown source slugs', () => {
    const result = parseChatResponse(
      JSON.stringify({
        text: 'Some text.',
        personalityIds: [],
        sourceSlugs: ['the-wolf', 'fake-slug'],
      }),
      personalities,
    )

    expect(result).toBeNull()
  })

  it('parses JSON embedded in fenced code blocks', () => {
    const result = parseChatResponse(
      'Sure.\n```json\n{"text":"You are a wolf.","personalityIds":["wolf"],"sourceSlugs":[]}\n```',
      personalities,
    )

    expect(result).not.toBeNull()
    expect(result!.text).toBe('You are a wolf.')
  })

  it('parses JSON embedded in plain text via brace extraction', () => {
    const result = parseChatResponse(
      'Here is your answer: {"text":"You thrive in chaos.","personalityIds":["wolf"],"sourceSlugs":["the-wolf"]} Hope that helps!',
      personalities,
    )

    expect(result).not.toBeNull()
    expect(result!.personalityIds).toEqual(['wolf'])
  })

  it('returns null for non-JSON responses', () => {
    expect(parseChatResponse('I cannot help with that.', personalities)).toBeNull()
  })

  it('returns null for empty text', () => {
    expect(
      parseChatResponse(
        JSON.stringify({ text: '  ', personalityIds: [], sourceSlugs: [] }),
        personalities,
      ),
    ).toBeNull()
  })

  it('allows responses with no ids or slugs (general advice)', () => {
    const result = parseChatResponse(
      JSON.stringify({
        text: 'Your result suggests you prefer action over deliberation.',
        personalityIds: [],
        sourceSlugs: [],
      }),
      personalities,
    )

    expect(result).not.toBeNull()
    expect(result!.text).toBe(
      'Your result suggests you prefer action over deliberation.',
    )
  })
})

describe('truncateResponse', () => {
  it('truncates to max paragraphs when exceeded', () => {
    const text = Array.from({ length: 15 }, (_, i) => `Paragraph ${i + 1}.`).join('\n')
    const result = truncateResponse({ text, personalityIds: [], sourceSlugs: [] })

    const paragraphs = result.text.split('\n').filter((p) => p.trim())
    expect(paragraphs).toHaveLength(MAX_PARAGRAPHS)
  })

  it('keeps text within both limits', () => {
    const shortText = 'One sentence. Two sentences.'
    const result = truncateResponse({
      text: shortText,
      personalityIds: [],
      sourceSlugs: [],
    })

    expect(result.text).toBe(shortText)
  })
})
