// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, Outlet } from 'react-router-dom'
import ResultPage from './ResultPage'
import type { AppContext } from '../App'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function TestLayout() {
  return <Outlet context={{ app: 'test' } satisfies AppContext} />
}

const renderWithRoute = (id: string, state?: object) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: `/test/result/${id}`, state }]}>
      <Routes>
        <Route path="/:app" element={<TestLayout />}>
          <Route path="result/:id" element={<ResultPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('ResultPage', () => {
  it('displays the personality name and description', () => {
    renderWithRoute('wolf')
    expect(screen.getByText(/you are: the wolf/i)).toBeInTheDocument()
    expect(screen.getByText(/everything is on fire/i)).toBeInTheDocument()
  })

  it('shows not-found for an invalid id', () => {
    renderWithRoute('nonexistent')
    expect(screen.getByText(/personality not found/i)).toBeInTheDocument()
  })

  it('shows source articles in an expandable section', () => {
    renderWithRoute('wolf')
    expect(screen.getByText(/source articles/i)).toBeInTheDocument()
  })

  it('expands source articles by default but keeps full scores collapsed', () => {
    renderWithRoute('wolf', { totals: { wolf: 5, fixer: 2 } })

    const sourcesButton = screen.getByRole('button', { name: /source articles/i })
    expect(sourcesButton).toHaveAttribute('aria-expanded', 'true')

    const scoresButton = screen.getByRole('button', { name: /full scores/i })
    expect(scoresButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows full scores when totals are provided via state', () => {
    renderWithRoute('wolf', { totals: { wolf: 5, fixer: 2 } })
    expect(screen.getByText(/full scores/i)).toBeInTheDocument()
  })

  it('shows chat section when quiz scores are available', () => {
    renderWithRoute('wolf', { totals: { wolf: 5, fixer: 2 } })
    expect(screen.getByText(/ask about your result/i)).toBeInTheDocument()
    expect(screen.getByText(/queries used: 0 \/ 3/i)).toBeInTheDocument()
  })

  it('shows persisted chat turns from result state', () => {
    renderWithRoute('wolf', {
      totals: { wolf: 5, fixer: 2 },
      chatTurns: [
        {
          id: 'turn-1',
          question: 'How does this help planning?',
          text: 'Use the result as a planning lens.',
        },
      ],
    })

    expect(screen.getByText(/queries used: 1 \/ 3/i)).toBeInTheDocument()
    expect(screen.getByText('How does this help planning?')).toBeInTheDocument()
    expect(screen.getByText('Use the result as a planning lens.')).toBeInTheDocument()
  })

  it('passes quiz answers from result state into the chat prompt', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        message: JSON.stringify({
          text: 'Use that answer to shape the roadmap.',
          personalityIds: ['wolf'],
          sourceSlugs: ['the-wolf'],
        }),
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute('wolf', {
      totals: { wolf: 5, fixer: 2 },
      quizResponses: [
        {
          questionId: 'q1-v1',
          questionText: 'How do you choose roadmap work?',
          answerText: 'I pick the hard autonomous problem.',
        },
      ],
    })

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'How does that help planning?' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    const [, requestInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ]
    const body = JSON.parse(String(requestInit.body)) as {
      message: string
    }
    expect(body.message).toContain('How do you choose roadmap work?')
    expect(body.message).toContain('I pick the hard autonomous problem.')
  })

  it('shows chat warning when no quiz scores are present', () => {
    renderWithRoute('wolf')
    expect(
      screen.getByText(/chat is only available for those completing the full quiz/i),
    ).toBeInTheDocument()
  })

  it('renders the built-by footer with the source link to this repo', () => {
    renderWithRoute('wolf')
    expect(screen.getByText(/Built by John Pfeiffer/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Source code on GitHub')).toHaveAttribute(
      'href',
      'https://github.com/johnpfeiffer/rands-personality-game',
    )
  })
})
