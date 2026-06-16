import { describe, it, expect } from 'vitest'
import {
  speedMultiplier,
  difficultyTick,
  MIN_TICK_MS,
  DEFAULT_DIFFICULTY,
} from './difficulty'

describe('speedMultiplier', () => {
  it('parte da 1 (nessun pezzo bloccato)', () => {
    expect(speedMultiplier(0)).toBe(1)
  })
  it('cresce con i pezzi (×1.5 a pezzo di default)', () => {
    expect(speedMultiplier(1)).toBeCloseTo(1.5)
    expect(speedMultiplier(2)).toBeCloseTo(2.25)
  })
  it('è limitato dal cap', () => {
    expect(speedMultiplier(100)).toBe(DEFAULT_DIFFICULTY.cap)
  })
  it('factorPerLock 1 = difficoltà costante', () => {
    expect(speedMultiplier(50, { factorPerLock: 1, cap: 8 })).toBe(1)
  })
})

describe('difficultyTick', () => {
  it('accelera il tick all aumentare dei pezzi', () => {
    expect(difficultyTick(780, 2)).toBeLessThan(780)
  })
  it('non scende sotto il floor', () => {
    // base bassa + moltiplicatore al cap → sotto il floor, quindi clampa
    expect(difficultyTick(200, 100)).toBe(MIN_TICK_MS)
  })
})
