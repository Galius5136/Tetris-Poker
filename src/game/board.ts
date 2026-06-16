// Modello della board — logica pura, nessun React qui.

import type { Card } from './cards'
import type { TetrominoType } from './tetromino'

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

// Una cella piena porta la carta e il tipo di tetromino (per il colore/glow).
export interface FilledCell {
  card: Card
  type: TetrominoType
}

// Una cella è vuota (`null`) oppure piena.
export type Cell = FilledCell | null

export type Board = Cell[][]

// Crea una board vuota: righe x colonne, tutte celle a null.
export function createEmptyBoard(
  width: number = BOARD_WIDTH,
  height: number = BOARD_HEIGHT,
): Board {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null),
  )
}

// Ritorna una NUOVA board con una cella piena posizionata in (x, y). Immutabile.
export function placeCell(
  board: Board,
  x: number,
  y: number,
  cell: FilledCell,
): Board {
  return board.map((row, ry) =>
    ry === y ? row.map((c, cx) => (cx === x ? cell : c)) : row,
  )
}

// Rimuove le righe piene (nessuna cella null), fa scendere il resto e
// rimette in cima altrettante righe vuote. Altezza invariata. Immutabile.
export function clearFullRows(board: Board): { board: Board; cleared: number } {
  const width = board[0].length
  const kept = board.filter((row) => row.some((cell) => cell === null))
  const cleared = board.length - kept.length
  const emptyRows: Board = Array.from({ length: cleared }, () =>
    Array.from({ length: width }, () => null),
  )
  return { board: [...emptyRows, ...kept], cleared }
}

// Rimuove le righe indicate (LASER): il resto scende, righe vuote in cima.
export function clearRows(board: Board, rows: number[]): Board {
  const width = board[0].length
  const drop = new Set(rows)
  const kept = board.filter((_, i) => !drop.has(i))
  const emptyRows: Board = Array.from({ length: board.length - kept.length }, () =>
    Array.from({ length: width }, () => null),
  )
  return [...emptyRows, ...kept]
}

// Svuota le colonne indicate da `fromY` in giù (CLEAVER). Niente compattazione.
export function clearColumnsFrom(
  board: Board,
  columns: number[],
  fromY: number,
): Board {
  const cols = new Set(columns)
  return board.map((row, y) =>
    y >= fromY ? row.map((cell, x) => (cols.has(x) ? null : cell)) : row,
  )
}
