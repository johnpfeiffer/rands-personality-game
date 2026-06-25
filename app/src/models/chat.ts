import type { Personality, ScoredResult } from './types'

export const CHAT_API_PATH = '/rands/chat'
export const MAX_CHAT_ANSWERS = 3
export const MAX_PARAGRAPHS = 9
export const MAX_SENTENCES = 300

const PROMPT_CHAR_LIMIT = 8_000
const PROMPT_HEADROOM = 400

export interface ParsedChatResponse {
  text: string
  personalityIds: string[]
  sourceSlugs: string[]
}

export function chatIsDisabled(answerCount: number): boolean {
  return answerCount >= MAX_CHAT_ANSWERS
}

export function topNearbyPersonalities(
  ranked: ScoredResult[],
  count: number,
): Personality[] {
  return ranked.slice(0, count).map((r) => r.personality)
}

function compactText(value: string): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function serializePersonality(p: Personality): string {
  return JSON.stringify({
    id: compactText(p.id),
    name: compactText(p.name),
    description: compactText(p.description),
    source_slugs: p.source_slugs,
  })
}

export function buildChatPrompt({
  message,
  resultPersonality,
  nearbyPersonalities,
}: {
  message: string
  resultPersonality: Personality
  nearbyPersonalities: Personality[]
}): string {
  const question = compactText(message)
  const context = [
    resultPersonality,
    ...nearbyPersonalities.filter((p) => p.id !== resultPersonality.id),
  ]

  const prefix = [
    'You are a personality test assistant for the "Rands in Repose" management personality quiz.',
    'Answer the user question about their personality result.',
    'Use only the personality ids and source slugs provided below.',
    'Do not invent personality types, descriptions, or source articles.',
    'Be concise. No preamble. No summary.',
    `Limit your answer to at most ${MAX_PARAGRAPHS} paragraphs or ${MAX_SENTENCES} sentences, whichever is less.`,
    'Return JSON only with this shape: {"text":"your answer","personalityIds":["existing-id"],"sourceSlugs":["existing-slug"]}',
    `The user result is: ${resultPersonality.name} (${resultPersonality.id}).`,
    'Personalities in context:',
  ].join('\n')

  const suffix = `\nUser question: ${question}`
  const maxLength = PROMPT_CHAR_LIMIT - PROMPT_HEADROOM
  const lines: string[] = []

  for (const p of context) {
    if (!p?.id) continue
    const line = serializePersonality(p)
    const next = `${prefix}\n${[...lines, line].join('\n')}${suffix}`
    if (next.length > maxLength) break
    lines.push(line)
  }

  return `${prefix}\n${lines.join('\n')}${suffix}`
}

function tryParseJson(value: string): unknown {
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function parseJsonCandidate(message: string): unknown {
  const text = compactText(message)
  const direct = tryParseJson(text)
  if (direct) return direct

  const fenced = String(message ?? '').match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) {
    const parsed = tryParseJson(fenced[1].trim())
    if (parsed) return parsed
  }

  const original = String(message ?? '')
  const firstBrace = original.indexOf('{')
  const lastBrace = original.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return tryParseJson(original.slice(firstBrace, lastBrace + 1))
  }

  return null
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string')
}

export function parseChatResponse(
  rawMessage: string,
  personalities: Personality[],
): ParsedChatResponse | null {
  const data = parseJsonCandidate(rawMessage) as
    | { text?: unknown; personalityIds?: unknown; sourceSlugs?: unknown }
    | null
  if (!data) return null

  const text = typeof data.text === 'string' ? data.text.trim() : ''
  if (!text) return null

  const validPersonalityIds = new Set(personalities.map((p) => p.id))
  const validSourceSlugs = new Set(
    personalities.flatMap((p) => p.source_slugs),
  )

  const rawPersonalityIds = toStringArray(data.personalityIds).map((id) =>
    id.trim(),
  )
  const rawSourceSlugs = toStringArray(data.sourceSlugs).map((slug) =>
    slug.trim(),
  )

  const hasUnknownIds = rawPersonalityIds.some(
    (id) => id && !validPersonalityIds.has(id),
  )
  const hasUnknownSlugs = rawSourceSlugs.some(
    (slug) => slug && !validSourceSlugs.has(slug),
  )

  if (hasUnknownIds || hasUnknownSlugs) return null

  const personalityIds = rawPersonalityIds.filter((id) => id && validPersonalityIds.has(id))
  const sourceSlugs = rawSourceSlugs.filter((slug) => slug && validSourceSlugs.has(slug))

  return truncateResponse({ text, personalityIds, sourceSlugs })
}

export function truncateResponse(
  response: ParsedChatResponse,
): ParsedChatResponse {
  const { text } = response

  const paragraphs = text.split(/\n+/).filter((p) => p.trim())
  let result =
    paragraphs.length > MAX_PARAGRAPHS
      ? paragraphs.slice(0, MAX_PARAGRAPHS).join('\n')
      : text

  const sentences = result.match(/[^.!?]+[.!?]+/g) ?? []
  if (sentences.length > MAX_SENTENCES) {
    result = sentences.slice(0, MAX_SENTENCES).join('').trim()
  }

  return { ...response, text: result }
}
