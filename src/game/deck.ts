// Mazzo di carte. La costruzione è pura; lo shuffle è IMPURO (Math.random)
// e tenuto qui isolato.

import { RANKS, SUITS, type Card } from './cards'

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
export function shuffle(deck: Deck): Deck {
  const a = [...deck]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function shuffledDeck(): Deck {
  return shuffle(fullDeck())
}
