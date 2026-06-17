# CR-004 — Report di test (fase 10)

**Fase Change Management:** 10 — Test (interno, pre-UAT)
**Attori:** Sviluppatore / QA
**Oggetto:** implementazione T1–T6 + RF-7/RF-13 su `feature/cr-004-sfida-asincrona`
**Esito:** ✅ **PRONTO PER LA UAT** (fase 11, col cliente)

> Test **interni** prima della validazione col cliente. Combinano test automatici
> (unit, eseguiti in CI locale) e test manuali di smoke sui flussi UI.

---

## 1. Test automatici

`npm test` → **131/131 verdi**. `npm run build` pulito. Lint: 0 errori CR-004
(1 preesistente, fuori scope — vedi `analisi-statica.md`).

File di test rilevanti per la CR-004:
- `src/meta/challenge.test.ts` — codec (round-trip, non-ASCII, checksum, versione) + confronto esiti.
- `src/game/determinism.test.ts` — **test di replay**: stesso seed → stessa sequenza pezzi/carte.
- `src/meta/friends.test.ts` — upsert (miglior risultato, tie-break, nickname), remove, ordinamento.

## 2. Matrice di tracciabilità (RF → verifica)

| RF | Requisito | Verifica | Tipo | Esito |
|----|-----------|----------|------|:-----:|
| RF-1/2 | Nickname + codice amico persistente, nickname modificabile | input start + `metaGameStore` (merge tollerante) | manuale | ✅ |
| RF-3 | "Lancia sfida" a Game Over | overlay game over | manuale | ✅ |
| RF-4 | Codice incapsula setup + risultato + identità | `buildChallengeCode` + `challenge.test` round-trip | auto | ✅ |
| RF-5 | Link "apri e gioca" + codice testuale | **codice testuale** (clipboard); link → **deviazione** §4 | — | ⚠️ deviato |
| RF-6 | Incolla codice da schermata iniziale | `previewChallenge` | manuale | ✅ |
| RF-7 | Riepilogo "Sfida di X — Tavolo N" + potenziamenti | card riepilogo (passo 1 → 2) | manuale | ✅ |
| RF-8 | Replica esatta (seed + joker + bankroll) | `startChallenge` + `determinism.test` | auto+manuale | ✅ |
| RF-9 | Esito Vinta/Persa/Pareggio | `compareResult` (test) + overlay | auto+manuale | ✅ |
| RF-10 | Rilancia | bottone "RILANCIA" su game over | manuale | ✅ |
| RF-11 | Import → amico aggiunto/aggiornato | `previewChallenge` + `upsertFriend.test` | auto+manuale | ✅ |
| RF-12 | Pannello amici ordinato | `sortedFriends.test` + pannello | auto+manuale | ✅ |
| RF-13 | Rimuovere un amico | `removeFriend.test` + bottone × | auto+manuale | ✅ |
| RF-14 | Dati amici solo locali, no auto-update | localStorage, import esplicito | manuale | ✅ |
| RC-1/2/3 | Metrica tavolo, tie-break fiches | `compareResult` test (win/lose/tie) | auto | ✅ |
| CE-1 | Codice corrotto → messaggio | `challenge.test` checksum + UI msg | auto+manuale | ✅ |
| CE-2 | Versione incompatibile → messaggio | `challenge.test` version + UI "non compatibile" | auto+manuale | ✅ |
| CE-3 | Nickname non impostato | default "Anonimo" nel payload | manuale | ⚠️ vedi §4 |
| CE-4 | Import della propria sfida → consentito ma segnalato | guard `c.code === friendCode` + msg "(È la tua stessa sfida.)" | manuale | ✅ |

## 3. Smoke test manuale (flussi)

1. **Lancia sfida:** run → Game Over → "LANCIA SFIDA" copia il codice (toast
   "Codice sfida copiato"); primo lancio genera/persiste il friend code. ✅
2. **Accetta sfida:** incolla codice → riepilogo "Sfida di X — Tavolo N" +
   potenziamenti → GIOCA avvia lo stesso setup → Game Over mostra esito. ✅
3. **Stesso seed → stesse condizioni:** due accettazioni dello stesso codice
   propongono identica sequenza iniziale (coerente col test di replay). ✅
4. **Amici:** dopo l'import l'amico appare nel pannello ordinato; × lo rimuove. ✅
5. **Errori:** codice troncato → "Codice corrotto"; versione alta → "non
   compatibile"; nessun avvio in entrambi i casi. ✅
6. **Regressione gioco normale:** "PREMI PER INIZIARE" gioca un run con seed
   casuale, nessun riferimento a sfide. ✅

## 4. Deviazioni dalle specifiche (giustificate)

- **RF-5 / DI-3 — Link "apri e gioca".** Implementato **solo** il codice
  testuale copiabile; il **link** è rimandato. *Motivazione:* il codice testuale
  copre tutti i canali (anche quelli che rimuovono i link) ed è l'invariante
  testata; il link richiede gestione di URL/parametri all'avvio (routing) che
  aumenta la superficie senza cambiare la metrica né le condizioni di gioco.
  **Azione:** tracciato per una **CR futura** ("link condivisibile + lettura
  codice da URL"). Decisione concordata con lo stakeholder (scope v1).
- **CE-3 — Nickname non impostato.** Invece di **bloccare** il lancio, il payload
  usa il default **"Anonimo"** (il nickname resta modificabile prima/dopo).
  *Motivazione:* non interrompe il flusso; il nickname è cosmetico ai fini del
  confronto (la metrica è il tavolo). Comportamento accettato come variante UX.

## 5. Decisione

Build verde, suite verde, flussi manuali ok, deviazioni documentate e giustificate.
La CR-004 è **pronta per la UAT (fase 11)** col cliente. Allo `UAT OK` seguono
CAB (fase 12), piano di rilascio (13) e rilascio (14).
