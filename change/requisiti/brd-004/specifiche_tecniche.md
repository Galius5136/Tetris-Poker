# CR-004 — Specifiche tecniche (v1, da validare)

**Change:** sfida asincrona tra giocatori + punteggi degli amici in UI
**Fase Change Management:** 4 — Generazione specifiche tecniche preliminari
**Attori:** Analista + Sviluppatore (con AI)
**Stato:** 🟡 v1 da validare al **Quality Gate specifiche (fase 7)**
**Riferimenti:** `requisiti_brd4.pdf`, `specifiche_funzionali.md`, `qa-chiarimenti.md`

> Adattamento del flusso: la Fase 4 prevede "oggetti DB / PL-SQL / tabelle/viste
> impattate". CR-004 è **serverless e senza database** (Opzione A), quindi qui si
> identificano **moduli client, strutture dati e impatti sul codice**. Questo
> documento è **design**, non implementazione (lo sviluppo è la fase 8).

---

## 1. Contesto e vincoli tecnici

- Stack: **React + TypeScript + Vite**, hosting **statico** (Vercel).
- Stato persistente: **`localStorage`** (`MetaState` in `src/meta/metaGameStore.ts`).
- Vincolo Opzione A: **nessun backend, nessun DB, nessun dato online**. Tutto
  viaggia dentro un **codice sfida** che l'utente condivide manualmente.
- Principio cardine del change: un run dev'essere **riproducibile** da un seed +
  dal loadout (per replicare le condizioni dello sfidante).

## 2. Componenti impattati

### Nuovi moduli (logica pura, testabile)
- **`src/game/rng.ts`** — PRNG deterministico (es. mulberry32) seminabile;
  espone `createRng(seed)` con `next()`, `int(n)`, `shuffle(arr)`.
- **`src/meta/challenge.ts`** — `encodeChallenge(payload)` / `decodeChallenge(str)`
  (serializzazione URL-safe + versione + checksum), `compareResult(...)`.
- **`src/meta/friends.ts`** — gestione lista amici locale (upsert/rimozione/ordina).

### Moduli da modificare (per il **determinismo del run**)
Oggi usano `Math.random()` non riproducibile → vanno alimentati dal PRNG semina­to:
- `src/game/deck.ts` — `shuffle` (mischia mazzo).
- `src/game/spawn.ts` — 7-bag (`drawType`/`shuffle`) e `rollSpecial` (pezzi speciali).
- `src/App.tsx` — scelta `wildSuit` in `startRun` (FLUSH_WILD_SUIT).
- *(già deterministici: i modificatori dei tavoli — derivano da seed in
  `tableModifiers.ts`; i minigiochi Casinò sono skill-stop, non RNG.)*

### Stato/persistenza
- `src/meta/metaGameStore.ts` — `MetaState` esteso con: `nickname`, `friendCode`,
  `friends[]`. (vedi §5)

### UI (`src/App.tsx`, `src/meta/*Screen.tsx`, `App.css`)
- Game Over → **"Lancia sfida"**.
- Schermata iniziale → **"Accetta sfida"** (incolla/parse) + **pannello Amici**.
- Overlay **esito sfida** (Vinta/Persa/Pareggio).

## 3. Determinismo del run (cuore tecnico)

- Si introduce un **`runSeed`** per ogni partita. All'avvio del run si crea
  **un'istanza RNG** (`createRng(runSeed)`) che viene **passata** (thread) a tutte
  le sorgenti di casualità del run: shuffle mazzo, 7-bag, `rollSpecial`,
  `wildSuit`. Nessuna chiamata a `Math.random()` resta nel **ciclo di run**.
- Le condizioni del tavolo (modificatori) **già** derivano da un seed → si
  allineano allo stesso `runSeed` (o a un seed derivato).
- **Fuori dal determinismo del run** (e va bene così): `grantRandomJoker`
  (ricompensa Boss) è un evento **meta tra run**, non parte della partita
  riproducibile.
- **Regressione attesa:** a parità di seed il gioco si comporta **identico**;
  in gioco normale `runSeed` è casuale all'avvio → esperienza invariata.

## 4. Codice sfida — formato

Payload logico (concettuale):
```
{
  v:        <versione schema/gioco>,      // compatibilità (CE-2)
  seed:     <runSeed>,                    // riproduce le condizioni
  loadout:  <jokers/upgrade attivi dello sfidante>,  // replica i potenziamenti
  result:   { table: N, fiches: F },      // metrica + tie-break (DI-1)
  by:       { nickname, friendCode },     // chi ha lanciato
  sig:      <checksum>                    // integrità leggera (DI-2)
}
```
- **Serializzazione:** JSON → stringa **URL-safe** (es. base64url; compressione
  opzionale se la lunghezza lo richiede).
