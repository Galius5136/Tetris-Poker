// Mazzo di carte. La costruzione è pura; lo shuffle è IMPURO (Math.random)
// e tenuto qui isolato.

import { RANKS, SUITS, WILD_CARD, type Card, type Rank } from './cards'

// Il mazzo è la pila di carte ancora da pescare (front = prossima carta).
export type Deck = Card[]

// 52 carte in ordine fisso (4 semi × 13 valori).
export function fullDeck(): Deck {
  const deck: Deck = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank })
    }
  }
  return deck
}

// Fisher-Yates — IMPURO. Ritorna una nuova copia mescolata.
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function shuffledDeck(): Deck {
  return shuffle(fullDeck())
}

// Opzioni di composizione del mazzo (Cat.4 del meta-shop).
export interface DeckOptions {
  removeLow?: boolean // REMOVE_LOW_CARDS: via i 2 e i 3
  doubleFace?: boolean // DOUBLE_FACE_CARDS: figure ×2
  heartFocus?: boolean // SUIT_FOCUS_HEARTS: 25% non-cuori → cuori
  addJokers?: boolean // ADD_JOKER_CARDS: +2 jolly nel mazzo
}

const FACE_RANKS: Rank[] = ['J', 'Q', 'K']

// Costruisce il mazzo-modello del run dalle opzioni. Puro (deterministico).
export function buildDeckTemplate(opts: DeckOptions = {}): Deck {
  let deck = fullDeck()
  if (opts.removeLow) {
    deck = deck.filter((c) => c.rank !== '2' && c.rank !== '3')
  }
  if (opts.doubleFace) {
    deck = [...deck, ...deck.filter((c) => FACE_RANKS.includes(c.rank))]
  }
  if (opts.heartFocus) {
    let seen = 0
    deck = deck.map((c) => {
      if (c.suit === '♥') return c
      seen += 1
      return seen % 4 === 0 ? { rank: c.rank, suit: '♥' } : c
    })
  }
  if (opts.addJokers) {
    deck = [...deck, { ...WILD_CARD }, { ...WILD_CARD }]
  }
  return deck
}
