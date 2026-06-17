# CR-004 — Analisi statica + AI code review

**Fase Change Management:** 9 — Analisi statica del codice / revisione assistita
**Attori:** Sviluppatore (lint/build/test), AI reviewer
**Oggetto:** implementazione T1–T6 su `feature/cr-004-sfida-asincrona`
**Esito:** ✅ **PROMOSSO** alla fase 10 (test) — nessun blocco introdotto dalla CR-004

> Revisione **interna** (il cliente non è revisore). Verifica che il codice
> sviluppato in fase 8 sia pulito, robusto e tracciabile rispetto alle specifiche
> prima dei test formali e della UAT.

---

## 1. Analisi statica (tooling)

| Controllo | Comando | Esito |
|-----------|---------|:-----:|
| Type-check + build | `npm run build` (`tsc -b && vite build`) | ✅ pulito |
| Test unitari | `npm test` | ✅ 131/131 |
| Lint | `npm run lint` (eslint) | ⚠️ 1 errore **preesistente**, 0 da CR-004 |

**Lint — dettaglio.** L'analisi ha inizialmente segnalato 3 problemi nel codice
toccato dalla CR-004, tutti risolti:
- `rng.ts` — `let a` mai riassegnato → `const` (`prefer-const`).
- `App.tsx` — `startRef.current`/`startedRef.current` assegnati durante il render
  → spostati in `useEffect` (`react-hooks/refs`).

Resta **1 errore preesistente** non legato alla CR-004:
`App.tsx` — `setMeta()` dentro l'effetto del joker-gratis di fine tavolo
(`react-hooks/set-state-in-effect`). È codice del run loop esistente, fuori dallo
scope di questa CR → annotato per un'eventuale CR di manutenzione, non corretto qui
(modificarlo rischierebbe una regressione non richiesta).

## 2. AI code review — esiti

| # | Area | Verifica | Esito |
|---|------|----------|:-----:|
| R1 | Determinismo (C1) | Tutto il percorso del run deriva dal seed; `Math.random` assente dal run loop; `shuffle/shuffledDeck` impuri ora **codice morto** (usati solo da un test del PRNG) | ✅ + test di replay |
| R2 | Robustezza codec | `decodeChallenge` valida formato/checksum/versione e non lancia mai (try/catch su b64 e JSON) | ✅ |
| R3 | Input non fidato | `jokers` di un codice arbitrario finiscono in `buildRunConfig` (`includes` → id ignoti ignorati) e `buildSpecials` (`UPGRADES[id]` letto solo per pezzi noti) → **nessun crash** su id sconosciuti | ✅ |
| R4 | Fairness | La sfida passa `c.bankroll`/`c.jokers`/`c.seed` diretti; i potenziamenti del giocatore sfidato vengono ignorati | ✅ |
| R5 | Lunghezza codice (C2) | 162 char (0 joker) – 263 char (5 joker): adatto al copia-incolla, **nessuna compressione necessaria** | ✅ |
| R6 | Regressione gioco normale (C3) | `startRun` azzera la sfida e usa `randomSeed()`; 131 test verdi, nessun cambiamento percepito senza sfide | ✅ |
| R7 | Persistenza | `nickname`/`friendCode`/`friends` con merge tollerante in `loadMeta` (default su campi mancanti) → compatibile con salvataggi pre-CR-004 | ✅ |

## 3. Note / rischi residui (accettati)

- **Integrità del codice sfida.** Il checksum FNV-1a rileva **corruzioni
  accidentali** (copia-incolla parziale), non manomissioni volontarie: un giocatore
  può fabbricare un payload. Coerente con il modello di minaccia dell'Opzione A
  (sfida amichevole, nessun server, nessuna classifica ufficiale). Anti-cheat
  lato server resta fuori scope (vedi §9 funzionali).
- **Errore lint preesistente** (R-manutenzione): da indirizzare separatamente.

## 4. Decisione

Codice **promosso alla fase 10 (test formali)**. Le condizioni del Quality Gate
sono soddisfatte: **C1** (test di replay presente), **C2** (lunghezza codice
verificata, ok), **C3** (regressione del gioco normale mantenuta).

Firmato (revisione interna): Sviluppatore, AI reviewer.
