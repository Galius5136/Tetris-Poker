// Modello della board — logica pura, nessun React qui.

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

// Per ora una cella vuota è `null`. In futuro conterrà il colore/pezzo.
export type Cell = null

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
