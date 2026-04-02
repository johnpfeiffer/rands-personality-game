import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SurveyPage from './SurveyPage'

const renderPage = () =>
  render(
    <MemoryRouter>
      <SurveyPage />
    </MemoryRouter>,
  )

describe('SurveyPage', () => {
  it('shows the first question with answer buttons', () => {
    renderPage()
    expect(screen.getByText(/question 1 of/i)).toBeInTheDocument()
    expect(screen.getByText(/critical bug/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(4)
  })

  it('advances to the next question when an answer is clicked', async () => {
    renderPage()
    const answers = screen.getAllByRole('button').filter(
      (b) => b.textContent !== '↺ Restart',
    )
    await userEvent.click(answers[0])
    expect(screen.getByText(/question 2 of/i)).toBeInTheDocument()
  })

  it('restart resets to question 1', async () => {
    renderPage()
    const answers = screen.getAllByRole('button').filter(
      (b) => b.textContent !== '↺ Restart',
    )
    await userEvent.click(answers[0])
    expect(screen.getByText(/question 2 of/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /restart/i }))
    expect(screen.getByText(/question 1 of/i)).toBeInTheDocument()
  })
})
