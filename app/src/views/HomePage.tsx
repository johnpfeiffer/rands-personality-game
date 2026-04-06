import { Button, Container, Typography } from '@mui/material'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { questions } from '../data'
import type { AppContext } from '../App'

export default function HomePage() {
  const navigate = useNavigate()
  const context = useOutletContext<AppContext | null>()
  const app = context?.app ?? ''

  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Which Rands Personality Are You?
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Answer {questions.length} questions to discover your management archetype, inspired by
        Rands in Repose.
      </Typography>
      <Button
        variant="outlined"
        size="large"
        onClick={() => navigate(`/${app}/survey`)}
      >
        Start the Quiz →
      </Button>
    </Container>
  )
}
