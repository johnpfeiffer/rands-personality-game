import type { Answer, Personality, Question } from './types'

const EPSILON = 0.25
const BETA = 1.3
const POSTERIOR_THRESHOLD = 0.90
const SCORE_MARGIN = 2

export interface QuestionMeta {
  maxByPersonality: Record<string, number>
  likelihoodByPersonality: Record<string, number[]>
}

export interface EngineState {
  asked: Set<string>
  totals: Record<string, number>
  posterior: Record<string, number>
  remMax: Record<string, number>
}

export function precomputeQuestionMeta(
  questions: Question[],
  personalities: Personality[],
): QuestionMeta[] {
  return questions.map((q) => {
    const maxByPersonality: Record<string, number> = {}
    const likelihoodByPersonality: Record<string, number[]> = {}

    for (const p of personalities) {
      let maxScore = 0
      const rawCompat: number[] = []

      for (const a of q.answers) {
        const score = a.scores[p.id] ?? 0
        if (score > maxScore) maxScore = score
        rawCompat.push(Math.pow(EPSILON + score, BETA))
      }

      maxByPersonality[p.id] = maxScore

      const total = rawCompat.reduce((s, v) => s + v, 0)
      likelihoodByPersonality[p.id] = rawCompat.map((v) => v / total)
    }

    return { maxByPersonality, likelihoodByPersonality }
  })
}

export function createEngineState(
  personalities: Personality[],
  meta: QuestionMeta[],
): EngineState {
  const n = personalities.length
  const totals: Record<string, number> = {}
  const posterior: Record<string, number> = {}
  const remMax: Record<string, number> = {}

  for (const p of personalities) {
    totals[p.id] = 0
    posterior[p.id] = 1 / n
    remMax[p.id] = meta.reduce((sum, m) => sum + (m.maxByPersonality[p.id] ?? 0), 0)
  }

  return { asked: new Set(), totals, posterior, remMax }
}

export function updateState(
  state: EngineState,
  question: Question,
  answer: Answer,
  questionMeta: QuestionMeta,
): EngineState {
  const answerIdx = question.answers.indexOf(answer)
  const newTotals = { ...state.totals }
  const newPosterior = { ...state.posterior }
  const newRemMax = { ...state.remMax }
  const newAsked = new Set(state.asked)
  newAsked.add(question.id)

  for (const pid of Object.keys(newTotals)) {
    newTotals[pid] += answer.scores[pid] ?? 0
    newRemMax[pid] -= questionMeta.maxByPersonality[pid] ?? 0
    newPosterior[pid] *= questionMeta.likelihoodByPersonality[pid][answerIdx]
  }

  normalize(newPosterior)

  return { asked: newAsked, totals: newTotals, posterior: newPosterior, remMax: newRemMax }
}

function normalize(dist: Record<string, number>): void {
  const sum = Object.values(dist).reduce((s, v) => s + v, 0)
  if (sum > 0) {
    for (const k of Object.keys(dist)) {
      dist[k] /= sum
    }
  }
}

export function isUncatchable(
  totals: Record<string, number>,
  remMax: Record<string, number>,
): boolean {
  const entries = Object.entries(totals)
  if (entries.length === 0) return false

  const leaderScore = Math.max(...entries.map(([, v]) => v))
  const leaderIds = entries.filter(([, v]) => v === leaderScore).map(([id]) => id)

  for (const [id, score] of entries) {
    if (leaderIds.includes(id)) continue
    if (score + (remMax[id] ?? 0) >= leaderScore) return false
  }

  return leaderScore > 0
}

export function isSoftDominant(
  posterior: Record<string, number>,
  totals: Record<string, number>,
): boolean {
  const entries = Object.entries(totals)
  if (entries.length < 2) return false

  const sorted = [...entries].sort((a, b) => b[1] - a[1])
  const [leaderId, leaderScore] = sorted[0]
  const runnerUpScore = sorted[1][1]

  return posterior[leaderId] >= POSTERIOR_THRESHOLD && leaderScore >= runnerUpScore + SCORE_MARGIN
}

export function shouldStopEarly(state: EngineState): boolean {
  return (
    isUncatchable(state.totals, state.remMax) ||
    isSoftDominant(state.posterior, state.totals)
  )
}

function entropy(dist: Record<string, number>): number {
  let h = 0
  for (const p of Object.values(dist)) {
    if (p > 0) h -= p * Math.log2(p)
  }
  return h
}

function expectedInfoGain(
  state: EngineState,
  question: Question,
  questionMeta: QuestionMeta,
): number {
  const currentH = entropy(state.posterior)
  let expectedH = 0

  for (let aIdx = 0; aIdx < question.answers.length; aIdx++) {
    // P(answer | current state) = sum_p posterior[p] * P(answer | p)
    let pAnswer = 0
    const hypothetical: Record<string, number> = {}

    for (const pid of Object.keys(state.posterior)) {
      const likelihood = questionMeta.likelihoodByPersonality[pid][aIdx]
      const joint = state.posterior[pid] * likelihood
      pAnswer += joint
      hypothetical[pid] = joint
    }

    if (pAnswer > 0) {
      normalize(hypothetical)
      expectedH += pAnswer * entropy(hypothetical)
    }
  }

  return currentH - expectedH
}

export function pickNextQuestion(
  state: EngineState,
  questions: Question[],
  meta: QuestionMeta[],
): Question | null {
  let bestQuestion: Question | null = null
  let bestIG = -1

  for (let i = 0; i < questions.length; i++) {
    if (state.asked.has(questions[i].id)) continue
    const ig = expectedInfoGain(state, questions[i], meta[i])
    if (ig > bestIG) {
      bestIG = ig
      bestQuestion = questions[i]
    }
  }

  return bestQuestion
}
