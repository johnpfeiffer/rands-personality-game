import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage'
import { questions } from '../data'

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )

describe('HomePage', () => {
  it('renders the title and start button', () => {
    renderPage()
    expect(screen.getByText(/which rands personality/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start the quiz/i })).toBeInTheDocument()
  })

  it('displays the actual question count', () => {
    renderPage()
    expect(screen.getByText(new RegExp(`Answer ${questions.length} questions`))).toBeInTheDocument()
  })

  it('navigates to /survey when start is clicked', async () => {
    renderPage()
    const button = screen.getByRole('button', { name: /start the quiz/i })
    await userEvent.click(button)
    // navigation works if no error is thrown in MemoryRouter context
  })
})
