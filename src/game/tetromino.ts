// Tetromini — dati e geometria puri, nessun React.

import { type Board, placeCard } from './board'
import type { Card } from './cards'

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

type Coord = readonly [number, number]

// Coordinate relative [x, y] delle 4 celle di ogni forma (orientamento base),
// riferite a un'origine in alto a sinistra. y cresce verso il basso.
export const SHAPES: Record<TetrominoType, ReadonlyArray<Coord>> = {
  I: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
}

// Un pezzo in gioco: forma, posizione dell'origine, rotazione (0..3 in senso
// orario) e le 4 carte (una per cella, stesso ordine delle coordinate base).
export interface Piece {
  type: TetrominoType
  x: number
  y: number
  rotation: number
  cards: [Card, Card, Card, Card]
}

// Ruota un set di coordinate di 90° in senso orario, mantenendo l'ordine
// degli elementi (così ogni carta resta legata alla sua cella) e coord >= 0.
function rotateCW(cells: ReadonlyArray<Coord>): ReadonlyArray<Coord> {
  const maxY = Math.max(...cells.map(([, y]) => y))
  return cells.map(([x, y]) => [maxY - y, x] as const)
}

// Coordinate della forma dopo `rotation` quarti di giro.
function shapeCells(
  type: TetrominoType,
  rotation: number,
): ReadonlyArray<Coord> {
  let cells: ReadonlyArray<Coord> = SHAPES[type]
  const turns = ((rotation % 4) + 4) % 4
  for (let i = 0; i < turns; i++) cells = rotateCW(cells)
  return cells
}

// Celle assolute del pezzo sulla board, ognuna con la sua carta.
export function pieceCells(
  piece: Piece,
): Array<{ x: number; y: number; card: Card }> {
  return shapeCells(piece.type, piece.rotation).map(([dx, dy], i) => ({
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
