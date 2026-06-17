// Struttura del "run" roguelike a tema casinò — logica pura.

export const FIRST_TARGET = 300

// Fiches richieste per superare il tavolo n (1-based): crescita esponenziale,
// arrotondata alla decina. Fattore 1.55: escalation netta ma non un muro subito
// (si compone già con la velocità ×1.2/tavolo e coi modificatori).
export function tableTarget(table: number): number {
  return Math.round((FIRST_TARGET * Math.pow(1.55, table - 1)) / 10) * 10
}
