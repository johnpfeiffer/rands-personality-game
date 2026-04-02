export interface Personality {
  id: string
  name: string
  description: string
  source_slugs: string[]
}

export interface Answer {
  text: string
  scores: Record<string, number>
}

export interface Question {
  id: string
  text: string
  answers: Answer[]
}

export interface ScoredResult {
  personality: Personality
  score: number
}
