# CR-004 — Post-implementation review (fase 15)

**Fase Change Management:** 15 — Post-implementation review
**Attori:** Analista, PM (+ AI)
**Esito:** ✅ rilascio **stabile**, nessun incident

> Dopo il rilascio si verifica che tutto regga. Per un'app statica senza backend
> non ci sono log applicativi/DB da analizzare: la verifica è sullo stato del
> deploy e sul comportamento client.

---

## 1. Stato post-rilascio

| Aspetto | Esito |
|---------|:-----:|
| Deploy di produzione (Vercel, `main` @ commit di rilascio) | ✅ attivo |
| Smoke test in produzione (vedi `verbale-rilascio.md`) | ✅ superato |
| Incident / errori segnalati | ✅ nessuno |
| Rollback eseguito | ✅ non necessario |
| Compatibilità salvataggi pre-CR-004 (localStorage) | ✅ nessuna perdita |

## 2. Difetti del ciclo (lezioni apprese)

- **DEF-1 — Tasti di gioco catturati nei campi di testo.** Un handler globale di
  tastiera senza guard sui campi editabili è un anti-pattern ricorrente quando si
  aggiungono input a una UI di gioco. *Lezione:* prevedere il guard
  `INPUT/TEXTAREA/contenteditable` ogni volta che si introduce un campo.
- **DEF-2 — Componente UI raggiungibile solo da uno stato transitorio.** Il
  pannello amici viveva solo nella schermata iniziale. *Lezione:* per gli
  elementi persistenti (RF di tipo "l'interfaccia mostra…") verificare la
  raggiungibilità in tutti gli stati rilevanti, non solo al primo avvio.

Entrambi rilevati in **UAT** (non in produzione) → il gate ha funzionato.

## 3. Metriche del change

- Effort: sviluppo in incrementi commit-abili (T1–T6 + 2 fix UAT).
- Test automatici: **131** (codec, determinismo/replay, amici, regole esistenti).
- Deviazioni accettate: RF-5 (link), CE-3 (nickname default).

## 4. Azioni di follow-up

- **CR futura:** link "apri e gioca" (RF-5) con lettura del codice da URL.
- **Manutenzione:** errore lint preesistente `set-state-in-effect` (fuori scope CR-004).

## 5. Esito

Rilascio **consolidato**. Si procede alla **fase 16** (documento finale
tecnico-funzionale) e alla **fase 17** (aggiornamento KB).
