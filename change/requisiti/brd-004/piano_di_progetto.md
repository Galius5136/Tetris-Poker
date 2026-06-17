# CR-004 — Piano di progetto

**Change:** sfida asincrona tra giocatori + punteggi degli amici in UI
**Fase Change Management:** 6 — Pianificazione delle attività
**Attore:** PM (con AI)
**Stato:** 🟡 preliminare (le stime si consolidano dopo il Quality Gate, fase 7)
**Riferimenti:** `specifiche_funzionali.md` (v1.1), `specifiche_tecniche.md` (v1)

> Stime in **giorni-uomo (gu)**, indicative, su un team di **1 sviluppatore**.
> Sviluppo a piccoli incrementi commit-abili (coerente con la prassi del repo).

---

## 1. Obiettivo della pianificazione

Sequenziare le attività di CR-004, stimarne l'effort, evidenziare **dipendenze**
e **percorso critico**, e legare le milestone alle fasi del flusso (8→14).

## 2. Work Breakdown Structure (WBS)

| ID | Attività | Effort | Dipende da | Note |
|----|----------|:------:|------------|------|
| **T1** | `rng.ts` — PRNG deterministico seminabile + test | 0.5 gu | — | Fondamenta del determinismo |
| **T2** | Refactor determinismo run (deck shuffle, 7-bag, `rollSpecial`, `wildSuit`) + **test di replay** | 1.5 gu | T1 | ⚠️ percorso critico, rischio principale |
| **T3** | Identità + amici in `MetaState` (`nickname`, `friendCode`, `friends`) + `friends.ts` + test | 0.5 gu | — | Parallelizzabile con T1/T2 |
| **T4** | `challenge.ts` — encode/decode payload (versione + checksum) + `compareResult` + test | 1.0 gu | T1, T3 | Formato link + codice (DI-3) |
| **T5** | Modalità "run di sfida" (startRun da seed+loadout, esito, rilancia) | 1.0 gu | T2, T4 | Replica condizioni (RF-8) |
| **T6** | UI: "Lancia sfida" (Game Over), "Accetta sfida" + parse, **pannello Amici**, overlay esito | 1.5 gu | T3, T4, T5 | Tocchi `App.tsx` + nuovi componenti |
| **T7** | Casi limite/versionamento (CE-1/2/3/4) + integrità | 0.5 gu | T4, T6 | In parte già in T4/T6 |
| **T8** | QA, regressione (gioco normale invariato), rifinitura UX | 0.5 gu | T6, T7 | |

**Totale stimato:** ~**7 gu** (≈ 1.5 settimane), buffer escluso.

## 3. Dipendenze e percorso critico

```
T1 ──► T2 ──► T5 ──► T6 ──► T7 ──► T8
        ▲             ▲
T3 ─────┘────► T4 ────┘
```
- **Percorso critico:** T1 → T2 → T5 → T6 (→ T7 → T8). È guidato dal **refactor
  del determinismo**: nulla di "sfida" è davvero equo finché il run non è
  riproducibile.
- **Lavorabili in parallelo / early:** T3 (identità/amici) e parte di T4 possono
  partire subito, in attesa che T2 maturi.

## 4. Gantt (sequenza indicativa)

| Giorno | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|--------|---|---|---|---|---|---|---|
| T1 | █ | | | | | | |
| T3 | █ | | | | | | |
| T2 | | █ | █ | | | | |
| T4 | | | █ | █ | | | |
| T5 | | | | | █ | | |
| T6 | | | | | █ | █ | |
| T7/T8 | | | | | | | █ |

## 5. Milestone (allineate al flusso)

- **M0 — Specifiche approvate** — prerequisito: **Quality Gate (fase 7)** ok →
  branch dedicato. *Lo sviluppo (fase 8) non parte prima.*
- **M1 — Core pronto** — T1-T4 completati (determinismo + challenge engine) →
  **Static code analysis & AI review (fase 9)**.
- **M2 — Feature completa in DEV** — T5-T8 → **Test in DEV (fase 10)** con verbale.
- **M3 — Accettazione** — **UAT (fase 11)** → **CAB Go/No-Go (fase 12)**.
- **M4 — Rilascio** — **Piano rilascio+rollback (fase 13)** → **Rilascio (fase 14)**.

## 6. Rischi (dal documento tecnico) e mitigazioni

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| Refactor determinismo introduce regressioni nel gioco normale | Alto | RNG iniettato; **test di replay**; seed casuale di default → esperienza invariata |
| Codice sfida troppo lungo (loadout incluso) | Medio | Compressione del payload (valutazione in T4) |
| Incompatibilità tra versioni dei codici | Medio | Campo `v` + messaggio dedicato (CE-2) |
| Crescita `MetaState` / retro-compatibilità storage | Basso | `loadMeta` già tollerante a campi mancanti |

## 7. Assunzioni

- 1 sviluppatore, sviluppo incrementale con test sulla logica pura.
- Nessuna nuova dipendenza esterna pesante (PRNG e serializzazione fatti in casa).
- Hosting invariato (Vercel statico): il deploy resta un push (vedi fase 13).

---

> Prossimo passo da flusso: **Fase 7 — Quality Gate specifiche** (Analista +
> Sviluppatore) → approvazione di funzionali + tecniche su **branch dedicato**;
> poi **Fase 8 — Sviluppo**.
