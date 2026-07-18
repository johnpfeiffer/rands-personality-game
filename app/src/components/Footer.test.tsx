// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, it, expect } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import Footer from './Footer'

afterEach(cleanup)

describe('Footer', () => {
  it('renders the built-by line with LinkedIn and GitHub links', () => {
    render(<Footer />)
    expect(screen.getByText(/Built by John Pfeiffer/i)).toBeInTheDocument()

    const linkedin = screen.getByLabelText('John Pfeiffer on LinkedIn')
    expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/foupfeiffer')
    expect(linkedin).toHaveAttribute('target', '_blank')
    expect(linkedin).toHaveAttribute('rel', 'noopener noreferrer')

    const github = screen.getByLabelText('Source code on GitHub')
    expect(github).toHaveAttribute('href', 'https://github.com/johnpfeiffer/rands-personality-game')
    expect(github).toHaveAttribute('target', '_blank')
    expect(github).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
