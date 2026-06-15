// Regole di movimento/collisione — logica pura, nessun React.

import type { Board } from './board'
import { pieceCells, type Piece } from './tetromino'

// true se il pezzo esce dai bordi (sx/dx/basso) o si sovrappone
// a una cella già piena. Sopra il bordo alto (y < 0) è consentito.
export function collides(board: Board, piece: Piece): boolean {
  const height = board.length
  const width = board[0].length
  return pieceCells(piece).some(({ x, y }) => {
    if (x < 0 || x >= width || y >= height) return true
    if (y < 0) return false
    return board[y][x] !== null
  })
}

// Ritorna il pezzo spostato di (dx, dy) se non collide, altrimenti null.
export function tryMove(
  board: Board,
  piece: Piece,
  dx: number,
  dy: number,
): Piece | null {
  const moved: Piece = { ...piece, x: piece.x + dx, y: piece.y + dy }
  return collides(board, moved) ? null : moved
}
