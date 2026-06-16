# CR-003 — Tavoli speciali (Blind & Boss)

**Stato:** proposta · **Autore:** team Tetris Poker · **Area:** roguelike / run loop
**Dipende da:** sistema tavoli (CR difficoltà), meta-shop (CR-001), Casinò in-run

---

## 1. Obiettivo

Dare varietà e tensione al run rendendo ogni **tavolo** potenzialmente diverso.
Oggi i tavoli si distinguono solo per il target di fiches crescente e per la
velocità. Introduciamo **modificatori di tavolo** ("blind", ispirati a Balatro):
ogni tavolo può avere una regola speciale che cambia *come* si gioca quel round,
con una **ricompensa** proporzionata. Ogni N tavoli arriva un **Boss**: debuff
forte, premio grosso.

Questo **avvolge** il loop dei tavoli esistente: non rompe nulla, aggiunge un
livello di scelta/sorpresa tra un tavolo e l'altro.

---

## 2. Esperienza utente

1. Superato un tavolo (pagamento al Banco + Casinò), prima del tavolo successivo
   compare una schermata **"PROSSIMO TAVOLO"** che annuncia:
   - numero tavolo, tipo (Standard / Blind / **Boss**);
   - il **modificatore** attivo (nome + descrizione effetto);
   - la **ricompensa** per averlo superato;
   - il target di fiches richiesto.
2. Il giocatore preme **GIOCA** ed entra nel tavolo con quel modificatore attivo.
3. Durante il tavolo, un **badge in HUD** ricorda il modificatore attivo.
4. Superato il tavolo, la ricompensa viene erogata (fiches/perk) e si prosegue.

> Nota: la schermata pre-tavolo si integra con il momento Casinò già esistente
> (fine tavolo). Flusso: *tavolo superato → Casinò → Prossimo tavolo → gioca*.

---

## 3. Architettura

### 3.1 Selezione del modificatore
- Pool di modificatori definito in un catalogo tipizzato (`tableModifiers.ts`).
- Il modificatore del tavolo `n` è scelto **deterministicamente** da un seed di
  run (riproducibile), non a ogni render. Boss forzato ogni `BOSS_EVERY` tavoli
  (default **5**).
- Tavolo 1 sempre **Standard** (onboarding pulito).

### 3.2 Tipi
```ts
type TableKind = 'standard' | 'blind' | 'boss'

interface TableModifier {
  id: TableModifierId
  name: string
  desc: string          // effetto, mostrato in pre-tavolo + HUD
  kind: TableKind
  targetMult: number    // moltiplicatore sul target di fiches (es. 1.5)
  reward: TableReward   // cosa ottieni superandolo
  // hook applicati al run per quel tavolo:
  boardWidth?: number   // override larghezza board (es. 8)
  startSpeedMult?: number
  disableHold?: boolean
  disableGhost?: boolean
  scoreOnly?: HandCategory[] // solo queste mani pagano
}

interface TableReward {
  fiches?: number       // bonus fiches immediato
  freeJoker?: boolean   // un joker casuale gratis (entro il cap 5)
}
```

### 3.3 Integrazione (hook esistenti)
- `targetMult` → moltiplica `tableTarget(table)` all'inizio del tavolo.
- `startSpeedMult` → si compone con la difficoltà incrementale per-tavolo.
- `disableHold` → `holdSwap` no-op + UI hold disabilitata.
- `disableGhost` → la ghost piece non viene renderizzata.
- `scoreOnly` → in `resolveClear`, le categorie escluse pagano 0.
- `boardWidth` → la board del tavolo nasce con larghezza diversa.

---

## 4. Catalogo modificatori (da implementare)

| ID | Nome | Tipo | Effetto | Target | Ricompensa |
|----|------|------|---------|--------|------------|
| `STANDARD` | Tavolo Standard | standard | Nessun effetto | ×1.0 | — |
| `NARROW` | Tavolo Stretto | blind | Board a 8 colonne | ×1.0 | +120 fiches |
| `FAST` | Mano Calda | blind | Velocità di partenza ×1.5 | ×1.0 | +120 fiches |
| `NO_HOLD` | Niente Riserva | blind | Hold disabilitato | ×1.0 | +100 fiches |
| `NO_GHOST` | Al Buio | blind | Niente ghost piece | ×1.0 | +100 fiches |
| `FLUSH_TABLE` | Tavolo di Colore | blind | Solo le mani di colore pagano | ×0.8 | +180 fiches |
| `HIGH_STAKES` | Posta Alta | blind | Target +50% | ×1.5 | fiches doppie (reward 250) |
| `THE_HOUSE` | Il Banco | **boss** | Target +100% **e** velocità ×1.5 | ×2.0 | +400 fiches **+ joker gratis** |
| `COLD_DECK` | Mazzo Freddo | **boss** | Solo Tris+ pagano, board a 9 col | ×1.8 | +350 fiches **+ joker gratis** |

> I valori sono di prima passata: il CR include una fase di **bilanciamento**.

---

## 5. Vincoli & criteri di accettazione

- [ ] Tavolo 1 sempre Standard; Boss ogni `BOSS_EVERY` tavoli.
- [ ] Selezione **deterministica** dal seed (stesso seed → stessa sequenza).
- [ ] Schermata pre-tavolo mostra tipo, modificatore, effetto, ricompensa, target.
- [ ] Badge del modificatore visibile in HUD durante il tavolo.
- [ ] Ogni hook ha effetto osservabile (target, velocità, hold, ghost, scoring, width).
- [ ] La ricompensa viene erogata al superamento.
- [ ] **Regressione**: con solo `STANDARD` il gioco è identico a oggi.
- [ ] Logica pura (catalogo, selezione, applicazione hook) testata; UI presentazionale.

## 6. Punti di attenzione tecnici (onesti)

- **`boardWidth` variabile** è il punto più invasivo: oggi diversi calcoli
  assumono 10 colonne (es. spawn al centro, `--rows`/grid). Va reso parametrico
  → piccolo refactor mirato, da fare per primo e isolato.
- `scoreOnly` deve combinarsi con gli effetti poker del meta-shop (Cat.3) senza
  conflitti.
- La schermata pre-tavolo non deve sovrapporsi/contendere col Casinò: sequenza
  chiara, una cosa alla volta.

## 7. Fuori scope

- Nuove art/SFX (eventuali TODO nel codice).
- Scelta del tavolo / "skip blind per un tag" (Balatro) — eventuale CR futura.
- Prestige.

## 8. Deliverable

1. `tableModifiers.ts` — catalogo tipizzato + selezione deterministica.
2. Refactor `boardWidth` parametrico (isolato, con regressione verde).
3. `NextTableScreen` — schermata pre-tavolo (presentazionale).
4. Applicazione hook all'avvio tavolo + scoring + UI (hold/ghost/badge).
5. Erogazione ricompense.
6. Test della logica pura (selezione, target, scoring-only, reward).

## 9. Piano di lavoro (incrementale, uno step = un commit)

1. Catalogo + selezione deterministica + test (nessun effetto ancora).
2. Refactor `boardWidth` parametrico (regressione).
3. Schermata pre-tavolo + badge HUD (modificatore mostrato, non ancora attivo).
4. Hook "leggeri": `targetMult`, `startSpeedMult`, `disableHold`, `disableGhost`.
5. Hook scoring: `scoreOnly`.
6. Hook `boardWidth` + Boss + ricompense.
7. Bilanciamento.
