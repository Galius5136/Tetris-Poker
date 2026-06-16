// Valutazione di mani di poker — logica pura, nessun React.
// Parametrizzabile con gli effetti del meta-shop (Cat.3) via EvalOptions.

import { SUITS, RANKS, type Card, type Rank, type Suit } from './cards'

// 1 = carta alta ... 9 = scala reale/colore, 10 = poker di 5 (Joker Rule).
export type HandCategory = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface HandResult {
  category: HandCategory
  name: string
  tie: number // tie-break: a parità di categoria, più alto = migliore
  cards: Card[] // le 5 carte scelte
}

// Modificatori delle regole, dai joker equipaggiati.
export interface EvalOptions {
  fiveOfAKind?: boolean // FIVE_OF_A_KIND: 5 uguali è una mano valida (cat 10)
  straightGap?: boolean // STRAIGHT_GAP: scala valida con un buco
  wildSuit?: Suit | null // FLUSH_WILD_SUIT: un seme conta come jolly per il colore
}

const RANK_VALUE: Record<Rank, number> = {
  A: 14, K: 13, Q: 12, J: 11, '10': 10, '9': 9, '8': 8,
  '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
}

// Punti per categoria di mano.
export const HAND_POINTS: Record<HandCategory, number> = {
  10: 500, 9: 150, 8: 90, 7: 65, 6: 50, 5: 42, 4: 26, 3: 18, 2: 11, 1: 4,
}

// Valuta esattamente 5 carte.
function scoreFive(cards: Card[], opts: EvalOptions = {}): HandResult {
  // Jolly: prova ogni sostituzione (seme×valore) e tieni la mano migliore.
  const wildIdx = cards.findIndex((c) => c.wild)
  if (wildIdx !== -1) {
    let best: HandResult | null = null
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const sub = cards.map((c, i) => (i === wildIdx ? { suit, rank } : c))
        const r = scoreFive(sub, opts)
        if (
          !best ||
          r.category > best.category ||
          (r.category === best.category && r.tie > best.tie)
        ) {
          best = r
        }
      }
    }
    return { ...(best as HandResult), cards } // carte originali (col jolly) per il display
  }

  const vals = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a)

  // Colore: con wildSuit, le carte del seme jolly contano come il seme dominante.
  const wild = opts.wildSuit ?? null
  const nonWild = cards.filter((c) => c.suit !== wild)
  const flush =
    nonWild.length === 0 || nonWild.every((c) => c.suit === nonWild[0].suit)

  const uniq = [...new Set(vals)].sort((a, b) => b - a)
  let straight = false
  let top = uniq[0]
  if (uniq.length === 5) {
    const span = uniq[0] - uniq[4]
    if (span === 4) straight = true
    else if (opts.straightGap && span === 5) straight = true // scala con un buco
    else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) {
      straight = true
      top = 5 // ruota A-2-3-4-5
    }
  }

  const counts: Record<number, number> = {}
  for (const v of vals) counts[v] = (counts[v] || 0) + 1
  const groups = Object.entries(counts)
    .map(([v, n]) => [Number(v), n] as [number, number])
    .sort((a, b) => b[1] - a[1] || b[0] - a[0])
  const pattern = groups.map((g) => g[1]).join('')

  let category: HandCategory
  let name: string
  if (opts.fiveOfAKind && pattern.startsWith('5')) {
    category = 10
    name = 'Poker di 5'
  } else if (straight && flush) {
    category = 9
    name = top === 14 ? 'Scala Reale' : 'Scala Colore'
  } else if (pattern.startsWith('4')) {
    category = 8
    name = 'Poker'
  } else if (pattern === '32') {
    category = 7
    name = 'Full'
  } else if (flush) {
    category = 6
    name = 'Colore'
  } else if (straight) {
    category = 5
    name = 'Scala'
  } else if (pattern.startsWith('3')) {
    category = 4
    name = 'Tris'
  } else if (pattern.startsWith('22')) {
    category = 3
    name = 'Doppia Coppia'
  } else if (pattern.startsWith('2')) {
    category = 2
    name = 'Coppia'
  } else {
    category = 1
    name = 'Carta Alta'
  }

  const tie =
    groups.reduce((s, g, i) => s + g[0] * Math.pow(15, 4 - i), 0) +
    (straight ? top * 0.001 : 0)

  return { category, name, tie, cards }
}

// Tutte le combinazioni di k elementi da arr.
function combinations<T>(arr: T[], k: number): T[][] {
  const res: T[][] = []
  const rec = (start: number, cur: T[]) => {
    if (cur.length === k) {
      res.push(cur.slice())
      return
    }
    for (let i = start; i < arr.length; i++) {
      cur.push(arr[i])
      rec(i + 1, cur)
      cur.pop()
    }
  }
  rec(0, [])
  return res
}

// Miglior mano da 5 carte ricavabile dalle carte di una riga (≥ 5 carte).
export function evalRow(cards: Card[], opts: EvalOptions = {}): HandResult {
  let best: HandResult | null = null
  for (const combo of combinations(cards, 5)) {
    const s = scoreFive(combo, opts)
    if (
      !best ||
      s.category > best.category ||
      (s.category === best.category && s.tie > best.tie)
    ) {
      best = s
    }
  }
  return best as HandResult
}
