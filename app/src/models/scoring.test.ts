import { describe, it, expect } from 'vitest'
import { tallyScores, rankResults } from './scoring'
import type { Personality, Answer, Question } from './types'
import { personalities, questions } from '../data'

const mockPersonalities: Personality[] = [
  { id: 'alpha', name: 'Alpha', description: 'desc-a', source_slugs: [] },
  { id: 'beta', name: 'Beta', description: 'desc-b', source_slugs: [] },
  { id: 'gamma', name: 'Gamma', description: 'desc-g', source_slugs: [] },
]

describe('tallyScores', () => {
  const cases: { name: string; answers: Answer[]; expected: Record<string, number> }[] = [
    {
      name: 'no answers yields empty map',
      answers: [],
      expected: {},
    },
    {
      name: 'single answer adds its scores',
      answers: [{ text: 'a', scores: { alpha: 3, beta: 1 } }],
      expected: { alpha: 3, beta: 1 },
    },
    {
      name: 'multiple answers accumulate scores',
      answers: [
        { text: 'a', scores: { alpha: 2 } },
        { text: 'b', scores: { alpha: 1, gamma: 3 } },
      ],
      expected: { alpha: 3, gamma: 3 },
    },
  ]

  cases.forEach(({ name, answers, expected }) => {
    it(name, () => {
      expect(tallyScores(answers)).toEqual(expected)
    })
  })
})

describe('rankResults', () => {
  const cases: { name: string; totals: Record<string, number>; expectedOrder: string[] }[] = [
    {
      name: 'ranks by descending score',
      totals: { alpha: 1, beta: 5, gamma: 3 },
      expectedOrder: ['beta', 'gamma', 'alpha'],
    },
    {
      name: 'ties broken alphabetically by id',
      totals: { beta: 3, alpha: 3, gamma: 1 },
      expectedOrder: ['alpha', 'beta', 'gamma'],
    },
    {
      name: 'personalities with no score get 0 and sort alphabetically',
      totals: { beta: 2 },
      expectedOrder: ['beta', 'alpha', 'gamma'],
    },
  ]

  cases.forEach(({ name, totals, expectedOrder }) => {
    it(name, () => {
      const results = rankResults(totals, mockPersonalities)
      expect(results.map((r) => r.personality.id)).toEqual(expectedOrder)
    })
  })
})

describe('highest score wins the result', () => {
  const cases: { name: string; totals: Record<string, number>; expectedWinner: string }[] = [
    {
      name: 'single dominant personality wins',
      totals: { fixer: 10, coach: 2, wolf: 1 },
      expectedWinner: 'fixer',
    },
    {
      name: 'close race decided by score',
      totals: { organic: 7, mechanic: 6, coach: 5 },
      expectedWinner: 'organic',
    },
    {
      name: 'tie broken alphabetically by id',
      totals: { wolf: 5, anchor: 5 },
      expectedWinner: 'anchor',
    },
  ]

  cases.forEach(({ name, totals, expectedWinner }) => {
    it(name, () => {
      const ranked = rankResults(totals, personalities)
      expect(ranked[0].personality.id).toBe(expectedWinner)
      expect(ranked[0].score).toBe(
        Math.max(...Object.values(totals), 0),
      )
    })
  })
})

function bestAnswerForPersonality(question: Question, personalityId: string): Answer {
  return question.answers.reduce((best, answer) =>
    (answer.scores[personalityId] ?? 0) > (best.scores[personalityId] ?? 0) ? answer : best,
  )
}

describe('every personality is reachable', () => {
  personalities.forEach((p) => {
    it(`${p.name} (${p.id}) can win by picking optimal answers`, () => {
      const optimalAnswers = questions.map((q) => bestAnswerForPersonality(q, p.id))
      const totals = tallyScores(optimalAnswers)
      const ranked = rankResults(totals, personalities)
      expect(ranked[0].personality.id).toBe(p.id)
    })
  })
})

describe('question data integrity', () => {
  it('every score key in questions references a valid personality id', () => {
    const validIds = new Set(personalities.map((p) => p.id))
    for (const q of questions) {
      for (const a of q.answers) {
        for (const scoreKey of Object.keys(a.scores)) {
          expect(validIds.has(scoreKey), `unknown personality "${scoreKey}" in ${q.id}`).toBe(true)
        }
      }
    }
  })

  it('every personality id appears in at least one answer score', () => {
    const scoredIds = new Set<string>()
    for (const q of questions) {
      for (const a of q.answers) {
        for (const key of Object.keys(a.scores)) {
          scoredIds.add(key)
        }
      }
    }
    for (const p of personalities) {
      expect(scoredIds.has(p.id), `personality "${p.id}" is never scored`).toBe(true)
    }
  })
})
