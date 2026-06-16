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

// Ruota il pezzo di 90° orari. Prova qualche spostamento orizzontale
// ("wall kick") così la rotazione vicino ai bordi non fallisce.
export function tryRotate(board: Board, piece: Piece): Piece | null {
  const rotated: Piece = { ...piece, rotation: piece.rotation + 1 }
  for (const kick of [0, -1, 1, -2, 2]) {
    const candidate: Piece = { ...rotated, x: rotated.x + kick }
    if (!collides(board, candidate)) return candidate
  }
  return null
}

// Specchia orizzontalmente il pezzo (MIRROR_PIECE), una sola volta.
export function tryMirror(board: Board, piece: Piece): Piece | null {
  if (piece.mirrored) return null
  const mirrored: Piece = { ...piece, mirrored: true }
  return collides(board, mirrored) ? null : mirrored
}

// Posizione del pezzo dopo una caduta fino in fondo (per la ghost piece).
export function dropPosition(board: Board, piece: Piece): Piece {
  let p = piece
  for (;;) {
    const next = tryMove(board, p, 0, 1)
    if (!next) break
    p = next
  }
  return p
}
