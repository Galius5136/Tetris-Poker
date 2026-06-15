// Generazione di un pezzo nuovo — IMPURO (usa Math.random), tenuto isolato
// dai moduli puri. Le carte casuali sono un PLACEHOLDER finché non c'è un
// vero mazzo (pescata senza ripetizioni + shuffle).

import { SHAPES, type Piece, type TetrominoType } from './tetromino'
import { RANKS, SUITS, type Card } from './cards'

const TYPES = Object.keys(SHAPES) as TetrominoType[]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomCard(): Card {
  return { suit: pick(SUITS), rank: pick(RANKS) }
}

// Nuovo pezzo in cima alla board, tipo e carte casuali.
export function randomPiece(boardWidth: number): Piece {
  return {
    type: pick(TYPES),
    x: Math.floor(boardWidth / 2) - 1,
    y: 0,
    cards: [randomCard(), randomCard(), randomCard(), randomCard()],
  }
}
