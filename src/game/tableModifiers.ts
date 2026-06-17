// Tavoli speciali (Blind & Boss) — catalogo + selezione deterministica.
// SOLO DATI + scelta: gli effetti vengono agganciati nei passi successivi.

import type { HandCategory } from './poker'

export type TableKind = 'standard' | 'blind' | 'boss'

export type TableModifierId =
  | 'STANDARD'
  | 'NARROW'
  | 'FAST'
  | 'NO_HOLD'
  | 'NO_GHOST'
  | 'FLUSH_TABLE'
  | 'HIGH_STAKES'
  | 'THE_HOUSE'
  | 'COLD_DECK'

export interface TableReward {
  fiches?: number // bonus fiches immediato al superamento
  freeJoker?: boolean // un joker casuale gratis (entro il cap)
}

export interface TableModifier {
  id: TableModifierId
  name: string
  desc: string
  kind: TableKind
  targetMult: number // moltiplicatore sul target di fiches
  reward: TableReward
  boardWidth?: number // override larghezza board
  startSpeedMult?: number // velocità di partenza
  disableHold?: boolean
  disableGhost?: boolean
  scoreOnly?: HandCategory[] // solo queste categorie di mano pagano
}

// Ogni quanti tavoli arriva un Boss.
export const BOSS_EVERY = 5

export const TABLE_MODIFIERS: Record<TableModifierId, TableModifier> = {
  STANDARD: {
    id: 'STANDARD',
    name: 'Tavolo Standard',
    desc: 'Nessun effetto speciale.',
    kind: 'standard',
    targetMult: 1,
    reward: {},
  },
  NARROW: {
    id: 'NARROW',
    name: 'Tavolo Stretto',
    desc: 'Board a 8 colonne.',
    kind: 'blind',
    targetMult: 1,
    reward: { fiches: 120 },
    boardWidth: 8,
  },
  FAST: {
    id: 'FAST',
    name: 'Mano Calda',
    desc: 'I pezzi partono già più veloci (×1.5).',
    kind: 'blind',
    targetMult: 1,
    reward: { fiches: 120 },
    startSpeedMult: 1.5,
  },
  NO_HOLD: {
    id: 'NO_HOLD',
    name: 'Niente Riserva',
    desc: 'Hold disabilitato per questo tavolo.',
    kind: 'blind',
    targetMult: 1,
    reward: { fiches: 100 },
    disableHold: true,
  },
  NO_GHOST: {
    id: 'NO_GHOST',
    name: 'Al Buio',
    desc: 'Nessuna ghost piece.',
    kind: 'blind',
    targetMult: 1,
    reward: { fiches: 100 },
    disableGhost: true,
  },
  FLUSH_TABLE: {
    id: 'FLUSH_TABLE',
    name: 'Tavolo di Colore',
    desc: 'Solo le mani di colore pagano.',
    kind: 'blind',
    targetMult: 0.65, // i colori sono rari: target più basso
    reward: { fiches: 220 },
    scoreOnly: [6, 9],
  },
  HIGH_STAKES: {
    id: 'HIGH_STAKES',
    name: 'Posta Alta',
    desc: 'Target +50%.',
    kind: 'blind',
    targetMult: 1.5,
    reward: { fiches: 250 },
  },
  THE_HOUSE: {
    id: 'THE_HOUSE',
    name: 'Il Banco',
    desc: 'Target +70% e velocità ×1.5.',
    kind: 'boss',
    targetMult: 1.7, // ×2 + velocità ×1.5 era troppo combinato
    reward: { fiches: 400, freeJoker: true },
    startSpeedMult: 1.5,
  },
  COLD_DECK: {
    id: 'COLD_DECK',
    name: 'Mazzo Freddo',
    desc: 'Solo doppia coppia o meglio pagano; board a 9 colonne.',
    kind: 'boss',
    targetMult: 1.5,
    reward: { fiches: 350, freeJoker: true },
    boardWidth: 9,
    scoreOnly: [3, 4, 5, 6, 7, 8, 9, 10], // da doppia coppia in su (era da tris)
  },
}

const BLIND_POOL: TableModifierId[] = [
  'STANDARD', // qualche tavolo di respiro
  'NARROW',
  'FAST',
  'NO_HOLD',
  'NO_GHOST',
  'FLUSH_TABLE',
  'HIGH_STAKES',
]
const BOSS_POOL: TableModifierId[] = ['THE_HOUSE', 'COLD_DECK']

// Hash intero deterministico ben mescolato (seed + tavolo): tavoli consecutivi
// danno risultati diversi anche con seed piccoli.
function hashi(seed: number, table: number): number {
  let h = Math.imul(seed ^ 0x9e3779b9, 2654435761)
  h = Math.imul(h ^ (table + 1), 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return Math.abs(h | 0)
}

function pick(pool: TableModifierId[], seed: number, table: number): TableModifier {
  return TABLE_MODIFIERS[pool[hashi(seed, table) % pool.length]]
}

// Modificatore del tavolo `table` (1-based) per un dato seed di run.
export function modifierForTable(table: number, seed: number): TableModifier {
  if (table <= 1) return TABLE_MODIFIERS.STANDARD // onboarding pulito
  if (table % BOSS_EVERY === 0) return pick(BOSS_POOL, seed, table)
  return pick(BLIND_POOL, seed, table)
}
