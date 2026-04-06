import { describe, it, expect } from 'vitest'
import {
  precomputeQuestionMeta,
  createEngineState,
  isUncatchable,
  isSoftDominant,
  shouldStopEarly,
  pickNextQuestion,
  updateState,
} from './question-engine'
import type { Question, Personality } from './types'
import { personalities, questions } from '../data'

const miniPersonalities: Personality[] = [
  { id: 'alpha', name: 'Alpha', description: '', source_slugs: [] },
  { id: 'beta', name: 'Beta', description: '', source_slugs: [] },
  { id: 'gamma', name: 'Gamma', description: '', source_slugs: [] },
]

const miniQuestions: Question[] = [
  {
    id: 'q1',
    text: 'Q1',
    answers: [
      { text: 'a1', scores: { alpha: 3 } },
      { text: 'a2', scores: { beta: 3 } },
      { text: 'a3', scores: { gamma: 3 } },
    ],
  },
  {
    id: 'q2',
    text: 'Q2',
    answers: [
      { text: 'a1', scores: { alpha: 2, beta: 1 } },
      { text: 'a2', scores: { beta: 2, gamma: 1 } },
      { text: 'a3', scores: { gamma: 2, alpha: 1 } },
    ],
  },
  {
    id: 'q3',
    text: 'Q3',
    answers: [
      { text: 'a1', scores: { alpha: 3 } },
      { text: 'a2', scores: { beta: 3 } },
      { text: 'a3', scores: { gamma: 3 } },
    ],
  },
]

describe('precomputeQuestionMeta', () => {
  it('computes max score per personality per question', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    // q1: alpha gets 3 from a1, beta gets 3 from a2, gamma gets 3 from a3
    expect(meta[0].maxByPersonality).toEqual({ alpha: 3, beta: 3, gamma: 3 })
    expect(meta[1].maxByPersonality).toEqual({ alpha: 2, beta: 2, gamma: 2 })
  })

  it('computes answer likelihoods for each personality', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    // For q1, alpha: answer 0 has score 3, others 0
    // P(a0 | alpha) should be highest
    const alphaLikelihoods = meta[0].likelihoodByPersonality['alpha']
    expect(alphaLikelihoods[0]).toBeGreaterThan(alphaLikelihoods[1])
    expect(alphaLikelihoods[0]).toBeGreaterThan(alphaLikelihoods[2])
    // likelihoods sum to 1
    const sum = alphaLikelihoods.reduce((s, v) => s + v, 0)
    expect(sum).toBeCloseTo(1.0)
  })
})

describe('createEngineState', () => {
  it('initializes uniform posterior', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    const state = createEngineState(miniPersonalities, meta)
    expect(state.posterior['alpha']).toBeCloseTo(1 / 3)
    expect(state.posterior['beta']).toBeCloseTo(1 / 3)
    expect(state.posterior['gamma']).toBeCloseTo(1 / 3)
  })

  it('initializes empty totals and asked set', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    const state = createEngineState(miniPersonalities, meta)
    expect(state.asked.size).toBe(0)
    expect(state.totals['alpha']).toBe(0)
  })

  it('initializes remMax from all questions', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    const state = createEngineState(miniPersonalities, meta)
    // Each personality: q1 max=3, q2 max=2, q3 max=3 → 8
    expect(state.remMax['alpha']).toBe(8)
    expect(state.remMax['beta']).toBe(8)
    expect(state.remMax['gamma']).toBe(8)
  })
})

