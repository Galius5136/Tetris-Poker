# CR-004 — Quality Gate sulle specifiche

**Fase Change Management:** 7 — Quality Gate di specifiche
**Attori (revisori):** Analista, Sviluppatore
**Oggetto:** `specifiche_funzionali.md` (v1.1) + `specifiche_tecniche.md` (v1)
**Esito:** ✅ **APPROVATO** → branch dedicato `feature/cr-004-sfida-asincrona`

> Validazione **interna** (il cliente non è revisore di questa fase). Output del
> gate: specifiche approvate su **branch Git dedicato**, da cui parte lo sviluppo
> (fase 8).

---

## Checklist di revisione

| # | Criterio | Esito | Note |
|---|----------|:-----:|------|
| 1 | Le specifiche funzionali coprono il requisito del cliente | ✅ | RF-1..14 mappano la sfida asincrona + amici |
| 2 | Decisioni del cliente recepite (Opzione A, metrica tavolo, loadout replicato, identità) | ✅ | Vedi intestazione `specifiche_funzionali.md` |
| 3 | Domande residue risolte | ✅ | DI-1/2/3 (tie-break, anti-cheat, formato condivisione) |
| 4 | Coerenza funzionale ↔ tecnica (ogni RF ha copertura) | ✅ | Tabella di tracciabilità §11 tecniche |
| 5 | Vincoli rispettati (serverless, nessun dato online, offline) | ✅ | NF-1/2/3 + §8 tecniche |
| 6 | Testabilità definita | ✅ | Superficie di test §9 tecniche (incl. test di replay) |
| 7 | Rischi identificati con mitigazioni | ✅ | §10 tecniche + §6 piano |
| 8 | Pianificazione/effort presenti | ✅ | `piano_di_progetto.md` (WBS, percorso critico) |
| 9 | Fuori scope chiaro | ✅ | §9 funzionali (classifica live, account, anti-cheat server) |

## Condizioni / raccomandazioni per lo sviluppo

- **C1 (vincolante):** il **test di replay** del determinismo (stesso seed →
  stesse condizioni) è parte del Definition of Done di T2.
- **C2:** verificare in implementazione la **lunghezza del codice sfida** col
  loadout incluso; se eccessiva, applicare compressione (T4).
- **C3:** mantenere la **regressione** del gioco normale (seed casuale di
  default): nessun cambiamento percepito senza sfide.

## Decisione

Specifiche **funzionali e tecniche APPROVATE**. Si apre il branch
**`feature/cr-004-sfida-asincrona`**; lo sviluppo (fase 8) procede in incrementi
commit-abili secondo la WBS del piano. Le condizioni C1-C3 sono parte dei criteri
di accettazione dello sviluppo.

Firmato (gate interno): Analista, Sviluppatore.
