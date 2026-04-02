import { useState, useCallback } from 'react'
import {
  Button,
  Container,
  LinearProgress,
  Typography,
  Stack,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { questions, personalities } from '../data'
import { tallyScores, rankResults } from '../models/scoring'
import type { Answer } from '../models/types'

export default function SurveyPage() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Answer[]>([])

  const restart = useCallback(() => {
    setCurrentIndex(0)
    setSelectedAnswers([])
  }, [])

  const handleAnswer = useCallback(
    (answer: Answer) => {
      const next = [...selectedAnswers, answer]
      if (currentIndex + 1 >= questions.length) {
        const totals = tallyScores(next)
        const ranked = rankResults(totals, personalities)
        navigate(`/result/${ranked[0].personality.id}`, {
          state: { totals },
        })
      } else {
        setSelectedAnswers(next)
        setCurrentIndex(currentIndex + 1)
      }
    },
    [currentIndex, selectedAnswers, navigate],
  )

  const question = questions[currentIndex]
  const progress = ((currentIndex) / questions.length) * 100

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="caption">
          Question {currentIndex + 1} of {questions.length}
        </Typography>
        <Button size="small" onClick={restart}>
          ↺ Restart
        </Button>
      </Stack>

      <LinearProgress variant="determinate" value={progress} sx={{ mb: 3 }} />

      <Typography variant="h6" sx={{ mb: 3 }}>
        {question.text}
      </Typography>

      <Stack spacing={1.5}>
        {question.answers.map((answer, i) => (
          <Button
            key={i}
            variant="outlined"
            fullWidth
            sx={{ textTransform: 'none', justifyContent: 'flex-start', textAlign: 'left' }}
            onClick={() => handleAnswer(answer)}
          >
            {answer.text}
          </Button>
        ))}
      </Stack>
    </Container>
  )
}
