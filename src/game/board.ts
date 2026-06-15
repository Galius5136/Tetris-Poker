// Modello della board — logica pura, nessun React qui.

import type { Card } from './cards'

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

// Una cella è vuota (`null`) oppure contiene una carta.
export type Cell = Card | null

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

// Ritorna una NUOVA board con una carta posizionata in (x, y). Immutabile.
export function placeCard(
  board: Board,
  x: number,
  y: number,
  card: Card,
): Board {
  return board.map((row, ry) =>
    ry === y ? row.map((cell, cx) => (cx === x ? card : cell)) : row,
  )
}
