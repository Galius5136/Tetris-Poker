// Carte da poker — dati puri, nessun React.

export type Suit = '♠' | '♥' | '♦' | '♣'

export type Rank =
  | 'A' | '2' | '3' | '4' | '5' | '6' | '7'
  | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  suit: Suit
  rank: Rank
  wild?: boolean // jolly: vale qualsiasi seme/valore nel poker
}

// Carta jolly (ADD_JOKER_CARDS / WILDCARD_PIECE). Seme/valore sono placeholder.
export const WILD_CARD: Card = { suit: '♠', rank: 'A', wild: true }

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣']

export const RANKS: Rank[] = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',
]

// Cuori e quadri sono rossi; picche e fiori neri.
export function isRedSuit(suit: Suit): boolean {
  return suit === '♥' || suit === '♦'
}
