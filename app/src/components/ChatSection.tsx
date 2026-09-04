import { useState } from 'react'
import type { FormEvent, SyntheticEvent } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { personalities as allPersonalitiesData } from '../data'
import {
  CHAT_API_PATH,
  MAX_CHAT_ANSWERS,
  buildChatPrompt,
  chatIsDisabled,
  parseChatResponse,
  topNearbyPersonalities,
} from '../models/chat'
import type { ChatQuizResponse, ChatTurn } from '../models/chat'
import type { Personality, ScoredResult } from '../models/types'

interface ChatSectionProps {
  resultPersonality: Personality
  ranked: ScoredResult[]
  hasScores: boolean
  quizResponses?: ChatQuizResponse[]
  initialTurns?: ChatTurn[]
  onTurnsChange?: (turns: ChatTurn[]) => void
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
  quizResponses = [],
  initialTurns = [],
  onTurnsChange,
}: ChatSectionProps) {
  const [message, setMessage] = useState('')
  const [turns, setTurns] = useState<ChatTurn[]>(initialTurns)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [interactionId, setInteractionId] = useState<string | undefined>()
  const [expandedId, setExpandedId] = useState<string | false>(
    () => (initialTurns.length > 0 ? initialTurns[initialTurns.length - 1].id : false),
  )

  const answerCount = turns.length
  const disabled = chatIsDisabled(answerCount)
  const remaining = Math.max(MAX_CHAT_ANSWERS - answerCount, 0)

  const handleAccordionChange =
    (turnId: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpandedId(isExpanded ? turnId : false)
    }

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
        quizResponses,
      })

      const response = await fetch(CHAT_API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          previousInteractionId: interactionId,
        }),
      })
      const body = (await readResponseJson(response)) as {
        message?: string
        error?: string
        interactionId?: string
      }

      if (!response.ok) {
        throw new Error(body?.error || 'Chat request failed')
      }

      const parsed = parseChatResponse(body?.message ?? '', allPersonalitiesData)
      if (!parsed) {
        throw new Error('No grounded response was returned.')
      }

      setInteractionId(body.interactionId)
      const newTurn: ChatTurn = {
        id: `${Date.now()}-${turns.length}`,
        question: trimmed,
        text: parsed.text,
      }
      const nextTurns = [...turns, newTurn]
      setTurns(nextTurns)
      setExpandedId(newTurn.id)
      onTurnsChange?.(nextTurns)
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
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
          <Button
            type="submit"
            variant="outlined"
            disabled={!message.trim() || disabled || submitting}
            startIcon={
              submitting ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {submitting ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Box>

      {submitting && (
        <Stack
          direction="row"
          spacing={1}
          role="status"
          aria-live="polite"
          sx={{ alignItems: 'center', mb: 2 }}
        >
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Thinking...
          </Typography>
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {turns.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {[...turns].reverse().map((turn) => (
            <Accordion
              key={turn.id}
              expanded={expandedId === turn.id}
              onChange={handleAccordionChange(turn.id)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {turn.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {turn.text}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  )
}
