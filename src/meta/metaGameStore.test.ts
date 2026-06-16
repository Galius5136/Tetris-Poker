import { describe, it, expect } from 'vitest'
import {
  loadMeta,
  saveMeta,
  bankRun,
  INITIAL_META,
  type StorageLike,
} from './metaGameStore'

// Finto storage in memoria: simula localStorage (e un "refresh" = nuova load).
function fakeStorage(): StorageLike {
  const map = new Map<string, string>()
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  }
}

describe('persistenza MetaState', () => {
  it('senza dati salvati ritorna lo stato iniziale', () => {
    expect(loadMeta(fakeStorage())).toEqual(INITIAL_META)
  })

  it('salva e ricarica lo stesso stato (sopravvive al refresh)', () => {
    const storage = fakeStorage()
    const meta = { ...INITIAL_META, totalBankroll: 1234, runsPlayed: 3 }
    saveMeta(meta, storage)
    expect(loadMeta(storage)).toEqual(meta) // come dopo un reload di pagina
  })

  it('JSON corrotto → fallback sullo stato iniziale', () => {
    const storage = fakeStorage()
    storage.setItem('tetris-poker:meta:v1', '{not json')
    expect(loadMeta(storage)).toEqual(INITIAL_META)
  })
})

describe('bankRun', () => {
  it('somma il bankroll finale al totale e conta il run', () => {
    const after = bankRun(INITIAL_META, 500)
    expect(after.totalBankroll).toBe(500)
    expect(after.runsPlayed).toBe(1)
  })

  it('accumula su più run', () => {
    let meta = INITIAL_META
    for (const final of [300, 450, 600]) meta = bankRun(meta, final)
    expect(meta.totalBankroll).toBe(1350)
    expect(meta.runsPlayed).toBe(3)
  })

  it('ignora valori negativi', () => {
    expect(bankRun(INITIAL_META, -100).totalBankroll).toBe(0)
  })
})
