# CR-004 — Q&A / Documento chiarimenti

**Change:** sfida asincrona tra giocatori + punteggi degli amici in UI
**Fase Change Management:** 5 — Q&A con cliente per chiarimenti
**Stakeholder / decisore:** (cliente)
**Stato:** ⏳ in attesa di decisione dello stakeholder
**Preparato da:** team di sviluppo (analisi assistita da AI, validata)

> Questo documento riporta allo stakeholder un **vincolo tecnico** emerso in
> validazione (Fase 2) e le **opzioni** per superarlo, con costi, complessità e
> compromessi, più una raccomandazione. Le specifiche **non** vengono prodotte
> finché non c'è una decisione.

---

## 1. Il vincolo, in parole semplici

Oggi il gioco gira **interamente sul dispositivo di ciascun giocatore** (nel suo
browser). Non esiste un "posto comune" dove finiscono i risultati: ogni partita
resta sul PC di chi l'ha giocata.

Conseguenza diretta: **un giocatore non può vedere il risultato di un altro**,
perché i due dispositivi non si parlano. Per realizzare la sfida ("uno gioca e
salva, l'altro vede e prova a batterlo") e i "punteggi degli amici" servono,
in alternativa:

- **un modo per consegnare a mano il risultato** da un giocatore all'altro
  (come spedirsi un messaggio con un codice), oppure
- una **bacheca condivisa online** (un server) dove i risultati vengono
  pubblicati e letti da tutti.

Tutto il resto (regole della sfida, interfaccia) dipende da questa scelta.

---

## 2. Opzioni per procedere

| # | Opzione | Costo infrastruttura | Complessità (stima) | In sintesi |
|---|---------|----------------------|---------------------|------------|
| **A** | **Codice/Link di sfida** (nessun server) | **€0** | Media (~3-5 gg) | Ci si scambia un codice; niente classifica automatica |
| **B** | **Bacheca online su servizio gratuito** | **€0** sul piano gratuito (a questa scala) | Alta (~1-2 sett.) | Classifica e amici "veri", aggiornati da soli |
| **C** | **Account completi + backend dedicato** | **~€25/mese** ricorrenti | Molto alta (settimane + manutenzione) | Login, profili, amici, anti-cheat lato server |

### Opzione A — Codice/Link di sfida (serverless)
- **Come funziona:** chi gioca genera un **codice (o link)** che contiene la
  sfida (la "partita" da rigiocare + il risultato da battere). Lo invia
  all'amico con qualunque mezzo (WhatsApp, email…). L'amico lo **importa**,
  rigioca **le stesse identiche condizioni** e prova a fare meglio. I "punteggi
  degli amici" mostrati sono gli ultimi che ti hanno condiviso (salvati sul tuo
  dispositivo).
- **Costo infrastruttura:** **€0** — nessun server, nessun database, nessun dato
  personale archiviato online.
- **Complessità:** media. Il grosso del lavoro è rendere la partita
  **riproducibile** (così l'amico gioca davvero le stesse carte) + l'interfaccia
  per esportare/importare i codici.
- **Compromessi:** **niente classifica live** (si aggiorna solo quando reimporti
  il codice dell'amico); i giocatori devono **scambiarsi il codice manualmente**.

### Opzione B — Bacheca online su servizio gratuito gestito
- **Come funziona:** una piccola "bacheca" online (es. Firebase, Upstash/Vercel
  KV, oppure tabelle dedicate in un database già esistente) dove i risultati
  vengono pubblicati. Gli amici li vedono **aggiornati automaticamente**.
- **Costo infrastruttura:** **€0 sul piano gratuito** per volumi da gioco hobby
  (i dati in gioco — nickname e punteggi — sono minuscoli). Costi solo a volumi
  elevati. *Nota: non serve necessariamente un nuovo progetto; spesso si possono
  aggiungere tabelle dedicate a un database esistente.*
- **Complessità:** alta. Richiede sviluppare il backend, un'**identità** dei
  giocatori, regole di **sicurezza/accesso** e gestione **privacy** (dati su
  cloud).
- **Compromessi:** classifica live e amici "veri", ma si introduce un componente
  da **mantenere** e la **gestione di dati personali** (nickname/punteggi online).

### Opzione C — Account completi + backend dedicato
- **Come funziona:** sistema di **login** (email/social), profili utente, lista
  amici, classifiche, controlli anti-cheat lato server.
- **Costo infrastruttura:** **~€25/mese** ricorrenti (es. piano a pagamento del
  servizio cloud) se servono risorse/progetti aggiuntivi.
- **Complessità:** molto alta (settimane di sviluppo + manutenzione continua).
- **Compromessi:** esperienza completa e robusta, ma **sproporzionata** rispetto
  alla portata del gioco, con costi ricorrenti e oneri privacy maggiori.

---

## 3. Raccomandazione

**Si raccomanda l'Opzione A (Codice/Link di sfida).**

Motivazione:
1. **Soddisfa il cuore del requisito** — "uno gioca e salva, l'altro vede e prova
   a batterlo, in asincrono" — in modo pieno.
2. **Costo zero** e **nessun impatto sull'infrastruttura esistente** (vincolo
   reale: i progetti gratuiti disponibili sono già occupati da sistemi in
   produzione).
3. **Nessun dato personale online** → zero oneri privacy/sicurezza server.
4. Il vero compromesso (classifica **live** degli amici) è un *nice-to-have*
   **rinviabile**: se in futuro servirà, si potrà aggiungere l'Opzione B come
   evoluzione, **senza buttare** il lavoro fatto.

In breve: **A adesso**, con **B come evoluzione futura** se nascerà l'esigenza di
una classifica che si aggiorna da sola.

---

## 4. Decisione richiesta allo stakeholder

1. **Quale opzione** approvi per procedere? (A / B / C)
2. Se **A o B**, due sotto-decisioni che servono per le specifiche funzionali:
   - **Equità del loadout:** una sfida è equa solo se i due giocatori partono
     dalla stessa base. Si gioca con **setup neutro** (nessun potenziamento del
     meta-shop) — *consigliato* — o replicando i potenziamenti di chi ha lanciato
     la sfida?
   - **Punteggi amici (solo se A):** conferma che mostrano gli **ultimi risultati
     importati** (non una classifica live).

> Alla conferma dello stakeholder, il flusso prosegue con la **Fase 3 —
> Specifiche funzionali** ([[Fase A — Analisi e specifiche]]). Nessuna specifica
> tecnica o sviluppo prima di allora ([[Principi guida]], [[Quality Gate]]).
