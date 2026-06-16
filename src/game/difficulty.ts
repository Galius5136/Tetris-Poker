// Difficoltà incrementale — logica pura.
// Ogni pezzo bloccato accelera la caduta di `factorPerLock`. Bounded da `cap`
// (moltiplicatore massimo) e da un floor sul tick (MIN_TICK_MS), così il gioco
// resta tecnicamente giocabile anche con fattori aggressivi.

export interface DifficultyConfig {
  factorPerLock: number // moltiplicatore di velocità per ogni pezzo incastrato
  cap: number // moltiplicatore massimo raggiungibile
}

// Valore richiesto dal lead (×1.5 a pezzo) con un cap di sicurezza.
export const DEFAULT_DIFFICULTY: DifficultyConfig = {
  factorPerLock: 1.5,
  cap: 8,
}

export const MIN_TICK_MS = 60 // tick minimo: sotto è di fatto ingiocabile

// Moltiplicatore di velocità dopo `piecesLocked` pezzi.
export function speedMultiplier(
  piecesLocked: number,
  cfg: DifficultyConfig = DEFAULT_DIFFICULTY,
): number {
  const raw = cfg.factorPerLock ** Math.max(0, piecesLocked)
  return Math.min(cfg.cap, raw)
}

// Tick di gravità effettivo, dato il tick base (da livello) e i pezzi bloccati.
export function difficultyTick(
  baseMs: number,
  piecesLocked: number,
  cfg: DifficultyConfig = DEFAULT_DIFFICULTY,
): number {
  return Math.max(MIN_TICK_MS, Math.round(baseMs / speedMultiplier(piecesLocked, cfg)))
}
