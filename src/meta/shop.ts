// Logica dello shop — pura e DETERMINISTICA (seeded, niente Math.random a runtime
// non controllato). Seleziona gli upgrade offerti e gestisce l'acquisto.

import { ALL_UPGRADES, UPGRADES, type Upgrade, type UpgradeId } from './upgrades'
import { MAX_ACTIVE_JOKERS, type MetaState } from './metaGameStore'

export const SHOP_SIZE = 5

// Upgrade i cui effetti sono già agganciati al gioco: lo shop offre solo questi
// (niente acquisti a vuoto). Si allarga man mano che implementiamo le categorie.
const IMPLEMENTED: ReadonlySet<UpgradeId> = new Set<UpgradeId>([
  // Cat.1
  'HIGH_ROLLER', 'STREAK_BONUS', 'SUIT_PREMIUM', 'PAIR_GRINDER', 'COMPOUNDING_INTEREST',
  // Cat.3
  'FIVE_OF_A_KIND', 'FLUSH_WILD_SUIT', 'STRAIGHT_GAP', 'POKER_KICKER', 'DOUBLE_DOWN',
  // Cat.4 (composizione mazzo, escluso ADD_JOKER_CARDS)
  'REMOVE_LOW_CARDS', 'DOUBLE_FACE_CARDS', 'SUIT_FOCUS_HEARTS',
])

// PRNG deterministico (mulberry32): stesso seed → stessa sequenza.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// La vetrina ruota ogni 3 run.
export function shopRotation(meta: MetaState): number {
  return Math.floor(meta.runsPlayed / 3)
}

// 5 upgrade deterministici (seed = shopSeed + rotazione), esclusi i posseduti.
export function selectShop(meta: MetaState): Upgrade[] {
  const pool = ALL_UPGRADES.filter(
    (u) => IMPLEMENTED.has(u.id) && !meta.purchasedUpgrades.includes(u.id),
  )
  const seed = (Math.imul(meta.shopSeed, 2654435761) ^ (shopRotation(meta) * 40503)) >>> 0
  const rng = mulberry32(seed)
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, SHOP_SIZE)
}

export function isOwned(meta: MetaState, id: UpgradeId): boolean {
  return meta.purchasedUpgrades.includes(id)
}

export function jokersFull(meta: MetaState): boolean {
  return meta.activeJokers.length >= MAX_ACTIVE_JOKERS
}

// Acquistabile se: non posseduto, c'è uno slot joker libero, bankroll a sufficienza.
export function canBuy(meta: MetaState, id: UpgradeId): boolean {
  if (isOwned(meta, id) || jokersFull(meta)) return false
  return meta.totalBankroll >= UPGRADES[id].cost
}

// Acquista: scala il costo dal totale, sblocca ed equipaggia (cap garantito da canBuy).
export function buyUpgrade(meta: MetaState, id: UpgradeId): MetaState {
  if (!canBuy(meta, id)) return meta
  return {
    ...meta,
    totalBankroll: meta.totalBankroll - UPGRADES[id].cost,
    purchasedUpgrades: [...meta.purchasedUpgrades, id],
    activeJokers: [...meta.activeJokers, id],
  }
}
