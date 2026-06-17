# CR-004 — Piano di rilascio e rollback (fase 13)

**Fase Change Management:** 13 — Piano di rilascio e rollback
**Attori:** Sviluppatore (+ AI)
**Stato:** pronto; esecuzione (fase 14) in attesa del **Go del cliente** (regola Git)

> Con il **Go** del CAB (`cab.md`) si prepara il rilascio in produzione, sempre
> con un **rollback** pronto. Il rollback non è opzionale: è ciò che rende il
> rilascio reversibile.

---

## 1. Oggetto del rilascio

- **Change:** CR-004 — sfida asincrona + punteggi amici.
- **Artefatto:** sito statico (Vite build) servito da Vercel.
- **Branch:** da `dev` (UAT, commit `c2f4076`) → `main` (produzione).
- **Niente DB / niente backend** → nessuna migrazione dati.

## 2. Procedura di rilascio (UAT → PROD)

1. Verifica finale su `dev`: `npm run build` pulito, `npm test` verde (131/131).
2. Merge **`dev → main`** in fast-forward:
   `git checkout main && git merge --ff-only dev`.
3. `git push origin main` → Vercel costruisce e pubblica il **deploy di
   produzione** in automatico.
4. **Smoke test in produzione** (vedi §4).

## 3. Piano di rollback

Il deploy precedente resta disponibile su Vercel: il rollback è **immediato** e
non richiede ricostruzione.

- **Rollback primario (Vercel):** dashboard → Deployments → ultimo deploy di
  produzione **precedente** alla CR-004 → **Promote to Production** (o
  "Rollback"). Ripristino in pochi secondi.
- **Rollback via Git (alternativo):** `git revert <merge>` su `main` + push →
  Vercel ripubblica lo stato precedente.
- **Dati utente:** nessun rischio. I campi nuovi in localStorage
  (`nickname`/`friendCode`/`friends`) sono additivi; tornando alla versione
  precedente vengono semplicemente ignorati (nessuna perdita di salvataggi).

**Criteri di rollback (trigger):** errore di caricamento del bundle in
produzione, regressione bloccante del gioco normale, o crash all'avvio.

## 4. Checklist di smoke test in produzione

- [ ] L'app si carica (nessun errore in console).
- [ ] "Premi per iniziare" avvia un run normale (regressione).
- [ ] Nickname accetta tutte le lettere (incl. d/x/p/c/m).
- [ ] Game Over → "Lancia sfida" copia un codice.
- [ ] Incolla codice (altro profilo) → riepilogo → Gioca → esito; amico nel pannello.

## 5. Note

- Il rilascio in produzione (fase 14) è **autorizzato dal cliente** (regola Git:
  push su `main` solo al suo via).
- Finestra di rilascio: nessun vincolo (app statica, nessun downtime atteso;
  Vercel fa swap atomico del deploy).
