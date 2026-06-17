# CR-004 — Specifiche funzionali (v1, da validare)

**Change:** sfida asincrona tra giocatori + punteggi degli amici in UI
**Fase Change Management:** 3 — Generazione specifiche funzionali
**Stato:** 🟡 v1 da validare (Quality Gate specifiche, fase 7)
**Decisioni stakeholder recepite (vedi `qa-chiarimenti.md`):**
- Canale: **Opzione A — codice/link di sfida, serverless** (nessun backend).
- Metrica del confronto: **tavolo raggiunto**.
- Equità: la sfida **replica esattamente il setup di chi l'ha lanciata**, seed
  **e potenziamenti del meta-shop inclusi**.
- Identità: **nickname locale + codice amico**.
- Punteggi amici: **ultimi risultati importati** (cache locale, non live).

> Ambito: queste sono specifiche **funzionali** (cosa fa il sistema dal punto di
> vista dell'utente). Il "come" (formato del codice, determinismo, storage) è
> rimandato alle **specifiche tecniche** (fase 4).

---

## 1. Obiettivo

Permettere a due giocatori che **non sono online insieme** di sfidarsi: uno gioca
un run e ne **lancia la sfida**; l'altro la **accetta**, gioca **le stesse
identiche condizioni** e prova ad arrivare **più lontano** (tavolo più alto). In
più, l'interfaccia mostra **i punteggi degli amici**.

## 2. Attori

- **Sfidante** — il giocatore che lancia la sfida (ha appena giocato un run).
- **Avversario** — il giocatore che riceve e accetta la sfida.

(Stesso utente può essere entrambi in momenti diversi.)

## 3. Concetti / glossario

- **Nickname** — nome scelto dal giocatore, salvato sul suo dispositivo.
- **Codice amico** — identificativo del giocatore, incluso in ciò che condivide,
  usato per riconoscerlo nella lista amici.
- **Codice sfida** — testo (o link) che racchiude tutto il necessario per
  **riprodurre** il run dello sfidante: condizioni di gioco (seed) **+ i
  potenziamenti meta-shop attivi** + il **risultato** (tavolo raggiunto) +
  nickname e codice amico dello sfidante.
- **Risultato** — il **tavolo raggiunto** in un run (metrica di confronto).
- **Esito sfida** — Vinta / Persa / Pareggio rispetto al risultato dello sfidante.

## 4. Requisiti funzionali

### Identità
- **RF-1** — Al primo avvio (o da impostazioni) il giocatore imposta un
  **nickname**; gli viene assegnato un **codice amico** persistente sul
  dispositivo.
- **RF-2** — Il nickname è modificabile; il codice amico resta stabile.

### Lancio di una sfida
- **RF-3** — Al termine di un run (schermata Game Over), il giocatore può
  **"Lancia sfida"**.
- **RF-4** — Il sistema genera un **codice sfida** che incapsula: condizioni di
  gioco del run, **i potenziamenti meta-shop attivi dello sfidante**, il
  **tavolo raggiunto**, nickname e codice amico dello sfidante.
- **RF-5** — Il giocatore può **copiare** il codice/link e condividerlo con
  qualunque mezzo esterno (chat, email…). *Nessun invio avviene dall'app.*

### Accettazione di una sfida
- **RF-6** — Dalla schermata iniziale, il giocatore può **incollare un codice
  sfida** (o aprire il link).
- **RF-7** — Prima di giocare, vede un **riepilogo**: "Sfida di **\<nickname\>** —
  arrivato al **Tavolo N**", con eventuale indicazione dei potenziamenti attivi.
- **RF-8** — Accettando, parte un run che **replica esattamente le condizioni**
  dello sfidante: **stessa sequenza di pezzi/carte/modificatori dei tavoli** e
  **gli stessi potenziamenti meta-shop**. (Si replica il **setup**, non le mosse
  dello sfidante: l'avversario gioca le proprie mosse.)
- **RF-9** — Al termine, il sistema mostra l'**esito**: confronto tra il tavolo
  raggiunto dall'avversario e quello dello sfidante → **Vinta / Persa / Pareggio**.
- **RF-10** — Dopo l'esito, l'avversario può **rilanciare** (generare il proprio
  codice sfida sullo stesso setup) da rimandare allo sfidante.

### Punteggi degli amici (UI)
- **RF-11** — Quando il giocatore **importa** un codice sfida/risultato, lo
  sfidante viene aggiunto/aggiornato nella **lista amici** locale con il suo
  **ultimo risultato** (tavolo raggiunto).
- **RF-12** — L'interfaccia mostra un **pannello amici** con nickname e ultimo
  tavolo raggiunto di ciascuno, ordinati dal migliore.
- **RF-13** — Il giocatore può **rimuovere** un amico dalla lista.
- **RF-14** — I dati amici sono **solo locali** e si aggiornano **quando si
  reimporta** un loro codice (nessun aggiornamento automatico).

## 5. Flussi utente

**A) Lancia sfida**
1. Gioco un run → Game Over (Tavolo N).
2. "Lancia sfida" → ottengo il codice/link → lo copio → lo mando a un amico.

**B) Accetta sfida**
1. Ricevo un codice/link → schermata iniziale → "Accetta sfida" / incollo.
2. Vedo "Sfida di Mario — Tavolo 6" → Gioca.
3. Gioco lo stesso setup → Game Over (Tavolo M) → esito **Vinta/Persa/Pareggio**.
4. (Opzionale) Rilancio la mia sfida a Mario.

