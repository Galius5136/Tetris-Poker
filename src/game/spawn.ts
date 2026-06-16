// Generazione dei pezzi — la randomizzazione (7-bag + pesca carte) è IMPURA
// (Math.random via shuffle) e tenuta isolata qui.

import { SHAPES, type Piece, type TetrominoType } from './tetromino'
import type { Card } from './cards'
import { shuffle, fullDeck, type Deck } from './deck'

const ALL_TYPES = Object.keys(SHAPES) as TetrominoType[]
const CELLS_PER_PIECE = 4

// "Spec" di un pezzo prima di entrare in gioco: forma + 4 carte.
export interface PieceSpec {
  type: TetrominoType
  cards: [Card, Card, Card, Card]
}

// 7-bag: estrae un tipo dal sacchetto; se vuoto, lo riempie mescolando i 7.
export function drawType(bag: TetrominoType[]): {
  type: TetrominoType
  bag: TetrominoType[]
} {
  const b = bag.length > 0 ? bag : shuffle(ALL_TYPES)
  return { type: b[0], bag: b.slice(1) }
}

// Garantisce almeno n carte, rabboccando con il mazzo-modello del run mescolato.
function ensure(deck: Deck, n: number, template: Deck): Deck {
  let d = deck
  while (d.length < n) d = [...d, ...shuffle(template)]
  return d
}

export function drawCards(
  deck: Deck,
  template: Deck = fullDeck(),
): { cards: [Card, Card, Card, Card]; deck: Deck } {
  const d = ensure(deck, CELLS_PER_PIECE, template)
  return {
    cards: d.slice(0, CELLS_PER_PIECE) as [Card, Card, Card, Card],
    deck: d.slice(CELLS_PER_PIECE),
  }
}

// Pesca una spec completa (tipo dal bag, carte dal mazzo-modello del run).
export function drawSpec(
  bag: TetrominoType[],
  deck: Deck,
  template: Deck = fullDeck(),
): { spec: PieceSpec; bag: TetrominoType[]; deck: Deck } {
  const t = drawType(bag)
  const c = drawCards(deck, template)
  return { spec: { type: t.type, cards: c.cards }, bag: t.bag, deck: c.deck }
}

// Crea il pezzo giocabile da una spec, centrato in cima.
export function makePiece(spec: PieceSpec, boardWidth: number): Piece {
  return {
    type: spec.type,
    x: Math.floor(boardWidth / 2) - 1,
    y: 0,
    rotation: 0,
    cards: spec.cards,
  }
}
