# CR-004 — Documento finale tecnico-funzionale

**Fase Change Management:** 16 — Documentazione finale tecnico-funzionale
**Attori:** Analista, Sviluppatore (+ AI)
**Change:** sfida asincrona tra giocatori + punteggi degli amici

> Consolidamento del change rilasciato: cosa fa, come è fatto, e la tracciabilità
> esplicita **requisito → specifiche → codice → test**. È l'artefatto di
> riferimento in KB per il riuso futuro.

---

## 1. Sintesi funzionale

Due giocatori non contemporaneamente online si sfidano: uno gioca un run e ne
**lancia la sfida** (codice testuale condivisibile); l'altro lo **incolla**, vede
un **riepilogo**, gioca **lo stesso identico setup** (seed + potenziamenti +
bankroll iniziale) e prova ad arrivare a un **tavolo più alto**. A fine partita
vede l'**esito** (Vinta/Persa/Pareggio). L'import registra lo sfidante tra gli
**amici**, con pannello dei punteggi (rimozione inclusa).

## 2. Architettura della soluzione

- **Serverless / Opzione A:** nessun backend, nessun DB. Stato in `localStorage`.
- **Determinismo:** tutta la casualità del run deriva da un **seed** via PRNG
  mulberry32 a stato esplicito (`src/game/rng.ts`), threadato nei reducer puri
  (`src/game/spawn.ts`, `App.tsx`). Stesso seed → stessa partita ⇒ la sfida è
  riproducibile.
- **Codice sfida:** `src/meta/challenge.ts` — payload (seed, joker, bankroll,
  risultato, identità) in `TPK<versione>.<base64url(json)>.<checksum FNV-1a>`.
  Versione + checksum gestiscono incompatibilità e corruzioni.
- **Identità & amici:** `src/meta/friends.ts` + `MetaState`
  (`nickname`/`friendCode`/`friends`) con merge tollerante in `loadMeta`.
- **UI:** `App.tsx` (start overlay: identità, accetta-sfida, riepilogo, pannello
  amici; Game Over: esito, Lancia/Rilancia, pannello amici).

## 3. Mappa dei moduli

| Modulo | Responsabilità |
|--------|----------------|
| `src/game/rng.ts` | PRNG deterministico (API funzionale a stato esplicito) |
| `src/game/spawn.ts` | generazione pezzi/carte threadando l'RNG |
| `src/meta/challenge.ts` | encode/decode codice sfida + confronto esiti |
| `src/meta/friends.ts` | lista amici (upsert/remove/sort) + friend code |
| `src/meta/metaGameStore.ts` | persistenza meta (localStorage) |
| `src/App.tsx` | orchestrazione run, modalità sfida, UI |

## 4. Tracciabilità requisito → specifiche → codice → test

| RF | Codice | Test |
|----|--------|------|
| RF-1/2 identità | `metaGameStore.ts`, `App.tsx` (nickname/friendCode) | manuale (UAT) |
| RF-3/4 lancio + codice | `App.tsx#buildChallengeCode`, `challenge.ts#encodeChallenge` | `challenge.test.ts` |
| RF-5 condivisione | `App.tsx#launchChallenge` (codice testuale; link → CR futura) | manuale |
| RF-6/7 accetta + riepilogo | `App.tsx#previewChallenge` + card riepilogo | manuale |
| RF-8 replica esatta | `App.tsx#startChallenge`, `rng.ts`, `spawn.ts` | `determinism.test.ts` |
| RF-9 esito | `challenge.ts#compareResult` + overlay | `challenge.test.ts` |
| RF-10 rilancia | `App.tsx` (bottone RILANCIA) | manuale |
| RF-11/12 amici + pannello | `App.tsx#previewChallenge`, `friends.ts` | `friends.test.ts` |
| RF-13 rimuovi amico | `App.tsx#removeFriendById`, `friends.ts#removeFriend` | `friends.test.ts` |
| RF-14 solo locale | `metaGameStore.ts` (localStorage) | manuale |
| RC-1/2/3 confronto | `challenge.ts#compareResult` | `challenge.test.ts` |
| CE-1/2 errori codice | `challenge.ts#decodeChallenge` + UI | `challenge.test.ts` |

## 5. Deviazioni dalle specifiche

- **RF-5** — solo codice testuale in v1; link "apri e gioca" rimandato a CR futura.
- **CE-3** — nickname non impostato → default "Anonimo" (non bloccante).

## 6. Note operative

- Rilascio = hosting statico Vercel; rollback = promote del deploy precedente.
- Limite accettato (NF-3): risultato auto-dichiarato, nessun anti-cheat server.

## 7. Riferimenti (cartella `change/requisiti/brd-004/`)

`qa-chiarimenti` · `specifiche_funzionali` · `specifiche_tecniche` ·
`piano_di_progetto` · `quality-gate` · `analisi-statica` · `test-report` ·
`verbale-uat` · `cab` · `piano_ri_rilascio_rollback` · `verbale-rilascio` ·
`post-release`.
