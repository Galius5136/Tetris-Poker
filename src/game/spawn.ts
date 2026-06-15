// Generazione di un pezzo nuovo — IMPURO (tipo casuale), isolato dai moduli
// puri. Le carte ora sono pescate da un mazzo vero (no ripetizioni).

import { SHAPES, type Piece, type TetrominoType } from './tetromino'
import type { Card } from './cards'
import { shuffledDeck, type Deck } from './deck'

const TYPES = Object.keys(SHAPES) as TetrominoType[]
const CELLS_PER_PIECE = 4

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Garantisce almeno n carte nel mazzo, rabboccando con un mazzo nuovo mescolato.
function ensure(deck: Deck, n: number): Deck {
  let d = deck
  while (d.length < n) d = [...d, ...shuffledDeck()]
  return d
}

// Nuovo pezzo in cima: tipo casuale, 4 carte pescate dal mazzo.
// Ritorna anche il mazzo aggiornato (carte rimaste).
export function spawnPiece(
  deck: Deck,
  boardWidth: number,
): { piece: Piece; deck: Deck } {
  const d = ensure(deck, CELLS_PER_PIECE)
  const cards = d.slice(0, CELLS_PER_PIECE) as [Card, Card, Card, Card]
  return {
    piece: {
      type: pick(TYPES),
      x: Math.floor(boardWidth / 2) - 1,
      y: 0,
      rotation: 0,
      cards,
    },
    deck: d.slice(CELLS_PER_PIECE),
  }
}
