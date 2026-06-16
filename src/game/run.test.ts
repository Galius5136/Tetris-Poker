import { describe, it, expect } from 'vitest'
import { tableTarget, FIRST_TARGET } from './run'

describe('tableTarget', () => {
  it('parte dal target iniziale', () => {
    expect(tableTarget(1)).toBe(FIRST_TARGET)
  })
  it('cresce ad ogni tavolo', () => {
    expect(tableTarget(2)).toBeGreaterThan(tableTarget(1))
    expect(tableTarget(5)).toBeGreaterThan(tableTarget(4))
  })
  it('è arrotondato alla decina', () => {
    for (let t = 1; t <= 8; t++) expect(tableTarget(t) % 10).toBe(0)
  })
})
