import { useCallback, useMemo, useState } from 'react'
import {
  Button,
  Container,
  LinearProgress,
  Typography,
  Stack,
} from '@mui/material'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { questions, personalities } from '../data'
import { rankResults, tallyScores } from '../models/scoring'
import type { AppContext } from '../App'
import {
  answerCurrentQuestion,
  createQuizState,
  getCurrentQuestion,
  isQuizComplete,
  quizProgress,
  type QuizState,
} from '../models/quiz'

export default function SurveyPage() {
  const navigate = useNavigate()
  const { app } = useOutletContext<AppContext>()

  const initialState = useMemo(() => createQuizState(), [])
  const [quizState, setQuizState] = useState<QuizState>(initialState)

  const restart = useCallback(() => {
    setQuizState(initialState)
  }, [initialState])

  const currentQuestion = useMemo(
    () => getCurrentQuestion(questions, quizState),
    [quizState],
  )

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (!currentQuestion) return
      const answer = currentQuestion.answers[answerIndex]
      const nextState = answerCurrentQuestion(quizState, answer)

      if (isQuizComplete(questions, nextState)) {
        const totals = tallyScores(nextState.selectedAnswers)
        const ranked = rankResults(totals, personalities)
        navigate(`/${app}/result/${ranked[0].personality.id}`, {
          state: { totals },
        })
      } else {
        setQuizState(nextState)
      }
    },
    [currentQuestion, quizState, navigate, app],
  )

  const progress = quizProgress(questions, quizState)

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="caption">
          Question {Math.min(quizState.currentQuestionIndex + 1, questions.length)} of {questions.length}
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
