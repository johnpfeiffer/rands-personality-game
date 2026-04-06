import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, Outlet } from 'react-router-dom'
import SurveyPage from './SurveyPage'
import type { AppContext } from '../App'
import { questions, personalities } from '../data'
import { precomputeQuestionMeta, createEngineState, pickNextQuestion } from '../models/question-engine'

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

describe('SurveyPage', () => {
  it('shows the first question with answer buttons', () => {
    const meta = precomputeQuestionMeta(questions, personalities)
    const state = createEngineState(personalities, meta)
    const firstQ = pickNextQuestion(state, questions, meta)!
    renderPage()
    expect(screen.getByText(/question 1$/i)).toBeInTheDocument()
    expect(screen.getByText(firstQ.text)).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(4)
  })

  it('advances to the next question when an answer is clicked', async () => {
    renderPage()
    const answers = screen.getAllByRole('button').filter(
      (b) => b.textContent !== '↺ Restart',
    )
    await userEvent.click(answers[0])
    expect(screen.getByText(/question 2$/i)).toBeInTheDocument()
  })

  it('restart resets to question 1', async () => {
    renderPage()
    const answers = screen.getAllByRole('button').filter(
      (b) => b.textContent !== '↺ Restart',
    )
    await userEvent.click(answers[0])
    expect(screen.getByText(/question 2$/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /restart/i }))
    expect(screen.getByText(/question 1$/i)).toBeInTheDocument()
  })
})
