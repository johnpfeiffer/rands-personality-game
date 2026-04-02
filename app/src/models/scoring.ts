import type { Answer, Personality, ScoredResult } from './types'

export function tallyScores(answers: Answer[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const answer of answers) {
    for (const [id, weight] of Object.entries(answer.scores)) {
      totals[id] = (totals[id] ?? 0) + weight
    }
  }
  return totals
}

export function rankResults(
  totals: Record<string, number>,
  personalities: Personality[],
): ScoredResult[] {
  return personalities
    .map((p) => ({ personality: p, score: totals[p.id] ?? 0 }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.personality.id.localeCompare(b.personality.id)
    })
}
