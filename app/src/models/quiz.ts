import type { Answer, Question } from './types'

export interface QuizState {
  currentQuestionIndex: number
  selectedAnswers: Answer[]
}

export function createQuizState(): QuizState {
  return {
    currentQuestionIndex: 0,
    selectedAnswers: [],
  }
}

export function getCurrentQuestion(questions: Question[], state: QuizState): Question | null {
  return questions[state.currentQuestionIndex] ?? null
}

export function answerCurrentQuestion(state: QuizState, answer: Answer): QuizState {
  return {
    currentQuestionIndex: state.currentQuestionIndex + 1,
    selectedAnswers: [...state.selectedAnswers, answer],
  }
}

export function isQuizComplete(questions: Question[], state: QuizState): boolean {
  return state.currentQuestionIndex >= questions.length
}

export function quizProgress(questions: Question[], state: QuizState): number {
  if (questions.length === 0) return 100
  return (state.currentQuestionIndex / questions.length) * 100
}
