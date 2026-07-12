import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_NODE_ENV = process.env.NODE_ENV

describe('ENVS', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV
  })

  it('defaults to production when NODE_ENV is unset', async () => {
    delete process.env.NODE_ENV
    const { ENVS } = await import('@shared/envs')
    expect(ENVS.NODE_ENV).toBe('production')
  })

  it('accepts development as a valid NODE_ENV', async () => {
    process.env.NODE_ENV = 'development'
    const { ENVS } = await import('@shared/envs')
    expect(ENVS.NODE_ENV).toBe('development')
  })

  it('throws on an invalid NODE_ENV value', async () => {
    process.env.NODE_ENV = 'staging'
    await expect(import('@shared/envs')).rejects.toThrow()
  })
})
