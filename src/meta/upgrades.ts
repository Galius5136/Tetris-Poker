// Catalogo degli upgrade del meta-shop — SOLO DATI (nessun effetto qui).
// Gli effetti verranno agganciati nei passi successivi del CR.

export type UpgradeCategory = 'bankroll' | 'piece' | 'poker' | 'deck'

// Tipi di pezzo speciale introdotti dagli upgrade di categoria "piece".
// 'normal' è il tetromino standard.
export type PieceType =
  | 'normal'
  | 'bomb'
  | 'laser'
  | 'cleaver'
  | 'ghost'
  | 'heavy'
  | 'wild'
  | 'anchor'

export type UpgradeId =
  // Cat.1 — moltiplicatori bankroll
  | 'COMPOUNDING_INTEREST'
  | 'HIGH_ROLLER'
  | 'STREAK_BONUS'
  | 'SUIT_PREMIUM'
  | 'PAIR_GRINDER'
  // Cat.2 — modificatori dei pezzi
  | 'BOMB_PIECE'
  | 'LASER_PIECE'
  | 'COLUMN_CLEAVER'
  | 'GHOST_PIECE'
  | 'HEAVY_PIECE'
  | 'WILDCARD_PIECE'
  | 'MIRROR_PIECE'
  | 'ANCHOR_PIECE'
  // Cat.3 — modificatori delle mani di poker
  | 'FIVE_OF_A_KIND'
  | 'FLUSH_WILD_SUIT'
  | 'STRAIGHT_GAP'
  | 'POKER_KICKER'
  | 'DOUBLE_DOWN'
  // Cat.4 — composizione del mazzo
  | 'REMOVE_LOW_CARDS'
  | 'ADD_JOKER_CARDS'
  | 'SUIT_FOCUS_HEARTS'
  | 'DOUBLE_FACE_CARDS'

// Ogni upgrade equipaggiabile è anche un "joker" (max 5 attivi per run).
export type JokerId = UpgradeId

export interface Upgrade {
  id: UpgradeId
  name: string
  desc: string // descrizione dell'effetto (mostrata nello shop)
  cost: number
  category: UpgradeCategory
  pieceType?: PieceType // Cat.2: tipo di pezzo speciale introdotto
  rarity?: number // Cat.2: probabilità di spawn = 1 su N
}

