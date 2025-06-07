import { describe, it, expect } from 'vitest'

describe('Simple Test', () => {
  it('should verify vitest is working', () => {
    expect(1 + 1).toBe(2)
  })

  it('should verify basic functionality', () => {
    const data = { test: 'value' }
    expect(data.test).toBe('value')
  })
}) 