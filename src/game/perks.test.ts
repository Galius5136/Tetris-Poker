import { describe, it, expect } from 'vitest'
import { BASE_MODIFIERS, applyModifiers, evalThreeCardHand } from './perks'
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
