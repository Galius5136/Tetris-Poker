// Livelli e velocità — logica pura.

export const START_LEVEL = 1

// Il livello sale di 1 ogni 10 righe completate.
export function levelFromLines(lines: number, startLevel = START_LEVEL): number {
  return Math.floor(lines / 10) + startLevel
}

// Millisecondi per un passo di gravità: più alto il livello, più veloce.
export function tickMs(level: number): number {
  return Math.max(110, 780 - (level - 1) * 68)
}
