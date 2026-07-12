import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_NODE_ENV = process.env.NODE_ENV

describe('CONSTANTS', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV
  })

  it('IS_DEV is true when NODE_ENV is development', async () => {
    process.env.NODE_ENV = 'development'
    const { CONSTANTS } = await import('@shared/constants')
    expect(CONSTANTS.IS_DEV).toBe(true)
  })

  it('IS_DEV is false when NODE_ENV is production', async () => {
    process.env.NODE_ENV = 'production'
    const { CONSTANTS } = await import('@shared/constants')
    expect(CONSTANTS.IS_DEV).toBe(false)
  })
})

describe('PLATFORM', () => {
  it('flags exactly the current OS as true', async () => {
    const { PLATFORM } = await import('@shared/constants')
    const flags = [PLATFORM.IS_MAC, PLATFORM.IS_WINDOWS, PLATFORM.IS_LINUX]
    expect(flags.filter(Boolean)).toHaveLength(1)
  })
})
