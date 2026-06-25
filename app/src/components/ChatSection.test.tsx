// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatSection from './ChatSection'
import type { Personality, ScoredResult } from '../models/types'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const resultPersonality: Personality = {
  id: 'wolf',
  name: 'The Wolf',
  description: 'You thrive in chaos.',
  source_slugs: ['the-wolf'],
}

const ranked: ScoredResult[] = [
  { personality: resultPersonality, score: 10 },
  {
    personality: { id: 'fixer', name: 'The Fixer', description: 'You dive in.', source_slugs: ['a-deep-breath'] },
    score: 7,
  },
  {
    personality: { id: 'coach', name: 'The Coach', description: 'You guide others.', source_slugs: ['the-coach-and-the-fixer'] },
    score: 4,
  },
]

function mockFetchOK(message: string) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({ message }),
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('ChatSection', () => {
  it('shows a warning when no quiz scores are available', () => {
    render(
      <ChatSection
        resultPersonality={resultPersonality}
        ranked={[]}
        hasScores={false}
      />,
    )
    expect(
      screen.getByText(/chat is only available for those completing the full quiz/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('renders the input and query count when scores are available', () => {
    render(
      <ChatSection
        resultPersonality={resultPersonality}
        ranked={ranked}
        hasScores={true}
      />,
    )
    expect(screen.getByText(/queries used: 0 \/ 3/i)).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('posts to the chat endpoint and renders the parsed response', async () => {
    const fetchMock = mockFetchOK(
      JSON.stringify({
        text: 'The Wolf thrives in chaos and cuts through politics.',
        personalityIds: ['wolf'],
        sourceSlugs: ['the-wolf'],
      }),
    )

    render(
      <ChatSection
        resultPersonality={resultPersonality}
        ranked={ranked}
        hasScores={true}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Tell me about the wolf' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/the wolf thrives in chaos/i),
      ).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/rands/chat',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(screen.getByText(/queries used: 1 \/ 3/i)).toBeInTheDocument()
  })

  it('shows an error when the response is not grounded', async () => {
    mockFetchOK(
      JSON.stringify({
        text: 'Some text.',
        personalityIds: ['invented-type'],
        sourceSlugs: [],
      }),
    )

    render(
      <ChatSection
        resultPersonality={resultPersonality}
        ranked={ranked}
        hasScores={true}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'test question' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/no grounded response/i)
    })
  })

  it('disables submissions after 3 answers', async () => {
    mockFetchOK(
      JSON.stringify({
        text: 'Answer.',
        personalityIds: ['wolf'],
        sourceSlugs: [],
      }),
    )

    render(
      <ChatSection
        resultPersonality={resultPersonality}
        ranked={ranked}
        hasScores={true}
      />,
    )

    const input = screen.getByRole('textbox')
    const button = screen.getByRole('button', { name: /send/i })

    for (let i = 0; i < 3; i++) {
      fireEvent.change(input, { target: { value: `question ${i + 1}` } })
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByText(`question ${i + 1}`)).toBeInTheDocument()
      })
    }

    expect(screen.getByText(/queries used: 3 \/ 3/i)).toBeInTheDocument()
    expect(button).toBeDisabled()
    expect(input).toBeDisabled()
  })
})
