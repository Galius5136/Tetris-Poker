# CR-004 — Verbale UAT (fase 11)

**Fase Change Management:** 11 — User Acceptance Test
**Attori:** Cliente/stakeholder (validatore) + Analista + AI
**Ambiente di test:** UAT = deploy Vercel del branch `dev` (≠ produzione)
**Esito:** ✅ **ACCETTATO** (con difetti rilevati e risolti durante la UAT)

> Unico touchpoint col cliente nella parte finale del flusso. Il validatore ha
> eseguito gli scenari; l'AI sintetizza esito e difetti.

---

## Scenari validati

| # | Scenario | Esito |
|---|----------|:-----:|
| 1 | Nickname → run → Game Over → **Lancia sfida** (codice copiato) | ✅ |
| 2 | Incolla codice → **riepilogo** → **Gioca** → **esito** a fine partita | ✅ |
| 3 | Amico appare nel **pannello punteggi** (testato in incognito) + **×** rimuove | ✅ |
| 4 | Codice troncato → "Codice corrotto", nessun avvio | ✅ |
| 5 | Run normale ("Premi per iniziare") invariato (regressione) | ✅ |

## Difetti rilevati in UAT (risolti)

- **DEF-1 — Input nickname.** Le lettere `d/x/p/c/m` non venivano digitate:
  l'handler globale della tastiera (comandi di gioco) le intercettava anche nei
  campi di testo. **Fix:** guard su `INPUT`/`TEXTAREA`/contenteditable
  (commit `dce8092`). Ritestato OK.
- **DEF-2 — Pannello amici non visibile.** Compariva solo nella schermata
  iniziale, irraggiungibile dopo la prima partita. **Fix:** pannello mostrato
  anche a Game Over (commit `a20d2cb`). **Ritestato OK in incognito** (l'amico
  appare importando il codice di un altro profilo; l'auto-sfida non aggiunge se
  stessi, CE-4).

## Deviazioni note (accettate)

- **RF-5** — link "apri e gioca" non in v1 (solo codice testuale), rimandato a CR
  futura.
- **CE-3** — nickname non impostato → default "Anonimo".

## Decisione

UAT **superata**: i difetti DEF-1/DEF-2 sono stati corretti su `feature`,
ripromossi su `dev` (ambiente UAT) e **ritestati con esito positivo**. Nessun
difetto bloccante residuo. La CR-004 procede alla **fase 12 (CAB)**.

Validatore (stakeholder) · Sintesi: AI · Data: 2026-06-17
