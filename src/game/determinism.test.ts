import { describe, it, expect } from 'vitest'
import { drawSpec } from './spawn'
import { fullDeck } from './deck'

// Riproduce la sequenza di pezzi/carte di un run a partire da un seed (CR-004,
// condizione C1 del Quality Gate): stesso seed → stessa partita.
function sequence(seed: number, n = 24): string[] {
  let bag: ReturnType<typeof drawSpec>['bag'] = []
  let deck = fullDeck()
  let rng = seed >>> 0
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const d = drawSpec(bag, deck, fullDeck(), [], rng)
    out.push(
      d.spec.type +
        '|' +
        d.spec.cards.map((c) => c.rank + c.suit).join(','),
    )
    bag = d.bag
    deck = d.deck
    rng = d.rng
  }
  return out
}

describe('determinismo del run (replay)', () => {
  it('stesso seed → stessa sequenza di pezzi e carte', () => {
    expect(sequence(12345)).toEqual(sequence(12345))
  })
  it('seed diversi → sequenze diverse', () => {
    expect(sequence(1)).not.toEqual(sequence(2))
  })
})
