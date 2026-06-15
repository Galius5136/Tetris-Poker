// Tetromini — dati e geometria puri, nessun React.

import { type Board, placeCard } from './board'
import type { Card } from './cards'

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

// Coordinate relative [x, y] delle 4 celle di ogni forma,
// riferite a un'origine in alto a sinistra. y cresce verso il basso.
export const SHAPES: Record<
  TetrominoType,
  ReadonlyArray<readonly [number, number]>
> = {
  I: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
}

// Un pezzo in gioco: forma, posizione dell'origine sulla board,
// e le 4 carte (una per cella, stesso ordine delle coordinate in SHAPES).
export interface Piece {
  type: TetrominoType
  x: number
  y: number
  cards: [Card, Card, Card, Card]
}

// Celle assolute del pezzo sulla board, ognuna con la sua carta.
export function pieceCells(
  piece: Piece,
): Array<{ x: number; y: number; card: Card }> {
  return SHAPES[piece.type].map(([dx, dy], i) => ({
    x: piece.x + dx,
    y: piece.y + dy,
    card: piece.cards[i],
  }))
}

// Ritorna una NUOVA board con il pezzo "appoggiato" sopra. Immutabile.
export function mergePiece(board: Board, piece: Piece): Board {
  return pieceCells(piece).reduce(
    (b, { x, y, card }) => placeCard(b, x, y, card),
    board,
  )
}
