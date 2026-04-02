import { describe, it, expect } from 'vitest'
import { tallyScores, rankResults } from './scoring'
import type { Personality, Answer } from './types'

const personalities: Personality[] = [
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
      const results = rankResults(totals, personalities)
      expect(results.map((r) => r.personality.id)).toEqual(expectedOrder)
    })
  })
})
