// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, it, expect } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, Outlet } from 'react-router-dom'
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

describe('SurveyPage', () => {
  it('shows the first question with answer buttons', () => {
    renderPage()
    expect(screen.getByText(`Question 1 of ${questions.length}`)).toBeInTheDocument()
    expect(screen.getByText(questions[0].text)).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(4)
  })

  it('advances to the next question when an answer is clicked', async () => {
    renderPage()
    const answers = screen.getAllByRole('button').filter(
      (b) => b.textContent !== '↺ Restart',
    )
    await userEvent.click(answers[0])
    expect(screen.getByText(`Question 2 of ${questions.length}`)).toBeInTheDocument()
    expect(screen.getByText(questions[1].text)).toBeInTheDocument()
  })

  it('restart resets to question 1', async () => {
    renderPage()
    const answers = screen.getAllByRole('button').filter(
      (b) => b.textContent !== '↺ Restart',
    )
    await userEvent.click(answers[0])
    expect(screen.getByText(`Question 2 of ${questions.length}`)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /restart/i }))
    expect(screen.getByText(`Question 1 of ${questions.length}`)).toBeInTheDocument()
    expect(screen.getByText(questions[0].text)).toBeInTheDocument()
  })
})
