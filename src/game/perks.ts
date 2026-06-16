// Perk del casinò — logica pura. Niente RNG: la slot è skill-stop (3 rulli),
// qui ci sono i modificatori, i simboli e gli esiti per allineamento.

export interface Modifiers {
  mult: number // moltiplicatore sulle fiches guadagnate
  bonusPerClear: number // fiches extra per ogni pulizia di righe
}

export const BASE_MODIFIERS: Modifiers = { mult: 1, bonusPerClear: 0 }

export type SlotSymbol = '7' | '💎' | '⭐' | '🔔' | '🍒'
export const SLOT_SYMBOLS: SlotSymbol[] = ['7', '💎', '⭐', '🔔', '🍒']

const round2 = (n: number) => Math.round(n * 100) / 100
const withMult = (m: Modifiers, f: number) => ({
  mods: { ...m, mult: round2(m.mult * f) },
  fiches: 0,
})
const withChips = (m: Modifiers, n: number) => ({ mods: m, fiches: n })
const withPerLine = (m: Modifiers, n: number) => ({
  mods: { ...m, bonusPerClear: m.bonusPerClear + n },
  fiches: 0,
})

interface Reward {
  desc: string
  apply: (m: Modifiers) => { mods: Modifiers; fiches: number }
}

// Premi per ogni simbolo: forte se ne allinei 3, medio se 2.
const REWARDS: Record<SlotSymbol, { three: Reward; two: Reward }> = {
  '7': {
    three: { desc: 'Moltiplicatore ×2', apply: (m) => withMult(m, 2) },
    two: { desc: 'Moltiplicatore ×1.4', apply: (m) => withMult(m, 1.4) },
  },
  '💎': {
    three: { desc: '+200 fiches', apply: (m) => withChips(m, 200) },
    two: { desc: '+60 fiches', apply: (m) => withChips(m, 60) },
  },
  '⭐': {
    three: { desc: '+30 fiches per riga', apply: (m) => withPerLine(m, 30) },
    two: { desc: '+12 fiches per riga', apply: (m) => withPerLine(m, 12) },
  },
  '🔔': {
    three: { desc: 'Moltiplicatore ×1.5', apply: (m) => withMult(m, 1.5) },
    two: { desc: 'Moltiplicatore ×1.2', apply: (m) => withMult(m, 1.2) },
  },
  '🍒': {
    three: { desc: '+100 fiches', apply: (m) => withChips(m, 100) },
    two: { desc: '+30 fiches', apply: (m) => withChips(m, 30) },
  },
}

const NO_MATCH: Reward = {
  desc: '+20 fiches (consolazione)',
  apply: (m) => withChips(m, 20),
}

export interface SlotOutcome {
  label: string // simboli vincenti, es. "777"
  desc: string
  apply: (m: Modifiers) => { mods: Modifiers; fiches: number }
}

// Esito dei 3 rulli fermati: 3 uguali > 2 uguali > nessuna coppia.
export function evalSlot(reels: SlotSymbol[]): SlotOutcome {
  const counts = {} as Record<SlotSymbol, number>
  for (const s of reels) counts[s] = (counts[s] || 0) + 1
  const keys = Object.keys(counts) as SlotSymbol[]

  const three = keys.find((s) => counts[s] === 3)
  if (three) {
    const r = REWARDS[three].three
    return { label: three.repeat(3), desc: r.desc, apply: r.apply }
  }
  const two = keys.find((s) => counts[s] === 2)
  if (two) {
    const r = REWARDS[two].two
    return { label: two.repeat(2), desc: r.desc, apply: r.apply }
  }
  return { label: '—', desc: NO_MATCH.desc, apply: NO_MATCH.apply }
}

// Applica i modificatori alle fiches grezze di una pulizia.
export function applyModifiers(raw: number, mods: Modifiers): number {
  return Math.round(raw * mods.mult) + mods.bonusPerClear
}
