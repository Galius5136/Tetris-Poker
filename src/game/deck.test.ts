import { describe, it, expect } from 'vitest'
import { fullDeck, buildDeckTemplate } from './deck'

describe('buildDeckTemplate', () => {
  it('senza opzioni è il mazzo standard da 52', () => {
    expect(buildDeckTemplate()).toHaveLength(52)
  })

  it('REMOVE_LOW_CARDS toglie tutti i 2 e i 3', () => {
    const d = buildDeckTemplate({ removeLow: true })
    expect(d).toHaveLength(52 - 8) // 4 due + 4 tre
    expect(d.some((c) => c.rank === '2' || c.rank === '3')).toBe(false)
  })

  it('DOUBLE_FACE_CARDS aggiunge una copia di J/Q/K (12 figure)', () => {
    const d = buildDeckTemplate({ doubleFace: true })
    expect(d).toHaveLength(52 + 12)
  })

  it('SUIT_FOCUS_HEARTS aumenta i cuori', () => {
    const base = fullDeck().filter((c) => c.suit === '♥').length
    const d = buildDeckTemplate({ heartFocus: true })
    const hearts = d.filter((c) => c.suit === '♥').length
    expect(hearts).toBeGreaterThan(base)
    expect(d).toHaveLength(52) // sostituzione, non aggiunta
  })
})
