import { describe, it, expect } from 'vitest'
import { pieceCells, type Piece } from './tetromino'
import { tryMirror } from './engine'
import { rollSpecial } from './spawn'
import { createEmptyBoard } from './board'

const card = { rank: 'A', suit: '♠' } as const
const cards: Piece['cards'] = [card, card, card, card]
const J = (extra: Partial<Piece> = {}): Piece => ({
  type: 'J', x: 0, y: 0, rotation: 0, cards, ...extra,
})

describe('mirror del pezzo (pieceCells)', () => {
  it('riflette orizzontalmente le coordinate', () => {
    expect(pieceCells(J()).map((c) => c.x)).toEqual([0, 0, 1, 2])
    expect(pieceCells(J({ mirrored: true })).map((c) => c.x)).toEqual([2, 2, 1, 0])
  })
})

describe('tryMirror', () => {
  it('specchia in spazio libero, ma una sola volta', () => {
    const board = createEmptyBoard()
    const m = tryMirror(board, J({ x: 3 }))
    expect(m?.mirrored).toBe(true)
    expect(tryMirror(board, J({ x: 3, mirrored: true }))).toBeNull()
  })
})

describe('rollSpecial', () => {
  it('senza regole non assegna nulla', () => {
    expect(rollSpecial([], 1).kind).toBeNull()
  })
  it('con rarità 1 assegna sempre il tipo', () => {
    expect(rollSpecial([{ kind: 'heavy', rarity: 1 }], 1).kind).toBe('heavy')
  })
})
