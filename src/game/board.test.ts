import { describe, it, expect } from 'vitest'
import {
  createEmptyBoard,
  placeCell,
  clearFullRows,
  clearRows,
  clearColumnsFrom,
  clearArea,
  type Board,
} from './board'
import type { FilledCell } from './board'

const fill: FilledCell = { card: { rank: 'A', suit: '♠' }, type: 'O' }

// Riempie completamente una riga della board (mutando la copia data).
function fullRow(width: number): Board[number] {
  return Array.from({ length: width }, () => fill)
}

describe('createEmptyBoard', () => {
  it('ha le dimensioni richieste e tutte celle null', () => {
    const b = createEmptyBoard(3, 2)
    expect(b.length).toBe(2)
    expect(b[0].length).toBe(3)
    expect(b.flat().every((c) => c === null)).toBe(true)
  })
})

describe('placeCell', () => {
  it('posiziona la cella senza mutare la board originale', () => {
    const b = createEmptyBoard(3, 3)
    const b2 = placeCell(b, 1, 2, fill)
    expect(b2[2][1]).toEqual(fill)
    expect(b[2][1]).toBeNull() // immutabile
  })
})

describe('clearFullRows', () => {
  it('rimuove solo le righe piene e mantiene altezza', () => {
    const b = createEmptyBoard(3, 3)
    b[2] = fullRow(3)
    const { board, cleared } = clearFullRows(b)
    expect(cleared).toBe(1)
    expect(board.length).toBe(3)
    expect(board[0].every((c) => c === null)).toBe(true) // nuova riga vuota in cima
    expect(board[2].every((c) => c === null)).toBe(true) // la piena è sparita
  })

  it('non rimuove nulla se nessuna riga è piena', () => {
    const b = createEmptyBoard(3, 3)
    b[2][0] = fill
    const { cleared } = clearFullRows(b)
    expect(cleared).toBe(0)
  })
})

describe('clearRows (LASER)', () => {
  it('elimina le righe indicate e fa scendere, altezza invariata', () => {
    const b = createEmptyBoard(3, 3)
    b[1][0] = fill // metto qualcosa nella riga da pulire
    const out = clearRows(b, [1])
    expect(out.length).toBe(3)
    expect(out.flat().every((c) => c === null)).toBe(true)
  })
})

describe('clearColumnsFrom (CLEAVER)', () => {
  it('svuota la colonna da fromY in giù, lasciando sopra intatto', () => {
    const b = createEmptyBoard(3, 3)
    b[0][1] = fill // sopra fromY → resta
    b[2][1] = fill // sotto → via
    const out = clearColumnsFrom(b, [1], 1)
    expect(out[0][1]).toEqual(fill)
    expect(out[2][1]).toBeNull()
  })
})

describe('clearArea (BOMB)', () => {
  it('svuota il rettangolo e lascia il resto, bordi fuori board ignorati', () => {
    const b = createEmptyBoard(4, 4)
    b[3][3] = fill // fuori area → resta
    b[1][1] = fill // dentro → via
    const out = clearArea(b, 0, 0, 2, 2)
    expect(out[1][1]).toBeNull()
    expect(out[3][3]).toEqual(fill)
  })
})
