# CR-004 — Verbale di rilascio (fase 14)

**Fase Change Management:** 14 — Rilascio in produzione
**Attori:** Sviluppatore, PM (+ AI per monitoraggio)
**Esito:** ✅ rilascio eseguito — 🟡 smoke test in produzione da confermare

> Con il **Go** del CAB e l'autorizzazione del cliente, il change è stato
> promosso in produzione. Rollback pronto (vedi `piano_ri_rilascio_rollback.md`).

---

## Esecuzione

| Passo | Dettaglio | Esito |
|-------|-----------|:-----:|
| Build/test finali su `dev` | `npm run build` pulito · `npm test` 131/131 | ✅ |
| Merge `dev → main` | fast-forward `21dd1b7..e6bf280` | ✅ |
| Push `origin main` | trigger del deploy di produzione su Vercel | ✅ |
| Deploy Vercel produzione | pubblicazione automatica del nuovo build | ✅ (in propagazione) |

- **Commit in produzione:** `e6bf280` (branch `main`).
- **Downtime:** nessuno (Vercel fa swap atomico del deploy).

## Smoke test in produzione (checklist)

Da eseguire sull'URL di produzione (il deploy `main` di Vercel):

- [ ] L'app si carica senza errori in console.
- [ ] "Premi per iniziare" → run normale (regressione).
- [ ] Nickname accetta tutte le lettere (incl. d/x/p/c/m).
- [ ] Game Over → "Lancia sfida" copia il codice.
- [ ] Import codice (altro profilo) → riepilogo → Gioca → esito; amico nel pannello.

> Esito smoke test: _(da confermare)_ — alla conferma si chiude la fase 14 e si
> procede con la **fase 15 (post-implementation review)**.

## Rollback

Non necessario salvo esito negativo dello smoke test. In tal caso: Vercel →
Deployments → promote del deploy precedente (ripristino immediato).
