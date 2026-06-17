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

## 4. Catalogo modificatori (valori implementati, post-bilanciamento)

| ID | Nome | Tipo | Effetto | Target | Ricompensa |
|----|------|------|---------|--------|------------|
| `STANDARD` | Tavolo Standard | standard | Nessun effetto | ×1.0 | — |
| `NARROW` | Tavolo Stretto | blind | Board a 8 colonne | ×1.0 | +120 fiches |
| `FAST` | Mano Calda | blind | Velocità di partenza ×1.5 | ×1.0 | +120 fiches |
| `NO_HOLD` | Niente Riserva | blind | Hold disabilitato | ×1.0 | +100 fiches |
| `NO_GHOST` | Al Buio | blind | Niente ghost piece | ×1.0 | +100 fiches |
| `FLUSH_TABLE` | Tavolo di Colore | blind | Solo le mani di colore pagano | ×0.65 | +220 fiches |
| `HIGH_STAKES` | Posta Alta | blind | Target +50% | ×1.5 | +250 fiches |
| `THE_HOUSE` | Il Banco | **boss** | Target +70% **e** velocità ×1.5 | ×1.7 | +400 fiches **+ joker gratis** |
| `COLD_DECK` | Mazzo Freddo | **boss** | Solo doppia coppia+ paga, board a 9 col | ×1.5 | +350 fiches **+ joker gratis** |

> Valori aggiornati dopo la passata di bilanciamento (vedi §10). La crescita base
> del target per tavolo è stata ammorbidita a **×1.55** (era ×1.7) perché si
> compone già con la velocità ×1.2/tavolo e coi modificatori.

---

## 5. Vincoli & criteri di accettazione

- [x] Tavolo 1 sempre Standard; Boss ogni `BOSS_EVERY` (= 5) tavoli.
- [x] Selezione **deterministica** dal seed (stesso seed → stessa sequenza).
- [x] Annuncio pre-tavolo con tipo, modificatore, effetto, ricompensa, target → *erogato nella schermata Casinò di fine tavolo (vedi §10).*
- [x] Badge del modificatore visibile in HUD durante il tavolo.
- [x] Ogni hook ha effetto osservabile (target, velocità, hold, ghost, scoring, width).
- [x] La ricompensa viene erogata al superamento (fiches + joker gratis Boss).
- [x] **Regressione**: con solo `STANDARD` il gioco è identico a oggi.
- [x] Logica pura (catalogo, selezione) testata; UI presentazionale.

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

1. [x] `tableModifiers.ts` — catalogo tipizzato + selezione deterministica.
2. [x] `boardWidth` parametrico (vedi §10: l'engine era già parametrico).
3. [~] Annuncio pre-tavolo presentazionale → reso nell'overlay Casinò, non come
   componente `NextTableScreen` separato (vedi §10, motivazione).
4. [x] Applicazione hook all'avvio tavolo + scoring + UI (hold/ghost/badge).
5. [x] Erogazione ricompense (fiches + joker gratis).
6. [x] Test della logica pura (selezione, determinismo, cadenza Boss, catalogo).

## 9. Piano di lavoro (incrementale, uno step = un commit)

1. [x] Catalogo + selezione deterministica + test.
2. [x] `boardWidth` parametrico.
3. [x] Annuncio pre-tavolo + badge HUD.
4. [x] Hook "leggeri": `targetMult`, `startSpeedMult`, `disableHold`, `disableGhost`.
5. [x] Hook scoring: `scoreOnly`.
6. [x] Hook `boardWidth` + Boss + ricompense.
7. [x] Bilanciamento (prima passata).

---

## 10. Esito implementazione

**Stato: IMPLEMENTATA** · ~109 test verdi · in produzione (Vercel).
File chiave: `src/game/tableModifiers.ts`, integrazione in `src/App.tsx`,
stile in `src/App.css`.

### Cosa è stato fatto
Tutti i criteri di accettazione (§5) sono soddisfatti: catalogo dei 9
modificatori, selezione deterministica dal seed di run (`meta.shopSeed`), Tavolo 1
sempre Standard, Boss ogni 5 tavoli, badge in HUD, annuncio del prossimo tavolo,
ricompense (fiches + joker gratis), hook su target/larghezza board/velocità/
hold/ghost/scoring. Regressione preservata: senza modificatori il gioco è
identico.

### Scostamenti rispetto alla proposta (motivati)

1. **Annuncio pre-tavolo integrato nel Casinò, non come schermata separata
   (`NextTableScreen`).**
   *Motivazione:* la §2 di questa stessa CR prevedeva esplicitamente che la
   pre-tavolo si **integrasse nel momento Casinò già esistente** (flusso
   "tavolo superato → Casinò → prossimo tavolo → gioca"). Una schermata a sé
   avrebbe aggiunto un overlay in più nello stesso istante, contro l'obiettivo
   "una cosa alla volta" (§6). L'annuncio (tipo, effetto, obiettivo, ricompensa)
   è quindi reso **dentro** l'overlay di fine tavolo. Scelta di prodotto, non
   funzionalità mancante.

2. **`boardWidth`: nessun refactor "pesante".**
   *Motivazione:* l'engine era già parametrico su `board[0].length` (spawn,
   collisioni, render, grid CSS). È bastato creare la board del tavolo con la
   larghezza del modificatore. Il punto di attenzione §6 si è rivelato meno
   invasivo del previsto → deliverable raggiunto senza refactor dedicato.

3. **Valori di bilanciamento aggiornati** (vedi §4): `FLUSH_TABLE` ×0.65 / +220,
   `THE_HOUSE` ×1.7, `COLD_DECK` ×1.5 e "doppia coppia+", crescita base target
   ×1.55. *Motivazione:* prima passata di tuning per evitare picchi ingiocabili
   (boss + velocità combinati, colori troppo rari). Da validare col playtest.

### Aperto
- Bilanciamento fine (richiede playtest).
- Fuori scope come da §7 (skip-blind-per-tag, SFX, prestige).
