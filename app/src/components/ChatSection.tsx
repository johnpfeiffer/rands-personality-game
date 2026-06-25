import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { personalities as allPersonalitiesData } from '../data'
import {
  CHAT_API_PATH,
  MAX_CHAT_ANSWERS,
  buildChatPrompt,
  chatIsDisabled,
  parseChatResponse,
  topNearbyPersonalities,
} from '../models/chat'
import type { Personality, ScoredResult } from '../models/types'

interface ChatTurn {
  id: string
  question: string
  text: string
}

interface ChatSectionProps {
  resultPersonality: Personality
  ranked: ScoredResult[]
  hasScores: boolean
}

async function readResponseJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

export default function ChatSection({
  resultPersonality,
  ranked,
  hasScores,
}: ChatSectionProps) {
  const [message, setMessage] = useState('')
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const answerCount = turns.length
  const disabled = chatIsDisabled(answerCount)
  const remaining = Math.max(MAX_CHAT_ANSWERS - answerCount, 0)

  if (!hasScores) {
    return (
      <Alert severity="warning" sx={{ mt: 3 }}>
        Chat is only available for those completing the full quiz.
      </Alert>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || disabled || submitting) return

    setSubmitting(true)
    setError('')

    try {
      const nearby = topNearbyPersonalities(ranked, 3)
      const prompt = buildChatPrompt({
        message: trimmed,
        resultPersonality,
        nearbyPersonalities: nearby,
      })

      const response = await fetch(CHAT_API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      })
      const body = (await readResponseJson(response)) as {
        message?: string
        error?: string
      }

      if (!response.ok) {
        throw new Error(body?.error || 'Chat request failed')
      }

      const parsed = parseChatResponse(body?.message ?? '', allPersonalitiesData)
      if (!parsed) {
        throw new Error('No grounded response was returned.')
      }

      setTurns((current) => [
        ...current,
        {
          id: `${Date.now()}-${current.length}`,
          question: trimmed,
          text: parsed.text,
        },
      ])
      setMessage('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chat request failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Ask about your result
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Queries used: {answerCount} / {MAX_CHAT_ANSWERS}
        {remaining > 0 ? ` (${remaining} remaining)` : ''}
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
        <Stack spacing={1.5}>
          <TextField
            label="Ask a question about your personality"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            minRows={2}
            maxRows={4}
            disabled={disabled || submitting}
            inputProps={{ maxLength: 500 }}
          />
          <Button
            type="submit"
            variant="outlined"
            disabled={!message.trim() || disabled || submitting}
          >
            Send
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {turns.length > 0 && <Divider sx={{ mb: 2 }} />}

      <Stack spacing={2}>
        {turns.map((turn) => (
          <Box key={turn.id}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {turn.question}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
              {turn.text}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
