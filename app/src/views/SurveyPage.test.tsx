// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, it, expect } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, Outlet, useLocation } from 'react-router-dom'
import SurveyPage from './SurveyPage'
import type { AppContext } from '../App'
import { questions } from '../data'

afterEach(cleanup)

function TestLayout() {
  return <Outlet context={{ app: 'test' } satisfies AppContext} />
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/test/survey']}>
      <Routes>
        <Route path="/:app" element={<TestLayout />}>
          <Route path="survey" element={<SurveyPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

function ResultProbe() {
  const location = useLocation()
  const state = location.state as
    | {
        totals?: Record<string, number>
        quizResponses?: { questionText: string; answerText: string }[]
      }
    | null

  return (
    <>
      <div>result-state-quiz-responses: {state?.quizResponses?.length ?? 0}</div>
      <div>{state?.quizResponses?.[0]?.questionText}</div>
      <div>{state?.quizResponses?.[0]?.answerText}</div>
      <div>result-state-has-totals: {state?.totals ? 'yes' : 'no'}</div>
    </>
  )
}

const renderPageWithResultProbe = () =>
  render(
    <MemoryRouter initialEntries={['/test/survey']}>
      <Routes>
        <Route path="/:app" element={<TestLayout />}>
          <Route path="survey" element={<SurveyPage />} />
          <Route path="result/:id" element={<ResultProbe />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

function answerButtons(): HTMLElement[] {
  const restart = screen.getByRole('button', { name: /restart/i })
  return screen.getAllByRole('button').filter((button) => button !== restart)
}

describe('SurveyPage', () => {
  it('shows the first question with answer buttons', () => {
    renderPage()
    expect(screen.getByText(`Question 1 of ${questions.length}`)).toBeInTheDocument()
    expect(screen.getByText(questions[0].text)).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(4)
  })

  it('advances to the next question when an answer is clicked', async () => {
    renderPage()
    await userEvent.click(answerButtons()[0])
    expect(screen.getByText(`Question 2 of ${questions.length}`)).toBeInTheDocument()
    expect(screen.getByText(questions[1].text)).toBeInTheDocument()
  })

  it('restart resets to question 1', async () => {
    renderPage()
    await userEvent.click(answerButtons()[0])
    expect(screen.getByText(`Question 2 of ${questions.length}`)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /restart/i }))
    expect(screen.getByText(`Question 1 of ${questions.length}`)).toBeInTheDocument()
    expect(screen.getByText(questions[0].text)).toBeInTheDocument()
  })

  it('passes quiz responses and totals to the result route on completion', async () => {
    renderPageWithResultProbe()

    for (let i = 0; i < questions.length; i += 1) {
      await userEvent.click(answerButtons()[0])
    }

    expect(
      await screen.findByText(`result-state-quiz-responses: ${questions.length}`),
    ).toBeInTheDocument()
    expect(screen.getByText(questions[0].text)).toBeInTheDocument()
    expect(screen.getByText(questions[0].answers[0].text)).toBeInTheDocument()
    expect(screen.getByText('result-state-has-totals: yes')).toBeInTheDocument()
  })

  it('does not render the built-by footer', () => {
    renderPage()
    expect(screen.queryByText(/Built by John Pfeiffer/i)).not.toBeInTheDocument()
  })
})
