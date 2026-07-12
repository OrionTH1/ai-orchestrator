import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '@renderer/App'

describe('App', () => {
  it('renders the hello world heading', () => {
    render(<App />)
    expect(screen.getByText('Hello, AI Orchestrator')).toBeInTheDocument()
  })
})
