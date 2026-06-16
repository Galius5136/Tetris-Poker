// Difficoltà incrementale — logica pura.
// La velocità di caduta aumenta a ogni passaggio di livello (non per pezzo):
// moltiplicatore = factorPerLevel ^ (livelli saliti), limitato da `cap` e da un
// floor sul tick (MIN_TICK_MS).

export interface DifficultyConfig {
  factorPerLevel: number // moltiplicatore di velocità per ogni livello salito
  cap: number // moltiplicatore massimo raggiungibile
}

export const DEFAULT_DIFFICULTY: DifficultyConfig = {
  factorPerLevel: 1.2,
  cap: 8,
}

export const MIN_TICK_MS = 60 // tick minimo: sotto è di fatto ingiocabile

// Moltiplicatore di velocità dopo `levelsGained` salite di livello.
export function speedMultiplier(
  levelsGained: number,
  cfg: DifficultyConfig = DEFAULT_DIFFICULTY,
): number {
  const raw = cfg.factorPerLevel ** Math.max(0, levelsGained)
  return Math.min(cfg.cap, raw)
}

// Tick di gravità effettivo: tick base (da livello) diviso il moltiplicatore.
export function difficultyTick(
  baseMs: number,
  levelsGained: number,
  cfg: DifficultyConfig = DEFAULT_DIFFICULTY,
): number {
  return Math.max(MIN_TICK_MS, Math.round(baseMs / speedMultiplier(levelsGained, cfg)))
}
