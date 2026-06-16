// Struttura del "run" roguelike a tema casinò — logica pura.

export const FIRST_TARGET = 300

// Fiches richieste per superare il tavolo n (1-based): crescita esponenziale,
// arrotondata alla decina per numeri puliti.
export function tableTarget(table: number): number {
  return Math.round((FIRST_TARGET * Math.pow(1.7, table - 1)) / 10) * 10
}