describe('updateState', () => {
  it('adds answer scores to totals', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    const state = createEngineState(miniPersonalities, meta)
    const next = updateState(state, miniQuestions[0], miniQuestions[0].answers[0], meta[0])
    expect(next.totals['alpha']).toBe(3)
    expect(next.totals['beta']).toBe(0)
  })

  it('marks question as asked', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    const state = createEngineState(miniPersonalities, meta)
    const next = updateState(state, miniQuestions[0], miniQuestions[0].answers[0], meta[0])
    expect(next.asked.has('q1')).toBe(true)
  })

  it('reduces remMax by the question max', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    const state = createEngineState(miniPersonalities, meta)
    const next = updateState(state, miniQuestions[0], miniQuestions[0].answers[0], meta[0])
    // all personalities: was 8, q1 max=3, now 5
    expect(next.remMax['alpha']).toBe(5)
    expect(next.remMax['beta']).toBe(5)
  })

  it('updates posterior toward the scored personality', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    const state = createEngineState(miniPersonalities, meta)
    // answer that scores alpha:3
    const next = updateState(state, miniQuestions[0], miniQuestions[0].answers[0], meta[0])
    expect(next.posterior['alpha']).toBeGreaterThan(next.posterior['beta'])
    expect(next.posterior['alpha']).toBeGreaterThan(next.posterior['gamma'])
  })
})

describe('isUncatchable', () => {
  const cases: { name: string; totals: Record<string, number>; remMax: Record<string, number>; expected: boolean }[] = [
    {
      name: 'leader cannot be caught',
      totals: { alpha: 10, beta: 2, gamma: 1 },
      remMax: { alpha: 0, beta: 3, gamma: 3 },
      expected: true,   // beta best = 5, gamma best = 4, leader = 10
    },
    {
      name: 'rival can still tie',
      totals: { alpha: 5, beta: 2, gamma: 1 },
      remMax: { alpha: 0, beta: 3, gamma: 3 },
      expected: false,   // beta best = 5, can tie alpha
    },
    {
      name: 'rival can surpass',
      totals: { alpha: 5, beta: 2, gamma: 1 },
      remMax: { alpha: 0, beta: 6, gamma: 3 },
      expected: false,
    },
    {
      name: 'all zeros no one uncatchable',
      totals: { alpha: 0, beta: 0, gamma: 0 },
      remMax: { alpha: 3, beta: 3, gamma: 3 },
      expected: false,
    },
  ]

  cases.forEach(({ name, totals, remMax, expected }) => {
    it(name, () => {
      expect(isUncatchable(totals, remMax)).toBe(expected)
    })
  })
})

describe('isSoftDominant', () => {
  const cases: { name: string; posterior: Record<string, number>; totals: Record<string, number>; expected: boolean }[] = [
    {
      name: 'dominant posterior and score margin',
      posterior: { alpha: 0.95, beta: 0.03, gamma: 0.02 },
      totals: { alpha: 8, beta: 3, gamma: 2 },
      expected: true,
    },
    {
      name: 'high posterior but close scores',
      posterior: { alpha: 0.95, beta: 0.03, gamma: 0.02 },
      totals: { alpha: 5, beta: 4, gamma: 2 },
      expected: false,
    },
    {
      name: 'low posterior',
      posterior: { alpha: 0.6, beta: 0.3, gamma: 0.1 },
      totals: { alpha: 8, beta: 3, gamma: 2 },
      expected: false,
    },
  ]

  cases.forEach(({ name, posterior, totals, expected }) => {
    it(name, () => {
      expect(isSoftDominant(posterior, totals)).toBe(expected)
    })
  })
})

describe('shouldStopEarly', () => {
  it('returns false at the start', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    const state = createEngineState(miniPersonalities, meta)
    expect(shouldStopEarly(state)).toBe(false)
  })

  it('returns true when leader is mathematically uncatchable', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    const state = createEngineState(miniPersonalities, meta)
    // Simulate: answered all 3 questions favoring alpha
    let s = state
    s = updateState(s, miniQuestions[0], miniQuestions[0].answers[0], meta[0])
    s = updateState(s, miniQuestions[1], miniQuestions[1].answers[0], meta[1])
    s = updateState(s, miniQuestions[2], miniQuestions[2].answers[0], meta[2])
    // alpha: 3+2+3=8, beta: 0+1+0=1, gamma: 0+0+0=0; remMax all 0
    expect(shouldStopEarly(s)).toBe(true)
  })
})

