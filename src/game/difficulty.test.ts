import { describe, it, expect } from 'vitest'
import {
  speedMultiplier,
  difficultyTick,
  MIN_TICK_MS,
  DEFAULT_DIFFICULTY,
} from './difficulty'

describe('speedMultiplier', () => {
  it('parte da 1 (nessun tavolo superato)', () => {
    expect(speedMultiplier(0)).toBe(1)
  })
  it('cresce a ogni tavolo (×1.2 di default)', () => {
    expect(speedMultiplier(1)).toBeCloseTo(1.2)
    expect(speedMultiplier(2)).toBeCloseTo(1.44)
  })
  it('è limitato dal cap', () => {
    expect(speedMultiplier(100)).toBe(DEFAULT_DIFFICULTY.cap)
  })
  it('factorPerTable 1 = difficoltà costante', () => {
    expect(speedMultiplier(50, { factorPerTable: 1, cap: 8 })).toBe(1)
  })
})

describe('difficultyTick', () => {
  it('accelera il tick superando i tavoli', () => {
    expect(difficultyTick(780, 3)).toBeLessThan(780)
  })
  it('non scende sotto il floor', () => {
    expect(difficultyTick(200, 100)).toBe(MIN_TICK_MS)
  })
})
