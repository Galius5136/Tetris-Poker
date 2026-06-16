import { describe, it, expect } from 'vitest'
import { createEmptyBoard, type Board, type FilledCell } from './board'
import {
  applyLaser,
  applyCleaver,
  applyBomb,
  resolveGhost,
  stampAnchor,
} from './specialEffects'
import type { Piece } from './tetromino'

const card = { rank: 'A', suit: '♠' } as const
const cards: Piece['cards'] = [card, card, card, card]
const fill: FilledCell = { card, type: 'O' }
// Pezzo O: occupa (x,y),(x+1,y),(x,y+1),(x+1,y+1).
const O = (x: number, y: number, special: Piece['special']): Piece => ({
  type: 'O', x, y, rotation: 0, cards, special,
})
const seed = (mut: (b: Board) => void): Board => {
  const b = createEmptyBoard(5, 5)
  mut(b)
  return b
}

describe('applyLaser', () => {
  it('pulisce le righe del pezzo (altezza invariata)', () => {
    const b = seed((x) => (x[1][4] = fill)) // riga 1, fuori dal pezzo
    const out = applyLaser(b, O(0, 1, 'laser')) // occupa righe 1 e 2
    expect(out.length).toBe(5)
    expect(out[1][4]).toBeNull()
  })
})

describe('applyCleaver', () => {
  it('svuota la colonna dal pezzo in giù, lasciando sopra', () => {
    const b = seed((x) => {
      x[0][1] = fill // sopra → resta
      x[4][1] = fill // sotto → via
    })
    const out = applyCleaver(b, O(1, 1, 'cleaver')) // colonne 1,2 da y=1
    expect(out[0][1]).toEqual(fill)
    expect(out[4][1]).toBeNull()
  })
})

describe('applyBomb', () => {
  it('svuota il bounding box +1, lasciando fuori', () => {
    const b = seed((x) => {
      x[2][2] = fill // dentro l’esplosione → via
      x[4][4] = fill // fuori → resta
    })
    const out = applyBomb(b, O(1, 1, 'bomb')) // bbox 1..2 → esplode 0..3
    expect(out[2][2]).toBeNull()
    expect(out[4][4]).toEqual(fill)
  })
})

describe('resolveGhost', () => {
  it('attraversa una cella: la libera, scende di 1 e perde lo special', () => {
    const b = seed((x) => {
      x[2][0] = fill
      x[2][1] = fill // bloccanti sotto il pezzo
    })
    const { board, piece } = resolveGhost(b, O(0, 0, 'ghost'))
    expect(piece.special).toBeNull()
    expect(piece.y).toBe(1)
    const remaining = (board[2][0] === null ? 0 : 1) + (board[2][1] === null ? 0 : 1)
    expect(remaining).toBe(1) // esattamente una cella rimossa
  })
  it('senza ostacoli sotto resta invariato (solo special rimosso)', () => {
    const { board, piece } = resolveGhost(createEmptyBoard(5, 5), O(0, 0, 'ghost'))
    expect(piece.special).toBeNull()
    expect(piece.y).toBe(0)
    expect(board.flat().every((c) => c === null)).toBe(true)
  })
})

describe('stampAnchor', () => {
  it('marca le celle del pezzo con anchorUntil', () => {
    const b = seed((x) => {
      x[0][0] = fill
      x[0][1] = fill
    })
    const out = stampAnchor(b, O(0, 0, 'anchor'), 999)
    expect(out[0][0]?.anchorUntil).toBe(999)
  })
})
