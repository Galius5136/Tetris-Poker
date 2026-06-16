// Configurazione del run derivata dai joker equipaggiati — logica pura.
// "On run start, apply all activeJokers to run config" (dal CR).
// Per ora copre la Categoria 1 (moltiplicatori bankroll); le altre categorie
// aggiungono campi qui nei passi successivi.

import type { HandCategory } from '../game/poker'
import type { JokerId } from './upgrades'

export interface RunConfig {
  handPayoutMult: number // HIGH_ROLLER: +25% su tutte le mani
  flushDouble: boolean // SUIT_PREMIUM: mani di colore ×2
  pairTriple: boolean // PAIR_GRINDER: coppia/doppia coppia ×3
  streakBonus: boolean // STREAK_BONUS: 3+ righe → +15% alla mano dopo
  compoundingInterest: boolean // COMPOUNDING_INTEREST: bankroll iniziale carry ×1.1
}

export const NEUTRAL_CONFIG: RunConfig = {
  handPayoutMult: 1,
  flushDouble: false,
  pairTriple: false,
  streakBonus: false,
  compoundingInterest: false,
}

export const STREAK_BONUS_MULT = 1.15

export function buildRunConfig(jokers: JokerId[]): RunConfig {
  const has = (id: JokerId) => jokers.includes(id)
  return {
    handPayoutMult: has('HIGH_ROLLER') ? 1.25 : 1,
    flushDouble: has('SUIT_PREMIUM'),
    pairTriple: has('PAIR_GRINDER'),
    streakBonus: has('STREAK_BONUS'),
    compoundingInterest: has('COMPOUNDING_INTEREST'),
  }
}

// Punti di una singola mano applicando i moltiplicatori per-categoria.
// Categorie: 2 = coppia, 3 = doppia coppia, 6 = colore, 9 = scala colore/reale.
export function handPointsWithConfig(
  category: HandCategory,
  basePoints: number,
  config: RunConfig,
): number {
  let pts = basePoints
  if (config.pairTriple && (category === 2 || category === 3)) pts *= 3
  if (config.flushDouble && (category === 6 || category === 9)) pts *= 2
  return pts
}

// Bankroll di partenza del run (Compound Interest), dato il valore finale del run precedente.
export function startingBankroll(config: RunConfig, lastRunBankroll: number): number {
  return config.compoundingInterest ? Math.floor(lastRunBankroll * 1.1) : 0
}
