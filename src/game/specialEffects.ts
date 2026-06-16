// Effetti dei pezzi speciali sulla board — logica pura, testabile in isolamento.
// (App li invoca una volta al lock; qui niente stato/React.)

import { clearRows, clearColumnsFrom, clearArea, type Board } from './board'
import { pieceCells, type Piece } from './tetromino'

// LASER: pulisce le righe occupate dal pezzo.
export function applyLaser(board: Board, piece: Piece): Board {
  const rows = [
    ...new Set(pieceCells(piece).filter((c) => c.y >= 0).map((c) => c.y)),
  ]
  return clearRows(board, rows)
}

// CLEAVER: svuota le colonne del pezzo dal punto di caduta in giù.
export function applyCleaver(board: Board, piece: Piece): Board {
  const cells = pieceCells(piece).filter((c) => c.y >= 0)
  const cols = [...new Set(cells.map((c) => c.x))]
  const fromY = Math.min(...cells.map((c) => c.y))
  return clearColumnsFrom(board, cols, fromY)
}

// BOMB: esplode il bounding box del pezzo allargato di 1 in ogni direzione.
export function applyBomb(board: Board, piece: Piece): Board {
  const cells = pieceCells(piece)
  const xs = cells.map((c) => c.x)
  const ys = cells.map((c) => c.y)
  return clearArea(
    board,
    Math.min(...xs) - 1,
    Math.min(...ys) - 1,
    Math.max(...xs) + 1,
    Math.max(...ys) + 1,
  )
}

// GHOST: attraversa UNA cella occupata. Ritorna la board col blocco più in alto
// rimosso e il pezzo (senza special) sceso di una riga, pronto per il lock
// normale. Se non c'è nulla sotto, board invariata e pezzo "normalizzato".
export function resolveGhost(
  board: Board,
  piece: Piece,
): { board: Board; piece: Piece } {
  const own = new Set(pieceCells(piece).map((c) => `${c.y}-${c.x}`))
  const blockers = pieceCells(piece)
    .map((c) => ({ x: c.x, y: c.y + 1 }))
    .filter(
      (c) =>
        c.y >= 0 &&
        c.y < board.length &&
        !own.has(`${c.y}-${c.x}`) &&
        board[c.y][c.x] !== null,
    )
  const plain: Piece = { ...piece, special: null }
  if (blockers.length === 0) return { board, piece: plain }
  const target = blockers.reduce((a, b) => (a.y < b.y ? a : b))
  const cleared = board.map((row, y) =>
    y === target.y ? row.map((cell, x) => (x === target.x ? null : cell)) : row,
  )
  return { board: cleared, piece: { ...plain, y: plain.y + 1 } }
}

// ANCHOR: marca le celle del pezzo come bloccate fino a `until`.
export function stampAnchor(board: Board, piece: Piece, until: number): Board {
  const own = new Set(
    pieceCells(piece).filter((c) => c.y >= 0).map((c) => `${c.y}-${c.x}`),
  )
  return board.map((row, y) =>
    row.map((cell, x) =>
      cell && own.has(`${y}-${x}`) ? { ...cell, anchorUntil: until } : cell,
    ),
  )
}
