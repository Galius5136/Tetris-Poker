// Valutazione di mani di poker — logica pura, nessun React.
// Portato dal design .dc.html (scoreFive/evalRow), tipizzato.

import type { Card, Rank } from './cards'

// Categoria della mano: 1 = carta alta ... 9 = scala reale/colore.
export type HandCategory = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface HandResult {
  category: HandCategory
  name: string
  tie: number // tie-break: a parità di categoria, più alto = migliore
  cards: Card[] // le 5 carte scelte
}

const RANK_VALUE: Record<Rank, number> = {
  A: 14, K: 13, Q: 12, J: 11, '10': 10, '9': 9, '8': 8,
  '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
}

// Punti assegnati per categoria di mano.
export const HAND_POINTS: Record<HandCategory, number> = {
  9: 150, 8: 90, 7: 65, 6: 50, 5: 42, 4: 26, 3: 18, 2: 11, 1: 4,
}

// Valuta esattamente 5 carte.
function scoreFive(cards: Card[]): HandResult {
  const vals = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a)
  const suits = cards.map((c) => c.suit)
  const flush = suits.every((s) => s === suits[0])

  const uniq = [...new Set(vals)].sort((a, b) => b - a)
  let straight = false
  let top = uniq[0]
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straight = true
    // ruota A-2-3-4-5: l'asso vale come 5
    else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) {
      straight = true
      top = 5
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
  if (straight && flush) {
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
export function evalRow(cards: Card[]): HandResult {
  let best: HandResult | null = null
  for (const combo of combinations(cards, 5)) {
    const s = scoreFive(combo)
    if (
      !best ||
      s.category > best.category ||
      (s.category === best.category && s.tie > best.tie)
    ) {
      best = s
    }
  }
  // Una riga piena ha 10 carte, quindi best non è mai null qui.
  return best as HandResult
}
