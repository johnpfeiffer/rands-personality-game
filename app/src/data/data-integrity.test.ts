import { describe, expect, it } from 'vitest'
import { personalities, questions } from '.'
import { rankResults, tallyScores } from '../models/scoring'
import type { Answer, Question } from '../models/types'

const RANDS_BASE = 'https://randsinrepose.com/archives/'

function sourceUrl(slug: string): string {
  return `${RANDS_BASE}${slug}/`
}

function bestAnswerForPersonality(question: Question, personalityId: string): Answer {
  return question.answers.reduce((best, answer) =>
    (answer.scores[personalityId] ?? 0) > (best.scores[personalityId] ?? 0) ? answer : best,
  )
}

describe('kernel data invariants', () => {
  it('INV-001: defines at least one personality type', () => {
    expect(personalities.length).toBeGreaterThan(0)
  })

  it('INV-002: every personality has at least one Rands source link', () => {
    for (const personality of personalities) {
      expect(
        personality.source_slugs.length,
        `${personality.id} must have source slugs`,
      ).toBeGreaterThan(0)

      for (const slug of personality.source_slugs) {
        expect(sourceUrl(slug)).toMatch(/^https:\/\/randsinrepose\.com\/archives\/.+\/$/)
      }
    }
  })

  it('INV-003: every question has at least one answer', () => {
    for (const question of questions) {
      expect(question.answers.length, `${question.id} must have answers`).toBeGreaterThan(0)
    }
  })

  it('INV-004: every question references Rands source data', () => {
    for (const question of questions) {
      expect(
        question.source_slugs.length,
        `${question.id} must have source slugs`,
      ).toBeGreaterThan(0)

      for (const slug of question.source_slugs) {
        expect(sourceUrl(slug)).toMatch(/^https:\/\/randsinrepose\.com\/archives\/.+\/$/)
      }
    }
  })

  it('INV-005: every question contributes to at least one score', () => {
    for (const question of questions) {
      const hasScoreContribution = question.answers.some((answer) =>
        Object.values(answer.scores).some((score) => score !== 0),
      )

      expect(hasScoreContribution, `${question.id} must modify a score`).toBe(true)
    }
  })

  it('INV-006: every personality is reachable as a result', () => {
    for (const personality of personalities) {
      const optimalAnswers = questions.map((question) =>
        bestAnswerForPersonality(question, personality.id),
      )
      const ranked = rankResults(tallyScores(optimalAnswers), personalities)

      expect(ranked[0].personality.id, `${personality.id} must be reachable`).toBe(personality.id)
    }
  })

  it('uses unique ids and versioned question ids', () => {
    const personalityIds = personalities.map((personality) => personality.id)
    const questionIds = questions.map((question) => question.id)

    expect(new Set(personalityIds).size).toBe(personalityIds.length)
    expect(new Set(questionIds).size).toBe(questionIds.length)

    for (const questionId of questionIds) {
      expect(questionId).toMatch(/^q\d+-v\d+$/)
    }
  })

  it('all answer score keys reference known personalities', () => {
    const validIds = new Set(personalities.map((personality) => personality.id))

    for (const question of questions) {
      for (const answer of question.answers) {
        for (const scoreKey of Object.keys(answer.scores)) {
          expect(validIds.has(scoreKey), `unknown personality "${scoreKey}" in ${question.id}`).toBe(true)
        }
      }
    }
  })
})
