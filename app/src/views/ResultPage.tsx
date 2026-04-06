import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Container,
  Link,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { useParams, useNavigate, useLocation, useOutletContext } from 'react-router-dom'
import { getPersonalityById, personalities } from '../data'
import { rankResults } from '../models/scoring'
import type { AppContext } from '../App'

const RANDS_BASE = 'https://randsinrepose.com/archives/'

export default function ResultPage() {
  const { id } = useParams<{ id: string }>()
  const { app } = useOutletContext<AppContext>()
  const navigate = useNavigate()
  const location = useLocation()
  const totals = (location.state as { totals?: Record<string, number> } | null)?.totals

  const personality = getPersonalityById(id ?? '')

  if (!personality) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5">Personality not found.</Typography>
        <Button onClick={() => navigate(`/${app}`)} sx={{ mt: 2 }}>
          ← Home
        </Button>
      </Container>
    )
  }

  const ranked = totals ? rankResults(totals, personalities) : null

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        You are: {personality.name}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        {personality.description}
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon="▸">
          <Typography>Source articles</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense disablePadding>
            {personality.source_slugs.map((slug) => (
              <ListItem key={slug} disableGutters>
                <Link
                  href={`${RANDS_BASE}${slug}/`}
                  target="_blank"
                  rel="noopener"
                >
                  {slug}
                </Link>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {ranked && (
        <Accordion>
          <AccordionSummary expandIcon="▸">
            <Typography>Full scores</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {ranked.map((r) => (
                <ListItem key={r.personality.id} disableGutters>
                  <ListItemText
                    primary={`${r.personality.name}: ${r.score}`}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      <Button
        variant="outlined"
        onClick={() => {
          navigate(`/${app}/survey`)
        }}
        sx={{ mt: 3 }}
      >
        ↺ Take the quiz again
      </Button>
    </Container>
  )
}