export const UPGRADES: Record<UpgradeId, Upgrade> = {
  // --- Cat.1: moltiplicatori bankroll ---
  COMPOUNDING_INTEREST: {
    id: 'COMPOUNDING_INTEREST',
    name: 'Compound Interest',
    desc: 'Ogni run parte con bankroll = bankroll finale precedente ×1.1',
    cost: 300,
    category: 'bankroll',
  },
  HIGH_ROLLER: {
    id: 'HIGH_ROLLER',
    name: 'High Roller',
    desc: 'Pagamenti delle mani di poker +25% permanente',
    cost: 500,
    category: 'bankroll',
  },
  STREAK_BONUS: {
    id: 'STREAK_BONUS',
    name: 'Streak Bonus',
    desc: 'Pulire 3+ righe in una mossa: +15% alla prossima mano',
    cost: 250,
    category: 'bankroll',
  },
  SUIT_PREMIUM: {
    id: 'SUIT_PREMIUM',
    name: 'Suit Premium',
    desc: 'Le mani di colore (colore, scala colore, scala reale) pagano doppio',
    cost: 600,
    category: 'bankroll',
  },
  PAIR_GRINDER: {
    id: 'PAIR_GRINDER',
    name: 'Pair Grinder',
    desc: 'Coppia e doppia coppia pagano ×3',
    cost: 200,
    category: 'bankroll',
  },

  // --- Cat.2: modificatori dei pezzi ---
  BOMB_PIECE: {
    id: 'BOMB_PIECE',
    name: 'Bomb Piece',
    desc: '1 pezzo su 8 è una bomba 2×2: esplode in un raggio 3×3',
    cost: 400,
    category: 'piece',
    pieceType: 'bomb',
    rarity: 8,
  },
  LASER_PIECE: {
    id: 'LASER_PIECE',
    name: 'Laser Cut',
    desc: '1 su 10 è un laser orizzontale: pulisce la riga (niente poker)',
    cost: 450,
    category: 'piece',
    pieceType: 'laser',
    rarity: 10,
  },
  COLUMN_CLEAVER: {
    id: 'COLUMN_CLEAVER',
    name: 'Column Cleaver',
    desc: '1 su 10 è una punta verticale: pulisce la colonna sotto il punto',
    cost: 450,
    category: 'piece',
    pieceType: 'cleaver',
    rarity: 10,
  },
  GHOST_PIECE: {
    id: 'GHOST_PIECE',
    name: 'Phase Shift',
    desc: '1 su 12 attraversa una cella occupata (la rimuove)',
    cost: 350,
    category: 'piece',
    pieceType: 'ghost',
    rarity: 12,
  },
  HEAVY_PIECE: {
    id: 'HEAVY_PIECE',
    name: 'Gravity Piece',
    desc: '1 su 8 cade ×2 più veloce ma vale ×1.5 sul bankroll',
    cost: 300,
    category: 'piece',
    pieceType: 'heavy',
    rarity: 8,
  },
  WILDCARD_PIECE: {
    id: 'WILDCARD_PIECE',
    name: 'Wild Piece',
    desc: '1 su 10 è un jolly 1×1: vale qualsiasi seme/valore nella sua riga',
    cost: 700,
    category: 'piece',
    pieceType: 'wild',
    rarity: 10,
  },
  MIRROR_PIECE: {
    id: 'MIRROR_PIECE',
    name: 'Mirror Flip',
    desc: 'Premi M per specchiare orizzontalmente un pezzo (una volta per pezzo)',
    cost: 150,
    category: 'piece',
  },
  ANCHOR_PIECE: {
    id: 'ANCHOR_PIECE',
    name: 'Anchor',
    desc: '1 su 15 è un’ancora 1×3: blocca la riga per 3s (ma fa punti)',
    cost: 500,
    category: 'piece',
    pieceType: 'anchor',
    rarity: 15,
  },

  // --- Cat.3: modificatori delle mani di poker ---
  FIVE_OF_A_KIND: {
    id: 'FIVE_OF_A_KIND',
    name: 'Joker Rule',
    desc: 'Il poker di 5 è valido (se il mazzo ha duplicati) e paga ×10',
    cost: 800,
    category: 'poker',
  },
  FLUSH_WILD_SUIT: {
    id: 'FLUSH_WILD_SUIT',
    name: 'Suit Blind',
    desc: 'Un seme casuale per run è "wild" per il colore',
    cost: 600,
    category: 'poker',
  },
  STRAIGHT_GAP: {
    id: 'STRAIGHT_GAP',
    name: 'Inside Straight',
    desc: 'Le scale valgono con un buco (es. 2-3-5-6-7)',
    cost: 400,
    category: 'poker',
  },
  POKER_KICKER: {
    id: 'POKER_KICKER',
    name: 'Kicker Value',
    desc: 'Le righe "carta alta" ora pagano un piccolo bonus (prima 0)',
    cost: 200,
    category: 'poker',
  },
  DOUBLE_DOWN: {
    id: 'DOUBLE_DOWN',
    name: 'Double Down',
    desc: 'Premi D: raddoppia la prossima mano (rischio: -10% se peggiore)',
    cost: 350,
    category: 'poker',
  },

  // --- Cat.4: composizione del mazzo ---
  REMOVE_LOW_CARDS: {
    id: 'REMOVE_LOW_CARDS',
    name: 'Cut the Fat',
    desc: 'Rimuove tutti i 2 e i 3 dal mazzo',
    cost: 300,
    category: 'deck',
  },
  ADD_JOKER_CARDS: {
    id: 'ADD_JOKER_CARDS',
    name: 'Joker Deck',
    desc: 'Aggiunge 2 jolly al mazzo (qualsiasi valore e seme)',
    cost: 700,
    category: 'deck',
  },
  SUIT_FOCUS_HEARTS: {
    id: 'SUIT_FOCUS_HEARTS',
    name: 'Heart Deck',
    desc: 'Sostituisce il 25% delle carte non-cuori con cuori',
    cost: 400,
    category: 'deck',
  },
  DOUBLE_FACE_CARDS: {
    id: 'DOUBLE_FACE_CARDS',
    name: 'Royal Deck',
    desc: 'Raddoppia la frequenza delle figure (J, Q, K)',
    cost: 450,
    category: 'deck',
  },
}

// Tutti gli upgrade come lista (per iterazione/shop).
export const ALL_UPGRADES: Upgrade[] = Object.values(UPGRADES)

export function getUpgrade(id: UpgradeId): Upgrade {
  return UPGRADES[id]
}
