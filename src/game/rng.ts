// PRNG deterministico (mulberry32) — logica pura.
// Stesso seed → stessa sequenza: è la base per rendere un run riproducibile
// (CR-004, specifiche tecniche §3). Sostituisce Math.random nel ciclo di run.

export interface Rng {
  next(): number // float in [0, 1)
  int(n: number): number // intero in [0, n)
  shuffle<T>(arr: readonly T[]): T[] // copia mescolata (Fisher-Yates)
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0
  const next = (): number => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (n: number): number => Math.floor(next() * n)
  const shuffle = <T>(arr: readonly T[]): T[] => {
    const out = [...arr]
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(i + 1)
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
  return { next, int, shuffle }
}

// Seed casuale per il gioco normale (fuori da una sfida).
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

// --- API funzionale a stato esplicito ---
// Lo stato è un intero; ogni passo ritorna [valore/effetto, nuovoStato]. Serve a
// THREADARE la casualità del run dentro stato puro (i reducer restano puri).

export function nextFloat(state: number): [number, number] {
  const a = (state + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a]
}

export function randInt(state: number, n: number): [number, number] {
  const [v, s] = nextFloat(state)
  return [Math.floor(v * n), s]
}

export function shuffleArr<T>(state: number, arr: readonly T[]): [T[], number] {
  const out = [...arr]
  let s = state
  for (let i = out.length - 1; i > 0; i--) {
    const [j, s2] = randInt(s, i + 1)
    s = s2
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return [out, s]
}
