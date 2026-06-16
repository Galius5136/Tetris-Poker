// Perk del casinò — logica pura. Niente RNG: la slot è skill-stop a 3 rulli e
// i rulli sono CARTE: fermandoli formi una mano di poker a 3 carte, e il perk
// dipende dalla mano. Costa fiches (vedi SLOT_COST), in cambio dà perk.

import type { Card, Rank } from './cards'

export interface Modifiers {
  mult: number // moltiplicatore sulle fiches guadagnate
  bonusPerClear: number // fiches extra per ogni pulizia di righe
}

export const BASE_MODIFIERS: Modifiers = { mult: 1, bonusPerClear: 0 }

// Applica i modificatori alle fiches grezze di una pulizia.
export function applyModifiers(raw: number, mods: Modifiers): number {
  return Math.round(raw * mods.mult) + mods.bonusPerClear
}

// Costo di un giro di slot, in fiches.
export const SLOT_COST = 120

// Striscia di carte dei rulli (deterministica). Mix di semi e valori per
// rendere ottenibili tris/colore/scala con il giusto tempismo.
export const REEL_CARDS: Card[] = [
  { rank: 'A', suit: '♠' },
  { rank: 'K', suit: '♥' },
  { rank: 'Q', suit: '♣' },
  { rank: 'J', suit: '♦' },
  { rank: '10', suit: '♠' },
  { rank: '9', suit: '♥' },
  { rank: '8', suit: '♣' },
  { rank: '7', suit: '♦' },
  { rank: '6', suit: '♠' },
]

const ORDER: Rank[] = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',
]
const rval = (r: Rank) => ORDER.indexOf(r)

const round2 = (n: number) => Math.round(n * 100) / 100
const mult = (m: Modifiers, f: number): Modifiers => ({
  ...m,
  mult: round2(m.mult * f),
})
const perLine = (m: Modifiers, n: number): Modifiers => ({
  ...m,
  bonusPerClear: m.bonusPerClear + n,
})

export interface SlotOutcome {
  label: string // nome della mano, es. "Tris"
  desc: string // perk ottenuto
  apply: (m: Modifiers) => Modifiers
}

// Valuta la mano di poker a 3 carte formata dai rulli fermati.
export function evalThreeCardHand(cards: Card[]): SlotOutcome {
  const vals = cards.map((c) => rval(c.rank)).sort((a, b) => a - b)
  const flush = cards.every((c) => c.suit === cards[0].suit)
  const counts: Record<number, number> = {}
  for (const v of vals) counts[v] = (counts[v] || 0) + 1
  const maxCount = Math.max(...Object.values(counts))
  const straight = new Set(vals).size === 3 && vals[2] - vals[0] === 2

  if (maxCount === 3)
    return { label: 'Tris', desc: 'Moltiplicatore ×2', apply: (m) => mult(m, 2) }
  if (straight && flush)
    return { label: 'Scala Colore', desc: 'Moltiplicatore ×2.2', apply: (m) => mult(m, 2.2) }
  if (flush)
    return { label: 'Colore', desc: 'Moltiplicatore ×1.6', apply: (m) => mult(m, 1.6) }
  if (straight)
    return { label: 'Scala', desc: '+25 fiches per riga', apply: (m) => perLine(m, 25) }
  if (maxCount === 2)
    return { label: 'Coppia', desc: 'Moltiplicatore ×1.25', apply: (m) => mult(m, 1.25) }
  return { label: 'Carta Alta', desc: '+8 fiches per riga', apply: (m) => perLine(m, 8) }
}