describe('pickNextQuestion', () => {
  it('returns a question not yet asked', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    const state = createEngineState(miniPersonalities, meta)
    const next = pickNextQuestion(state, miniQuestions, meta)
    expect(next).not.toBeNull()
    expect(state.asked.has(next!.id)).toBe(false)
  })

  it('returns null when all questions asked', () => {
    const meta = precomputeQuestionMeta(miniQuestions, miniPersonalities)
    let state = createEngineState(miniPersonalities, meta)
    state = updateState(state, miniQuestions[0], miniQuestions[0].answers[0], meta[0])
    state = updateState(state, miniQuestions[1], miniQuestions[1].answers[0], meta[1])
    state = updateState(state, miniQuestions[2], miniQuestions[2].answers[0], meta[2])
    const next = pickNextQuestion(state, miniQuestions, meta)
    expect(next).toBeNull()
  })

  it('prefers discriminating questions over redundant ones', () => {
    // After eliminating beta, the engine should prefer a question that
    // differentiates between the remaining contenders (alpha vs gamma)
    // over a question that only differentiates alpha vs beta (already decided)
    const asymQuestions: Question[] = [
      {
        id: 'q1', text: 'Q1',
        answers: [
          { text: 'a1', scores: { alpha: 3 } },
          { text: 'a2', scores: { beta: 3 } },
          { text: 'a3', scores: { gamma: 3 } },
        ],
      },
      {
        id: 'qUseful', text: 'Useful',
        answers: [
          { text: 'a1', scores: { alpha: 3 } },
          { text: 'a2', scores: { gamma: 3 } },
        ],
      },
      {
        id: 'qWaste', text: 'Waste',
        answers: [
          { text: 'a1', scores: { beta: 3 } },
          { text: 'a2', scores: { beta: 2 } },
        ],
      },
    ]
    const asymMeta = precomputeQuestionMeta(asymQuestions, miniPersonalities)
    let state = createEngineState(miniPersonalities, asymMeta)
    // Answer q1 for alpha → posterior favors alpha, beta is down, gamma uncertain
    state = updateState(state, asymQuestions[0], asymQuestions[0].answers[0], asymMeta[0])
    const next = pickNextQuestion(state, asymQuestions, asymMeta)
    // qUseful differentiates alpha vs gamma; qWaste only touches beta (already low)
    expect(next!.id).toBe('qUseful')
  })
})

describe('full-data integration', () => {
  it('every personality is reachable via adaptive engine', () => {
    const meta = precomputeQuestionMeta(questions, personalities)
    for (const target of personalities) {
      let state = createEngineState(personalities, meta)
      const answered: string[] = []
      for (let i = 0; i < questions.length; i++) {
        if (shouldStopEarly(state)) break
        const q = pickNextQuestion(state, questions, meta)
        if (!q) break
        const qIdx = questions.findIndex((x) => x.id === q.id)
        const metaQ = meta[qIdx]
        // pick the best answer for target personality
        const bestAnswer = q.answers.reduce((best, a) =>
          (a.scores[target.id] ?? 0) > (best.scores[target.id] ?? 0) ? a : best,
        )
        state = updateState(state, q, bestAnswer, metaQ)
        answered.push(q.id)
      }
      // target should be the winner or tied for the lead
      const leader = Object.entries(state.totals).sort((a, b) => b[1] - a[1])[0]
      expect(
        state.totals[target.id],
        `${target.id} should be reachable but scored ${state.totals[target.id]} vs leader ${leader[0]}=${leader[1]} after ${answered.length} questions`,
      ).toBe(leader[1])
    }
  })

  it('adaptive engine uses fewer questions on average than asking all 20', () => {
    const meta = precomputeQuestionMeta(questions, personalities)
    let totalQuestions = 0
    for (const target of personalities) {
      let state = createEngineState(personalities, meta)
      let count = 0
      for (let i = 0; i < questions.length; i++) {
        if (shouldStopEarly(state)) break
        const q = pickNextQuestion(state, questions, meta)
        if (!q) break
        const qIdx = questions.findIndex((x) => x.id === q.id)
        const bestAnswer = q.answers.reduce((best, a) =>
          (a.scores[target.id] ?? 0) > (best.scores[target.id] ?? 0) ? a : best,
        )
        state = updateState(state, q, bestAnswer, meta[qIdx])
        count++
      }
      totalQuestions += count
    }
    const avg = totalQuestions / personalities.length
    expect(avg).toBeLessThan(20)
  })
})
