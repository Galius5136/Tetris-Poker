import { describe, it, expect } from 'vitest'
import {
  upsertFriend,
  removeFriend,
  sortedFriends,
  type FriendEntry,
} from './friends'

const f = (
  friendCode: string,
  nickname: string,
  bestTable: number,
  fiches = 0,
  updatedAt = 1,
): FriendEntry => ({ friendCode, nickname, bestTable, fiches, updatedAt })

describe('upsertFriend', () => {
  it('aggiunge un amico nuovo', () => {
    const out = upsertFriend([], f('AAA', 'Mario', 3))
    expect(out).toHaveLength(1)
  })

  it('tiene il risultato migliore (tavolo più alto)', () => {
    const start = [f('AAA', 'Mario', 5, 100)]
    const peggiore = upsertFriend(start, f('AAA', 'Mario', 3, 999, 2))
    expect(peggiore[0].bestTable).toBe(5) // non scende
    const migliore = upsertFriend(start, f('AAA', 'Mario', 7, 10, 2))
    expect(migliore[0].bestTable).toBe(7)
  })

  it('a parità di tavolo, tie-break sulle fiches', () => {
    const start = [f('AAA', 'Mario', 5, 100)]
    const out = upsertFriend(start, f('AAA', 'Mario', 5, 150, 2))
    expect(out[0].fiches).toBe(150)
  })

  it('aggiorna sempre il nickname', () => {
    const start = [f('AAA', 'Mario', 5)]
    const out = upsertFriend(start, f('AAA', 'SuperMario', 2))
    expect(out[0].nickname).toBe('SuperMario')
  })
})

describe('removeFriend / sortedFriends', () => {
  it('rimuove per codice', () => {
    const out = removeFriend([f('AAA', 'A', 1), f('BBB', 'B', 2)], 'AAA')
    expect(out.map((x) => x.friendCode)).toEqual(['BBB'])
  })
  it('ordina per tavolo desc, poi fiches desc', () => {
    const out = sortedFriends([
      f('A', 'A', 3, 10),
      f('B', 'B', 5, 10),
      f('C', 'C', 5, 50),
    ])
    expect(out.map((x) => x.friendCode)).toEqual(['C', 'B', 'A'])
  })
})
