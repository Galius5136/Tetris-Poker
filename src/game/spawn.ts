// Generazione dei pezzi. La casualità è DETERMINISTICA: tutto deriva da un RNG
// seminato, threaded come stato intero `rng` (vedi rng.ts) → un run è
// riproducibile da un seed (CR-004).

import {
  SHAPES,
  type Piece,
  type TetrominoType,
  type SpecialKind,
} from './tetromino'
import { WILD_CARD, type Card } from './cards'
import { fullDeck, type Deck } from './deck'
import { nextFloat, shuffleArr } from './rng'

const ALL_TYPES = Object.keys(SHAPES) as TetrominoType[]
const CELLS_PER_PIECE = 4

// "Spec" di un pezzo prima di entrare in gioco: forma + 4 carte + eventuale tipo speciale.
export interface PieceSpec {
  type: TetrominoType
  cards: [Card, Card, Card, Card]
  special: SpecialKind | null
}

// Regola di spawn di un pezzo speciale: 1 probabilità su `rarity`.
export interface SpecialRule {
  kind: SpecialKind
  rarity: number
}

// Decide se il prossimo pezzo è speciale. La prima regola che "scatta" vince.
export function rollSpecial(
  rules: SpecialRule[],
  rng: number,
): { kind: SpecialKind | null; rng: number } {
  let r = rng
  for (const rule of rules) {
    const [v, r2] = nextFloat(r)
    r = r2
    if (v < 1 / rule.rarity) return { kind: rule.kind, rng: r }
  }
  return { kind: null, rng: r }
}

// 7-bag: estrae un tipo dal sacchetto; se vuoto, lo riempie mescolando (rng).
export function drawType(
  bag: TetrominoType[],
  rng: number,
): { type: TetrominoType; bag: TetrominoType[]; rng: number } {
  if (bag.length > 0) return { type: bag[0], bag: bag.slice(1), rng }
  const [shuffled, rng2] = shuffleArr(rng, ALL_TYPES)
  return { type: shuffled[0], bag: shuffled.slice(1), rng: rng2 }
}

// Garantisce almeno n carte, rabboccando col mazzo-modello mescolato (rng).
function ensure(
  deck: Deck,
  n: number,
  template: Deck,
  rng: number,
): { deck: Deck; rng: number } {
  let d = deck
  let r = rng
  while (d.length < n) {
    const [s, r2] = shuffleArr(r, template)
    d = [...d, ...s]
    r = r2
  }
  return { deck: d, rng: r }
}

export function drawCards(
  deck: Deck,
  template: Deck,
  rng: number,
): { cards: [Card, Card, Card, Card]; deck: Deck; rng: number } {
  const e = ensure(deck, CELLS_PER_PIECE, template, rng)
  return {
    cards: e.deck.slice(0, CELLS_PER_PIECE) as [Card, Card, Card, Card],
    deck: e.deck.slice(CELLS_PER_PIECE),
    rng: e.rng,
  }
}

// Pesca una spec completa (tipo dal bag, carte dal mazzo, eventuale speciale).
export function drawSpec(
  bag: TetrominoType[],
  deck: Deck,
  template: Deck = fullDeck(),
  specialRules: SpecialRule[] = [],
  rng = 0,
): { spec: PieceSpec; bag: TetrominoType[]; deck: Deck; rng: number } {
  const t = drawType(bag, rng)
  const c = drawCards(deck, template, t.rng)
  const s = rollSpecial(specialRules, c.rng)
  const special = s.kind
  // La bomba è una 2×2 (forma O); l'ancora è una barra (forma I).
  const type = special === 'bomb' ? 'O' : special === 'anchor' ? 'I' : t.type
  // WILD: una delle 4 carte del pezzo diventa un jolly.
  const cards: [Card, Card, Card, Card] =
    special === 'wild'
      ? [{ ...WILD_CARD }, c.cards[1], c.cards[2], c.cards[3]]
      : c.cards
  return {
    spec: { type, cards, special },
    bag: t.bag,
    deck: c.deck,
    rng: s.rng,
  }
}

// Crea il pezzo giocabile da una spec, centrato in cima.
export function makePiece(spec: PieceSpec, boardWidth: number): Piece {
  return {
    type: spec.type,
    x: Math.floor(boardWidth / 2) - 1,
    y: 0,
    rotation: 0,
    cards: spec.cards,
    special: spec.special,
    mirrored: false,
  }
}