- **Trasporto (DI-3):** **link** `https://…/?c=<payload>` (apri-e-gioca) **e**
  **codice testuale** (lo stesso `<payload>`) come fallback.
- **Validazione in decode:** verifica `v` compatibile (altrimenti CE-2) e
  `sig`/checksum (altrimenti CE-1). Il checksum è **anti-corruzione**, non
  anti-cheat (DI-2/NF-3).

## 5. Identità e amici — modello dati (locale)

Estensione di `MetaState`:
```
nickname:   string
friendCode: string            // generato una volta, stabile (RF-1/RF-2)
friends:    Array<{
              friendCode: string,
              nickname:   string,
              bestTable:  number,
              fiches:     number,   // tie-break
              updatedAt:  number    // timestamp import
            }>
```
- Su **import** di un codice sfida (RF-11): **upsert** dell'amico per `friendCode`
  (tieni il risultato migliore / più recente). Niente rete.
- Pannello amici (RF-12): ordina per `bestTable` desc (poi `fiches`).

## 6. Modalità "run di sfida"

- Lo stato del run acquisisce un contesto opzionale `challenge` (seed + loadout +
  target dello sfidante).
- `startRun` in modalità sfida: usa `seed` e `loadout` del codice (al posto del
  meta del giocatore) → condizioni replicate (RF-8). L'utente gioca le **proprie
  mosse**.
- A Game Over: `compareResult(mioTable/mieFiches, target)` → **Vinta/Persa/
  Pareggio** (RC-2/RC-3). Opzione **"Rilancia"** (RF-10): genera un nuovo codice
  sullo stesso `seed`/`loadout` col proprio risultato.

## 7. Versionamento & compatibilità (CE-2)

- Campo `v` nel payload. La logica di replica del run è legata alla versione: se
  cambia il modo in cui un seed genera la partita, `v` si incrementa e i codici
  di versioni diverse mostrano **"sfida non compatibile con questa versione"**.

## 8. Sicurezza / privacy

- **Nessun dato su server.** L'unico dato personale è il **nickname**, digitato
  dall'utente e presente **solo** nei codici che l'utente stesso decide di
  condividere. Nessuna raccolta, nessun tracciamento.
- Anti-cheat non garantito by design (NF-3): risultato auto-dichiarato; checksum
  solo anti-corruzione.

## 9. Superficie di test (anticipazione per fase 10)

Logica pura testabile:
- `rng`: stesso seed → stessa sequenza; indipendenza tra istanze.
- `challenge`: **encode→decode** round-trip; rifiuto per versione/checksum errati.
- `friends`: upsert (aggiorna il migliore), rimozione, ordinamento.
- `compareResult`: Vinta/Persa/Pareggio + tie-break su fiches.
- **Regressione determinismo:** a parità di seed, mazzo/bag/special/modificatori
  identici (un test di "replay").

## 10. Rischi & impatti

- **Refactor determinismo** = rischio principale: tocca deck/spawn/App. Mitigazione:
  RNG iniettato, test di replay, e default a seed casuale per il gioco normale
  (nessun cambiamento percepito).
- **Lunghezza del codice sfida**: il `loadout` aumenta il payload → eventuale
  compressione (valutazione in implementazione).
- **Crescita di `MetaState`**: aggiunti campi → gestire il merge/retro­compatibilità
  del `localStorage` esistente (già tollerante ai campi mancanti in `loadMeta`).

## 11. Tracciabilità (RF → tecnica)

| RF | Copertura tecnica |
|----|-------------------|
| RF-1/2 (identità) | `MetaState.nickname/friendCode` (§5) |
| RF-3/4/5 (lancia) | `challenge.encode` + UI Game Over + link/codice (§4) |
| RF-6/7/8 (accetta) | `challenge.decode` + modalità run di sfida (§6) + determinismo (§3) |
| RF-9/10 (esito/rilancio) | `compareResult` + "Rilancia" (§6) |
| RF-11..14 (amici) | `friends` + pannello UI (§5) |
| CE-1/2 (errori) | checksum + versione (§4, §7) |
| NF-1/2/3 | serverless/offline/anti-cheat (§8) |

---

> Prossimi passi da flusso: **Fase 6 — Pianificazione** (PM), poi **Fase 7 —
> Quality Gate** (Analista+Sviluppatore) per approvare funzionali + tecniche su
> branch dedicato; **solo dopo** parte lo sviluppo (Fase 8).
