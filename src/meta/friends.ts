// Lista amici locale (CR-004). Pura: nessuna rete, nessuno storage qui.
// I dati arrivano dall'import dei codici sfida e vivono nel MetaState.

export interface FriendEntry {
  friendCode: string
  nickname: string
  bestTable: number // miglior tavolo raggiunto noto
  fiches: number // tie-break (fiches totali del run)
  updatedAt: number // timestamp dell'ultimo import
}

// Inserisce o aggiorna un amico per `friendCode`: tiene il risultato migliore
// (tavolo più alto; a parità, più fiches) e aggiorna nickname/timestamp.
export function upsertFriend(
  friends: FriendEntry[],
  entry: FriendEntry,
): FriendEntry[] {
  const existing = friends.find((f) => f.friendCode === entry.friendCode)
  if (!existing) return [...friends, entry]
  const better =
    entry.bestTable > existing.bestTable ||
    (entry.bestTable === existing.bestTable && entry.fiches > existing.fiches)
  const merged: FriendEntry = {
    friendCode: entry.friendCode,
    nickname: entry.nickname, // sempre al nickname più recente
    bestTable: better ? entry.bestTable : existing.bestTable,
    fiches: better ? entry.fiches : existing.fiches,
    updatedAt: entry.updatedAt,
  }
  return friends.map((f) => (f.friendCode === entry.friendCode ? merged : f))
}

export function removeFriend(
  friends: FriendEntry[],
  friendCode: string,
): FriendEntry[] {
  return friends.filter((f) => f.friendCode !== friendCode)
}

// Ordina dal migliore: tavolo desc, poi fiches desc.
export function sortedFriends(friends: FriendEntry[]): FriendEntry[] {
  return [...friends].sort(
    (a, b) => b.bestTable - a.bestTable || b.fiches - a.fiches,
  )
}

// Genera un codice amico (IMPURO, una tantum): non fa parte del determinismo
// del run, è solo un identificativo locale.
export function generateFriendCode(): string {
  const s = Math.floor(Math.random() * 0xffffffff)
    .toString(36)
    .toUpperCase()
  return s.padStart(6, '0').slice(0, 6)
}
