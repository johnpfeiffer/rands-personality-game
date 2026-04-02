import type { Personality, Question } from '../models/types'
import personalitiesData from './personalities.json'
import questionsData from './questions.json'

export const personalities = personalitiesData.personalities as unknown as Personality[]
export const questions = questionsData.questions as unknown as Question[]

export function getPersonalityById(id: string): Personality | undefined {
  return personalities.find((p) => p.id === id)
}