**C) Vedi amici**
- Dalla schermata iniziale apro il pannello amici → vedo nickname + miglior/
  ultimo tavolo di ognuno.

## 6. Regole di confronto

- **RC-1** — Metrica: **tavolo raggiunto**.
- **RC-2** — **Vinta** se l'avversario raggiunge un tavolo **strettamente
  superiore**; **Persa** se inferiore; **Pareggio** se uguale.
- **RC-3 (da validare)** — Spareggio a parità di tavolo: si propone come
  tie-break il **bankroll/progresso** del tavolo corrente. *Decisione da
  confermare allo stakeholder.*

## 7. Casi limite ed errori

- **CE-1** — Codice sfida **non valido/corrotto** → messaggio chiaro, nessun
  avvio.
- **CE-2** — Codice generato da una **versione del gioco incompatibile** (il
  setup non è più riproducibile) → messaggio "sfida non compatibile con questa
  versione".
- **CE-3** — Nickname non impostato al momento del lancio/import → richiesta di
  impostarlo.
- **CE-4** — Import della **propria** sfida → consentito (per test), ma segnalato.

## 8. Requisiti non funzionali (rilevanti per il funzionale)

- **NF-1** — **Nessun dato online**: tutto resta sul dispositivo; nessun account,
  nessun server.
- **NF-2** — Funziona **offline**.
- **NF-3 (limite accettato)** — Il risultato è **auto-dichiarato** dentro il
  codice: senza server **non è garantito anti-cheat** (un utente esperto può
  alterare un codice). Accettabile per una feature **social/amichevole**, non
  competitiva-ranked. Da accettare formalmente allo stakeholder.

## 9. Fuori scope (CR-004)

- Classifica **live** che si aggiorna da sola (richiederebbe backend → Opzione B,
  eventuale CR futura).
- Account/login, matchmaking, anti-cheat lato server.
- Replay/“ghost” della partita dello sfidante (si replica il setup, non le mosse).

## 10. Impatti noti per la fase tecnica (segnalati, non risolti qui)

- **Determinismo del run:** per "replicare esattamente le condizioni" il run deve
  essere **riproducibile** da ciò che il codice sfida contiene. Oggi alcune parti
  del run usano casualità non riproducibile. È un **prerequisito tecnico** della
  fase 4 (qui solo segnalato).
- **Trasporto dei potenziamenti:** il codice sfida deve **contenere** i
  potenziamenti meta-shop attivi dello sfidante (decisione stakeholder).
- **Versionamento del codice sfida:** serve un meccanismo per gestire
  l'incompatibilità tra versioni (vedi CE-2).

## 11. Domande aperte (residue, minori)

1. **RC-3**: tie-break a parità di tavolo (proposta: bankroll). Confermare.
2. **NF-3**: accettazione formale del limite anti-cheat.
3. Forma preferita della condivisione: **codice testuale**, **link**, o entrambi
   (impatta UX; dettaglio tecnico in fase 4).

---

> Alla validazione di queste specifiche (**fase 7 — Quality Gate**) seguono le
> **specifiche tecniche** (fase 4). Tracciabilità: requisito CR-004 → presenti RF.
