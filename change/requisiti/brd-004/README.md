# CR-004 — Indice del change (KB)

**Change:** sfida asincrona tra giocatori + punteggi degli amici
**Stato:** ✅ **RILASCIATO** in produzione (branch `main`) — ciclo chiuso
**Branch di lavoro:** `feature/cr-004-sfida-asincrona` → `dev` (UAT) → `main` (prod)

> Indice della documentazione del change, in ordine di flusso (fasi 1→17), per il
> riuso futuro. Vedi il flusso di Change Management documentato nella KB Obsidian.

## Documenti per fase

| Fase | Documento | Output |
|------|-----------|--------|
| 5 — Q&A | [`qa-chiarimenti.md`](qa-chiarimenti.md) | chiarimenti con lo stakeholder (Opzione A, metrica, equità, identità) |
| 3 — Spec funzionali | [`specifiche_funzionali.md`](specifiche_funzionali.md) | RF-1..14, casi limite, fuori scope |
| 4 — Spec tecniche | [`specifiche_tecniche.md`](specifiche_tecniche.md) | determinismo, codec, storage |
| 6 — Pianificazione | [`piano_di_progetto.md`](piano_di_progetto.md) | WBS T1–T8, percorso critico |
| 7 — Quality Gate spec | [`quality-gate.md`](quality-gate.md) | APPROVATO + condizioni C1–C3 |
| 9 — Analisi statica | [`analisi-statica.md`](analisi-statica.md) | lint/build/test + AI review |
| 10 — Test | [`test-report.md`](test-report.md) | matrice RF→test, smoke, deviazioni |
| 11 — UAT | [`verbale-uat.md`](verbale-uat.md) | ACCETTATO (DEF-1/DEF-2 risolti) |
| 12 — CAB | [`cab.md`](cab.md) | GO al rilascio |
| 13 — Rilascio/rollback | [`piano_ri_rilascio_rollback.md`](piano_ri_rilascio_rollback.md) | procedura + rollback |
| 14 — Rilascio | [`verbale-rilascio.md`](verbale-rilascio.md) | eseguito, smoke OK |
| 15 — Post-release | [`post-release.md`](post-release.md) | stabile, lezioni apprese |
| 16 — Doc finale | [`documento_finale_tecnico_funzionale.md`](documento_finale_tecnico_funzionale.md) | consolidamento + tracciabilità |

## Riuso (pattern riapplicabili)

- **Determinismo da seed** per qualunque feature che debba "rigiocare" condizioni
  identiche (sfide, replay, daily challenge).
- **Codice condivisibile** `PREFISSO<versione>.<base64url>.<checksum>`: schema
  serverless per trasportare stato verificabile (versione + integrità).
- **Guard tastiera** su campi editabili in UI di gioco (lezione DEF-1).

## Follow-up aperti

- CR futura: link "apri e gioca" (RF-5) con lettura codice da URL.
- Manutenzione: lint `set-state-in-effect` preesistente (fuori scope CR-004).
