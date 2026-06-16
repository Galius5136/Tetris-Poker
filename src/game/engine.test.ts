import { describe, it, expect } from 'vitest'
import { createEmptyBoard, placeCell } from './board'
import { collides, tryMove, tryRotate, dropPosition } from './engine'
import type { Piece } from './tetromino'

const card = { rank: 'A', suit: '♠' } as const
const cards: Piece['cards'] = [card, card, card, card]

// Pezzo O (quadrato 2x2) comodo per i test.
const O = (x: number, y: number): Piece => ({ type: 'O', x, y, rotation: 0, cards })

describe('collides', () => {
  it('false nel mezzo di una board vuota', () => {
    expect(collides(createEmptyBoard(), O(4, 0))).toBe(false)
  })
  it('true se esce dal bordo destro', () => {
    expect(collides(createEmptyBoard(), O(9, 0))).toBe(true) // O occupa x=9 e 10
  })
  it('true se esce dal fondo', () => {
    expect(collides(createEmptyBoard(10, 20), O(4, 19))).toBe(true) // O occupa y=19 e 20
  })
  it('true se si sovrappone a una cella piena', () => {
    const b = placeCell(createEmptyBoard(), 4, 1, { card, type: 'O' })
    expect(collides(b, O(4, 0))).toBe(true)
  })
})

describe('tryMove', () => {
  it('sposta se libero', () => {
    const moved = tryMove(createEmptyBoard(), O(4, 0), 1, 0)
    expect(moved?.x).toBe(5)
  })
  it('ritorna null contro il muro', () => {
    expect(tryMove(createEmptyBoard(), O(9, 0), 1, 0)).toBeNull()
  })
})

describe('tryRotate', () => {
  it('incrementa la rotazione in spazio libero', () => {
    const r = tryRotate(createEmptyBoard(), { type: 'T', x: 4, y: 0, rotation: 0, cards })
    expect(r?.rotation).toBe(1)
  })
})

describe('dropPosition', () => {
  it('porta il pezzo fino in fondo', () => {
    const dropped = dropPosition(createEmptyBoard(10, 20), O(4, 0))
    expect(dropped.y).toBe(18) // O occupa righe y e y+1 → 18 e 19
  })
})
