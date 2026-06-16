// Difficoltà incrementale — logica pura.
// La velocità di caduta aumenta a ogni TAVOLO superato (non per pezzo né per
// livello): moltiplicatore = factorPerTable ^ (tavoli superati), limitato da
// `cap` e da un floor sul tick (MIN_TICK_MS).

export interface DifficultyConfig {
  factorPerTable: number // moltiplicatore di velocità per ogni tavolo superato
  cap: number // moltiplicatore massimo raggiungibile
}

export const DEFAULT_DIFFICULTY: DifficultyConfig = {
  factorPerTable: 1.2,
  cap: 8,
}

export const MIN_TICK_MS = 60 // tick minimo: sotto è di fatto ingiocabile

// Moltiplicatore di velocità dopo `tablesCleared` tavoli superati.
export function speedMultiplier(
  tablesCleared: number,
  cfg: DifficultyConfig = DEFAULT_DIFFICULTY,
): number {
  const raw = cfg.factorPerTable ** Math.max(0, tablesCleared)
  return Math.min(cfg.cap, raw)
}

// Tick di gravità effettivo: tick base (da livello) diviso il moltiplicatore.
export function difficultyTick(
  baseMs: number,
  tablesCleared: number,
  cfg: DifficultyConfig = DEFAULT_DIFFICULTY,
): number {
  return Math.max(MIN_TICK_MS, Math.round(baseMs / speedMultiplier(tablesCleared, cfg)))
}
