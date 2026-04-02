import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ResultPage from './ResultPage'

const renderWithRoute = (id: string, state?: object) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: `/result/${id}`, state }]}>
      <Routes>
        <Route path="/result/:id" element={<ResultPage />} />
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

  it('shows full scores when totals are provided via state', () => {
    renderWithRoute('wolf', { totals: { wolf: 5, fixer: 2 } })
    expect(screen.getByText(/full scores/i)).toBeInTheDocument()
  })
})
