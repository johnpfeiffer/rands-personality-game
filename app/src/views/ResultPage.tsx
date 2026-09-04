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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HomeIcon from '@mui/icons-material/Home'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { useParams, useNavigate, useLocation, useOutletContext } from 'react-router-dom'
import { getPersonalityById, personalities } from '../data'
import { rankResults } from '../models/scoring'
import ChatSection from '../components/ChatSection'
import Footer from '../components/Footer'
import type { ChatQuizResponse, ChatTurn } from '../models/chat'
import type { AppContext } from '../App'

const RANDS_BASE = 'https://randsinrepose.com/archives/'

interface ResultRouteState {
  totals?: Record<string, number>
  quizResponses?: ChatQuizResponse[]
  chatTurns?: ChatTurn[]
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>()
  const { app } = useOutletContext<AppContext>()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = (location.state as ResultRouteState | null) ?? {}
  const totals = routeState.totals
  const quizResponses = routeState.quizResponses ?? []
  const chatTurns = routeState.chatTurns ?? []

  const personality = getPersonalityById(id ?? '')

  function persistChatTurns(nextTurns: ChatTurn[]) {
    navigate(location.pathname, {
      replace: true,
      state: { ...routeState, chatTurns: nextTurns },
    })
  }

  if (!personality) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5">Personality not found.</Typography>
        <Button
          startIcon={<HomeIcon />}
          onClick={() => navigate(`/${app}`)}
          sx={{ mt: 2 }}
        >
          Home
        </Button>
      </Container>
    )
  }

  const ranked = totals ? rankResults(totals, personalities) : null

  return (
    <>
      <Container maxWidth={false} sx={{ mt: 4, pb: 6 }}>
        <Typography variant="h4" gutterBottom>
          You are: {personality.name}
        </Typography>

        <Typography variant="body1" sx={{ mb: 3 }}>
          {personality.description}
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
          startIcon={<RestartAltIcon />}
          onClick={() => {
            navigate(`/${app}/survey`)
          }}
          sx={{ mt: 3 }}
        >
          Take the quiz again
        </Button>

        <ChatSection
          resultPersonality={personality}
          ranked={ranked ?? []}
          hasScores={!!totals}
          quizResponses={quizResponses}
          initialTurns={chatTurns}
          onTurnsChange={persistChatTurns}
        />
      </Container>
      <Footer />
    </>
  )
}
