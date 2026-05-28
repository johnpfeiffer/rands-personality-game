import { describe, expect, it } from 'vitest'
import {
  answerCurrentQuestion,
  createQuizState,
  getCurrentQuestion,
  isQuizComplete,
  quizProgress,
} from './quiz'
import type { Answer, Question } from './types'

const answerA: Answer = { text: 'A', scores: { alpha: 1 } }
const answerB: Answer = { text: 'B', scores: { beta: 2 } }

const questions: Question[] = [
  { id: 'q1-v1', text: 'Q1', source_slugs: ['source-one'], answers: [answerA] },
  { id: 'q2-v1', text: 'Q2', source_slugs: ['source-two'], answers: [answerB] },
]

describe('linear quiz model', () => {
  it('starts at the first question with no selected answers', () => {
    const state = createQuizState()

    expect(state.currentQuestionIndex).toBe(0)
    expect(state.selectedAnswers).toEqual([])
    expect(getCurrentQuestion(questions, state)?.id).toBe('q1-v1')
  })

  it('advances linearly and stores selected answers', () => {
    const state = answerCurrentQuestion(createQuizState(), answerA)

    expect(state.currentQuestionIndex).toBe(1)
    expect(state.selectedAnswers).toEqual([answerA])
    expect(getCurrentQuestion(questions, state)?.id).toBe('q2-v1')
  })

  it('reports completion only after every question is answered', () => {
    let state = createQuizState()
    state = answerCurrentQuestion(state, answerA)
    expect(isQuizComplete(questions, state)).toBe(false)

    state = answerCurrentQuestion(state, answerB)
    expect(isQuizComplete(questions, state)).toBe(true)
    expect(getCurrentQuestion(questions, state)).toBeNull()
  })

  it('computes progress from answered questions over all questions', () => {
    const state = answerCurrentQuestion(createQuizState(), answerA)

    expect(quizProgress(questions, state)).toBe(50)
    expect(quizProgress([], state)).toBe(100)
  })
})
