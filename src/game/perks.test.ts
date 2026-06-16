import { describe, it, expect } from 'vitest'
import {
  BASE_MODIFIERS,
  applyModifiers,
  evalThreeCardHand,
  ROULETTE_SLOTS,
  rouletteIndexAt,
} from './perks'
import type { Card, Rank, Suit } from './cards'

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit })

describe('applyModifiers', () => {
  it('senza perk lascia invariato', () => {
    expect(applyModifiers(50, BASE_MODIFIERS)).toBe(50)
  })
  it('applica moltiplicatore e bonus per pulizia', () => {
    expect(applyModifiers(50, { mult: 2, bonusPerClear: 10 })).toBe(110)
  })
})

describe('evalThreeCardHand (mano di poker a 3 carte)', () => {
  it('tris → moltiplicatore ×2', () => {
    const o = evalThreeCardHand([c('A', '♠'), c('A', '♥'), c('A', '♦')])
    expect(o.label).toBe('Tris')
    expect(o.apply(BASE_MODIFIERS).mult).toBe(2)
  })
  it('colore (3 stessi semi) → ×1.6', () => {
    const o = evalThreeCardHand([c('A', '♠'), c('10', '♠'), c('6', '♠')])
    expect(o.label).toBe('Colore')
    expect(o.apply(BASE_MODIFIERS).mult).toBe(1.6)
  })
  it('scala (3 consecutive, semi misti) → +25/riga', () => {
    const o = evalThreeCardHand([c('J', '♦'), c('10', '♠'), c('9', '♥')])
    expect(o.label).toBe('Scala')
    expect(o.apply(BASE_MODIFIERS).bonusPerClear).toBe(25)
  })
  it('coppia → ×1.25', () => {
    const o = evalThreeCardHand([c('A', '♠'), c('A', '♥'), c('K', '♣')])
    expect(o.label).toBe('Coppia')
    expect(o.apply(BASE_MODIFIERS).mult).toBe(1.25)
  })
  it('carta alta → consolazione', () => {
    const o = evalThreeCardHand([c('A', '♠'), c('Q', '♥'), c('9', '♣')])
    expect(o.label).toBe('Carta Alta')
    expect(o.apply(BASE_MODIFIERS).bonusPerClear).toBe(8)
  })
})

describe('perk cumulativi che impattano le fiches', () => {
  it('i moltiplicatori si moltiplicano tra loro', () => {
    let m = BASE_MODIFIERS
    m = evalThreeCardHand([c('K', '♠'), c('10', '♠'), c('6', '♠')]).apply(m) // Colore ×1.6
    m = evalThreeCardHand([c('A', '♠'), c('A', '♥'), c('A', '♦')]).apply(m) // Tris ×2
    expect(m.mult).toBe(3.2)
    // 100 fiches grezze → 320 con il moltiplicatore accumulato
    expect(applyModifiers(100, m)).toBe(320)
  })
  it('i bonus per riga si sommano', () => {
    let m = BASE_MODIFIERS
    m = ROULETTE_SLOTS[1].apply(m) // +10/riga
    m = ROULETTE_SLOTS[3].apply(m) // +20/riga
    expect(m.bonusPerClear).toBe(30)
  })
})

describe('roulette', () => {
  it('angolo 0 → primo settore', () => {
    expect(rouletteIndexAt(0)).toBe(0)
  })
  it('indice sempre valido per qualsiasi angolo', () => {
    for (const a of [0, 45, 90, 200, 359, 720, -30]) {
      const i = rouletteIndexAt(a)
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(ROULETTE_SLOTS.length)
    }
  })
})
