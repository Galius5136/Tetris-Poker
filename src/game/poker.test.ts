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

describe('EvalOptions (modificatori dei joker)', () => {
  it('FIVE_OF_A_KIND: 5 uguali → cat 10 (solo se abilitato)', () => {
    const five = [c('A', '♠'), c('A', '♥'), c('A', '♦'), c('A', '♣'), c('A', '♠')]
    expect(evalRow(five).category).not.toBe(10) // senza il perk non esiste
    expect(evalRow(five, { fiveOfAKind: true }).category).toBe(10)
  })
  it('STRAIGHT_GAP: scala con un buco valida solo se abilitato', () => {
    const gap = [c('2', '♠'), c('3', '♥'), c('5', '♦'), c('6', '♣'), c('7', '♠')]
    expect(evalRow(gap).category).toBe(1) // carta alta senza il perk
    expect(evalRow(gap, { straightGap: true }).category).toBe(5) // scala
  })
  it('FLUSH_WILD_SUIT: il seme jolly completa il colore', () => {
    const hand = [c('A', '♠'), c('K', '♠'), c('Q', '♠'), c('9', '♠'), c('4', '♥')]
    expect(evalRow(hand).category).toBe(1) // 4 picche + 1 cuori = carta alta
    expect(evalRow(hand, { wildSuit: '♥' }).category).toBe(6) // cuori jolly → colore
  })
})

describe('carte jolly (wild)', () => {
  const wild: Card = { rank: 'A', suit: '♠', wild: true }
  it('coppia + jolly → tris', () => {
    const hand = [c('A', '♠'), c('A', '♥'), wild, c('K', '♣'), c('2', '♦')]
    expect(evalRow(hand).category).toBe(4) // tris
  })
  it('4 picche + jolly → colore', () => {
    const hand = [c('A', '♠'), c('K', '♠'), c('9', '♠'), c('7', '♠'), wild]
    expect(evalRow(hand).category).toBe(6) // colore
  })
})
