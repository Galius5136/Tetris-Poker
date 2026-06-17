// Sfida asincrona (CR-004, Opzione A: share-code serverless, nessun backend).
// Una sfida e' un payload autoportante codificato in una stringa condivisibile:
// contiene il SEED e l'INTERO setup del lanciatore (joker + bankroll iniziale),
// cosi' lo sfidante rigioca esattamente le stesse condizioni. Logica pura.

import type { JokerId } from './upgrades'

export const CHALLENGE_VERSION = 1
const PREFIX = 'TPK'

export interface ChallengePayload {
  v: number // versione del formato (forward-compat)
  seed: number // seme del run: determina pezzi/carte/modificatori tavoli
  jokers: JokerId[] // joker equipaggiati dal lanciatore (ricostruiscono config/mazzo/speciali)
  bankroll: number // bankroll iniziale risolto (replica esatta del setup)
  table: number // METRICA: tavolo raggiunto dal lanciatore (da battere)
  fiches: number // fiches finali del lanciatore (tie-break a parita' di tavolo)
  by: string // nickname del lanciatore
  code: string // friend code del lanciatore
}

export type Outcome = 'win' | 'lose' | 'tie'

export type DecodeResult =
  | { ok: true; payload: ChallengePayload }
  | { ok: false; error: 'format' | 'checksum' | 'version' }

// FNV-1a a 32 bit: rileva corruzioni/troncamenti nel copia-incolla del codice.
function checksum(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// base64url su UTF-8 (i nickname possono contenere caratteri non-ASCII).
function b64urlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(b: string): string {
  const bin = atob(b.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// Formato: TPK<versione>.<base64url(json)>.<checksum base36>
export function encodeChallenge(p: ChallengePayload): string {
  const json = JSON.stringify(p)
  return `${PREFIX}${p.v}.${b64urlEncode(json)}.${checksum(json).toString(36)}`
}

export function decodeChallenge(code: string): DecodeResult {
  const m = /^TPK(\d+)\.([^.]+)\.([^.]+)$/.exec(code.trim())
  if (!m) return { ok: false, error: 'format' }
  let json: string
  try {
    json = b64urlDecode(m[2])
  } catch {
    return { ok: false, error: 'format' }
  }
  if (checksum(json).toString(36) !== m[3]) return { ok: false, error: 'checksum' }
  let payload: ChallengePayload
  try {
    payload = JSON.parse(json) as ChallengePayload
  } catch {
    return { ok: false, error: 'format' }
  }
  const version = Number(m[1])
  if (payload.v !== version || version !== CHALLENGE_VERSION) {
    return { ok: false, error: 'version' }
  }
  return { ok: true, payload }
}

// Confronta il risultato dello sfidante col lanciatore: tavolo piu' alto vince,
// a parita' di tavolo decidono le fiches (CR-004, metrica = tavolo raggiunto).
export function compareResult(
  challenge: Pick<ChallengePayload, 'table' | 'fiches'>,
  myTable: number,
  myFiches: number,
): Outcome {
  if (myTable !== challenge.table) return myTable > challenge.table ? 'win' : 'lose'
  if (myFiches !== challenge.fiches) return myFiches > challenge.fiches ? 'win' : 'lose'
  return 'tie'
}
