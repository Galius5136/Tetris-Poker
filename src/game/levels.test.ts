import { describe, it, expect } from 'vitest'
import { levelFromLines, tickMs } from './levels'

describe('levelFromLines', () => {
  it('sale di 1 ogni 10 righe', () => {
    expect(levelFromLines(0)).toBe(1)
    expect(levelFromLines(9)).toBe(1)
    expect(levelFromLines(10)).toBe(2)
    expect(levelFromLines(25)).toBe(3)
  })
})

describe('tickMs', () => {
  it('accelera al salire del livello', () => {
    expect(tickMs(1)).toBe(780)
    expect(tickMs(2)).toBeLessThan(tickMs(1))
  })
  it('non scende sotto un minimo', () => {
    expect(tickMs(100)).toBe(110)
  })
})
