// Perk del casinò — logica pura. Niente RNG: i giochi sono a tempo/abilità,
// qui c'è solo la definizione dei perk e come modificano lo stato.

export interface Modifiers {
  mult: number // moltiplicatore sulle fiches guadagnate
  bonusPerClear: number // fiches extra per ogni pulizia di righe
}

export const BASE_MODIFIERS: Modifiers = { mult: 1, bonusPerClear: 0 }

export interface Perk {
  id: string
  label: string // testo breve sul rullo
  desc: string // descrizione
  // Applica il perk: ritorna i nuovi modificatori + fiches immediate.
  apply: (m: Modifiers) => { mods: Modifiers; fiches: number }
}

const round2 = (n: number) => Math.round(n * 100) / 100

// Rullo della slot: perk fissi (deterministici), in ordine fisso.
export const REEL_PERKS: Perk[] = [
  {
    id: 'm12',
    label: '×1.2',
    desc: 'Moltiplicatore fiches ×1.2',
    apply: (m) => ({ mods: { ...m, mult: round2(m.mult * 1.2) }, fiches: 0 }),
  },
  {
    id: 'f40',
    label: '+40',
    desc: '40 fiches subito',
    apply: (m) => ({ mods: m, fiches: 40 }),
  },
  {
    id: 'm15',
    label: '×1.5',
    desc: 'Moltiplicatore fiches ×1.5',
    apply: (m) => ({ mods: { ...m, mult: round2(m.mult * 1.5) }, fiches: 0 }),
  },
  {
    id: 'bpc',
    label: '+15/riga',
    desc: '+15 fiches per pulizia',
    apply: (m) => ({
      mods: { ...m, bonusPerClear: m.bonusPerClear + 15 },
      fiches: 0,
    }),
  },
  {
    id: 'mix',
    label: '×1.1 +20',
    desc: 'Moltiplicatore ×1.1 e 20 fiches',
    apply: (m) => ({ mods: { ...m, mult: round2(m.mult * 1.1) }, fiches: 20 }),
  },
]

// Applica i modificatori alle fiches grezze di una pulizia.
export function applyModifiers(raw: number, mods: Modifiers): number {
  return Math.round(raw * mods.mult) + mods.bonusPerClear
}
