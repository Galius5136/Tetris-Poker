import { describe, it, expect } from 'vitest'
import { evalRow, HAND_POINTS } from './poker'
import type { Card, Rank, Suit } from './cards'

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit })

describe('evalRow su 5 carte (categoria + nome)', () => {
  const cases: Array<[string, Card[], number, string]> = [
    ['carta alta', [c('A', '♠'), c('K', '♦'), c('9', '♣'), c('7', '♥'), c('2', '♠')], 1, 'Carta Alta'],
    ['coppia', [c('A', '♠'), c('A', '♦'), c('K', '♣'), c('7', '♥'), c('2', '♠')], 2, 'Coppia'],
    ['doppia coppia', [c('A', '♠'), c('A', '♦'), c('K', '♣'), c('K', '♥'), c('2', '♠')], 3, 'Doppia Coppia'],
    ['tris', [c('A', '♠'), c('A', '♦'), c('A', '♣'), c('K', '♥'), c('2', '♠')], 4, 'Tris'],
    ['scala', [c('5', '♠'), c('6', '♦'), c('7', '♣'), c('8', '♥'), c('9', '♠')], 5, 'Scala'],
    ['scala (ruota A-2-3-4-5)', [c('A', '♠'), c('2', '♦'), c('3', '♣'), c('4', '♥'), c('5', '♠')], 5, 'Scala'],
    ['colore', [c('A', '♠'), c('J', '♠'), c('9', '♠'), c('7', '♠'), c('3', '♠')], 6, 'Colore'],
    ['full', [c('A', '♠'), c('A', '♦'), c('A', '♣'), c('K', '♥'), c('K', '♠')], 7, 'Full'],
    ['poker', [c('A', '♠'), c('A', '♦'), c('A', '♣'), c('A', '♥'), c('K', '♠')], 8, 'Poker'],
    ['scala colore', [c('5', '♠'), c('6', '♠'), c('7', '♠'), c('8', '♠'), c('9', '♠')], 9, 'Scala Colore'],
    ['scala reale', [c('10', '♠'), c('J', '♠'), c('Q', '♠'), c('K', '♠'), c('A', '♠')], 9, 'Scala Reale'],
    ['scala colore ruota', [c('A', '♠'), c('2', '♠'), c('3', '♠'), c('4', '♠'), c('5', '♠')], 9, 'Scala Colore'],
  ]

  for (const [label, cards, category, name] of cases) {
    it(label, () => {
      const r = evalRow(cards)
      expect(r.category).toBe(category)
      expect(r.name).toBe(name)
    })
  }
})

describe('tie-break', () => {
  it('coppia con kicker più alto è migliore', () => {
    const high = evalRow([c('A', '♠'), c('A', '♦'), c('K', '♣'), c('5', '♥'), c('2', '♠')])
    const low = evalRow([c('A', '♣'), c('A', '♥'), c('Q', '♣'), c('5', '♦'), c('2', '♦')])
    expect(high.tie).toBeGreaterThan(low.tie)
  })
})

describe('evalRow sceglie la miglior mano da 10 carte', () => {
  it('trova il colore tra 10 carte', () => {
    const row: Card[] = [
      c('5', '♠'), c('7', '♠'), c('9', '♠'), c('J', '♠'), c('K', '♠'),
      c('2', '♦'), c('3', '♥'), c('4', '♣'), c('6', '♦'), c('8', '♥'),
    ]
    expect(evalRow(row).category).toBe(6)
  })
})

it('HAND_POINTS premia le categorie più alte', () => {
  expect(HAND_POINTS[9]).toBeGreaterThan(HAND_POINTS[1])
  expect(HAND_POINTS[8]).toBeGreaterThan(HAND_POINTS[7])
})
