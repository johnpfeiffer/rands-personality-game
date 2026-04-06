import { useState, useCallback, useMemo } from 'react'
import {
  Button,
  Container,
  LinearProgress,
  Typography,
  Stack,
} from '@mui/material'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { questions, personalities } from '../data'
import { rankResults } from '../models/scoring'
import type { AppContext } from '../App'
import {
  precomputeQuestionMeta,
  createEngineState,
  updateState,
  shouldStopEarly,
  pickNextQuestion,
  type EngineState,
} from '../models/question-engine'

export default function SurveyPage() {
  const navigate = useNavigate()
  const { app } = useOutletContext<AppContext>()

  const meta = useMemo(() => precomputeQuestionMeta(questions, personalities), [])
  const initialState = useMemo(() => createEngineState(personalities, meta), [meta])

  const [engineState, setEngineState] = useState<EngineState>(initialState)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)

  const restart = useCallback(() => {
    setEngineState(initialState)
    setQuestionsAnswered(0)
  }, [initialState])

  const currentQuestion = useMemo(
    () => pickNextQuestion(engineState, questions, meta),
    [engineState, meta],
  )

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (!currentQuestion) return
      const answer = currentQuestion.answers[answerIndex]
      const qIdx = questions.findIndex((q) => q.id === currentQuestion.id)
      const nextState = updateState(engineState, currentQuestion, answer, meta[qIdx])
      const nextCount = questionsAnswered + 1

      if (shouldStopEarly(nextState) || pickNextQuestion(nextState, questions, meta) === null) {
        const ranked = rankResults(nextState.totals, personalities)
        navigate(`/${app}/result/${ranked[0].personality.id}`, {
          state: { totals: nextState.totals },
        })
      } else {
        setEngineState(nextState)
        setQuestionsAnswered(nextCount)
      }
    },
    [currentQuestion, engineState, questionsAnswered, meta, navigate, app],
  )

  const remaining = questions.length - engineState.asked.size
  const progress = (questionsAnswered / (questionsAnswered + remaining)) * 100

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="caption">
          Question {questionsAnswered + 1}
        </Typography>
        <Button size="small" onClick={restart}>
          ↺ Restart
        </Button>
      </Stack>

      <LinearProgress variant="determinate" value={progress} sx={{ mb: 3 }} />

      {currentQuestion && (
        <>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {currentQuestion.text}
          </Typography>

          <Stack spacing={1.5}>
            {currentQuestion.answers.map((answer, i) => (
              <Button
                key={i}
                variant="outlined"
                fullWidth
                sx={{ textTransform: 'none', justifyContent: 'flex-start', textAlign: 'left' }}
                onClick={() => handleAnswer(i)}
              >
                {answer.text}
              </Button>
            ))}
          </Stack>
        </>
      )}
    </Container>
  )
}
