import { Button, Container, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()
  const { app = 'rands-game' } = useParams()

  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Which Rands Personality Are You?
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Answer 10 questions to discover your management archetype, inspired by
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
