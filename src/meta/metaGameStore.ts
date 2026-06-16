// Stato meta persistente tra i run (localStorage). Avvolge il run loop senza
// toccarlo: il bankroll di fine partita confluisce nel totale, speso poi nello
// shop. Logica pura + un sottile wrapper sullo storage (iniettabile per i test).

export type UpgradeId = string // tipizzato a fondo nel catalogo (upgrades.ts)
export type JokerId = string

export interface MetaState {
  totalBankroll: number // accumulato tra tutti i run
  purchasedUpgrades: UpgradeId[] // sblocchi permanenti
  activeJokers: JokerId[] // equipaggiati per il prossimo run (max 5)
  shopSeed: number // rotazione deterministica dello shop
  runsPlayed: number // run completati (guida la rotazione ogni 3)
}

export const MAX_ACTIVE_JOKERS = 5

export const INITIAL_META: MetaState = {
  totalBankroll: 0,
  purchasedUpgrades: [],
  activeJokers: [],
  shopSeed: 1,
  runsPlayed: 0,
}

const STORAGE_KEY = 'tetris-poker:meta:v1'

// Minima interfaccia tipo Storage, per poter iniettare un finto storage nei test.
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function browserStorage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

// Carica lo stato meta; in caso di assenza/errore ritorna lo stato iniziale.
export function loadMeta(
  storage: StorageLike | null = browserStorage(),
): MetaState {
  if (!storage) return { ...INITIAL_META }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return { ...INITIAL_META }
    const parsed = JSON.parse(raw) as Partial<MetaState>
    // merge sui default: tollerante a versioni/campi mancanti
    return { ...INITIAL_META, ...parsed }
  } catch {
    return { ...INITIAL_META }
  }
}

export function saveMeta(
  meta: MetaState,
  storage: StorageLike | null = browserStorage(),
): void {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(meta))
  } catch {
    // storage pieno o non disponibile: ignora (il meta è best-effort)
  }
}

// Banca il bankroll finale del run nel totale e conta il run. Puro.
export function bankRun(meta: MetaState, finalBankroll: number): MetaState {
  return {
    ...meta,
    totalBankroll: meta.totalBankroll + Math.max(0, Math.round(finalBankroll)),
    runsPlayed: meta.runsPlayed + 1,
  }
}
