import { describe, it, expect } from 'vitest'
import {
  encodeChallenge,
  decodeChallenge,
  compareResult,
  CHALLENGE_VERSION,
  type ChallengePayload,
} from './challenge'

const payload: ChallengePayload = {
  v: CHALLENGE_VERSION,
  seed: 123456,
  jokers: ['COMPOUNDING_INTEREST', 'HIGH_ROLLER'],
  bankroll: 250,
  table: 4,
  fiches: 1200,
  by: 'Mario',
  code: 'AB12CD',
}

describe('encode/decode', () => {
  it('round-trip: decodifica restituisce il payload originale', () => {
    const r = decodeChallenge(encodeChallenge(payload))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload).toEqual(payload)
  })

  it('tollera spazi attorno al codice', () => {
    const r = decodeChallenge('  ' + encodeChallenge(payload) + '\n')
    expect(r.ok).toBe(true)
  })

  it('preserva nickname non-ASCII', () => {
    const p = { ...payload, by: 'Józsé 🎰' }
    const r = decodeChallenge(encodeChallenge(p))
    expect(r.ok && r.payload.by).toBe('Józsé 🎰')
  })

  it('rifiuta un formato non valido', () => {
    expect(decodeChallenge('non-un-codice').ok).toBe(false)
    expect(decodeChallenge('non-un-codice')).toMatchObject({ error: 'format' })
  })

  it('rileva corruzione tramite checksum', () => {
    const code = encodeChallenge(payload)
    // altero un carattere del corpo base64url
    const broken = code.replace(/\.(.)/, '.X')
    expect(decodeChallenge(broken).ok).toBe(false)
  })

  it('rifiuta versioni non supportate', () => {
    const r = decodeChallenge(encodeChallenge({ ...payload, v: 99 }))
    expect(r).toMatchObject({ ok: false, error: 'version' })
  })
})

describe('compareResult', () => {
  it('tavolo piu alto vince', () => {
    expect(compareResult({ table: 4, fiches: 1000 }, 5, 0)).toBe('win')
    expect(compareResult({ table: 4, fiches: 1000 }, 3, 99999)).toBe('lose')
  })
  it('a parita di tavolo decidono le fiches', () => {
    expect(compareResult({ table: 4, fiches: 1000 }, 4, 1500)).toBe('win')
    expect(compareResult({ table: 4, fiches: 1000 }, 4, 500)).toBe('lose')
  })
  it('pareggio esatto', () => {
    expect(compareResult({ table: 4, fiches: 1000 }, 4, 1000)).toBe('tie')
  })
})
