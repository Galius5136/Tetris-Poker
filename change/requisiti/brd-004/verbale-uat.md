# CR-004 — UAT (fase 11) — piano da compilare

**Fase Change Management:** 11 — User Acceptance Test
**Attori:** Cliente/stakeholder (validatore) + Analista + AI
**Ambiente di test:** preview della build (URL Vercel del branch) oppure `npm run dev`
**Stato:** 🟡 **IN ATTESA DI ESITO DEL CLIENTE**

> Unico touchpoint col cliente nella parte finale del flusso: il validatore
> esegue gli scenari e segna l'esito. Solo a UAT superata si procede al CAB (12).

---

## Scenari da validare

| # | Scenario | Atteso | Esito | Note |
|---|----------|--------|:-----:|------|
| 1 | Nickname → run → Game Over → **Lancia sfida** | il codice viene copiato (toast di conferma) | ☐ | |
| 2 | Incolla un codice → **riepilogo** "Sfida di X — Tavolo N" → **Gioca** | parte un run con lo stesso setup; a fine partita appare l'**esito** | ☐ | |
| 3 | Stesso codice giocato due volte | sequenza iniziale identica (stesse condizioni) | ☐ | |
| 4 | Lista amici dopo un import | l'amico appare nel pannello; **×** lo rimuove | ☐ | |
| 5 | Codice troncato/incollato male | messaggio "Codice corrotto", nessun avvio | ☐ | |
| 6 | "Premi per iniziare" | run normale invariato (regressione) | ☐ | |

## Deviazioni note (da accettare o respingere in UAT)

- **RF-5** — niente link "apri e gioca" in v1, solo codice testuale (rimandato a
  CR futura). → Accettata? ☐
- **CE-3** — nickname non impostato → default "Anonimo". → Accettata? ☐

## Esito

- **Difetti rilevati:** _(da compilare)_
- **Decisione:** ☐ Accettato ☐ Accettato con riserva ☐ Respinto
- **Validatore (stakeholder):** _______________  **Data:** __________

A UAT **superata**, la sintesi dell'esito viene riportata qui (a cura dell'AI) e
la CR procede alla **fase 12 (CAB)**.
