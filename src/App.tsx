import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import './App.css'
import { createEmptyBoard, clearFullRows } from './game/board'
import type { Board, FilledCell } from './game/board'
import { mergePiece, pieceCells } from './game/tetromino'
import type { Piece, TetrominoType } from './game/tetromino'
import { collides, tryMove, tryRotate, dropPosition } from './game/engine'
import { drawSpec, makePiece, type PieceSpec } from './game/spawn'
import { shuffle, fullDeck, buildDeckTemplate, type Deck } from './game/deck'
import { evalRow, HAND_POINTS, type HandResult } from './game/poker'
import { SUITS, type Suit } from './game/cards'
import { levelFromLines, tickMs, START_LEVEL } from './game/levels'
import { tableTarget } from './game/run'
import {
  REEL_CARDS,
  SLOT_COST,
  ROULETTE_COST,
  ROULETTE_SLOTS,
  rouletteIndexAt,
  BASE_MODIFIERS,
  applyModifiers,
  evalThreeCardHand,
  type Modifiers,
} from './game/perks'
import { CardFace } from './ui/CardFace'
import { MiniGrid } from './ui/MiniGrid'
import { loadMeta, saveMeta, bankRun, type MetaState } from './meta/metaGameStore'
import { selectShop, buyUpgrade } from './meta/shop'
import { ShopScreen } from './meta/ShopScreen'
import type { Upgrade, UpgradeId } from './meta/upgrades'
import {
  buildRunConfig,
  handPointsWithConfig,
  startingBankroll,
  STREAK_BONUS_MULT,
  NEUTRAL_CONFIG,
  type RunConfig,
} from './meta/runConfig'

interface GameState {
  board: Board
  piece: Piece
  next: PieceSpec
  hold: PieceSpec | null
  canHold: boolean
  bag: TetrominoType[]
  deck: Deck
  lines: number
  progress: number // fiches del tavolo corrente (riparte da 0 ogni tavolo)
  bankroll: number // valuta accumulata, spesa ai minigiochi
  scoreKey: number // ri-triggera l'animazione del bankroll
  level: number
  best: HandResult | null
  flashRows: number[] | null // righe piene in fase di lampeggio
  grounded: boolean // il pezzo è appoggiato (lock delay in corso)
  lockKey: number // bumpato a ogni mossa per resettare il timer di lock
  table: number // tavolo corrente del run
  target: number // fiches necessarie per superare il tavolo
  paused: boolean // Casinò aperto (gioco in pausa)
  levelEnd: boolean // pausa obbligatoria di fine tavolo (minigiochi abilitati)
  game: 'menu' | 'slot' | 'roulette' // schermata del Casinò
  reels: number[] // slot: posizione dei 3 rulli (indici in REEL_CARDS)
  stopped: number // slot: quanti rulli sono già fermi (0..3)
  wheelAngle: number // roulette: angolo di rotazione
  wheelStopped: boolean // roulette: ruota ferma (perk assegnato)
  mods: Modifiers // potenziamenti accumulati dai perk (cumulativi)
  config: RunConfig // effetti dei joker equipaggiati, fissati all'avvio del run
  deckTemplate: Deck // mazzo-modello del run (composizione Cat.4)
  streakPending: boolean // STREAK_BONUS: +15% in attesa per la prossima mano
  wildSuit: Suit | null // FLUSH_WILD_SUIT: seme jolly scelto a inizio run
  doubleDownAvail: boolean // DOUBLE_DOWN: ancora disponibile (una volta per run)
  doubleDownArmed: boolean // DOUBLE_DOWN: armato per la prossima mano
  lastHandCat: number | null // categoria dell'ultima mano (per il confronto Double Down)
  started: boolean
  gameOver: boolean
}

const INITIAL_REELS = [0, 3, 6] // rulli sfasati: allineare è una sfida di tempismo

function newGame(
  started = false,
  config: RunConfig = NEUTRAL_CONFIG,
  startBankroll = 0,
  wildSuit: Suit | null = null,
  deckTemplate: Deck = fullDeck(),
): GameState {
  const board = createEmptyBoard()
  const width = board[0].length
  const first = drawSpec([], shuffle(deckTemplate), deckTemplate)
  const second = drawSpec(first.bag, first.deck, deckTemplate)
  return {
    board,
    piece: makePiece(first.spec, width),
    next: second.spec,
    hold: null,
    canHold: true,
    bag: second.bag,
    deck: second.deck,
    lines: 0,
    progress: 0,
    bankroll: startBankroll,
    scoreKey: 0,
    level: START_LEVEL,
    best: null,
    flashRows: null,
    grounded: false,
    lockKey: 0,
    table: 1,
    target: tableTarget(1),
    paused: false,
    levelEnd: false,
    game: 'menu',
    reels: INITIAL_REELS,
    stopped: 0,
    wheelAngle: 0,
    wheelStopped: false,
    mods: BASE_MODIFIERS,
    config,
    deckTemplate,
    streakPending: false,
    wildSuit,
    doubleDownAvail: config.doubleDown,
    doubleDownArmed: false,
    lastHandCat: null,
    started,
    gameOver: false,
  }
}

// --- Casinò (a richiesta, in pausa) ---

// È in corso un giro pagato (slot o roulette) → non si può chiudere.
function midRound(s: GameState): boolean {
  return (
    (s.game === 'slot' && s.stopped < 3) ||
    (s.game === 'roulette' && !s.wheelStopped)
  )
}

// Apre il Casinò a richiesta, mettendo in pausa il gioco.
function openCasino(state: GameState): GameState {
  if (!state.started || state.gameOver || state.flashRows || state.paused) {
    return state
  }
  return { ...state, paused: true, levelEnd: false, game: 'menu' }
}

// Chiude il Casinò / prosegue dal fine tavolo (non a metà di un giro pagato).
function closeCasino(state: GameState): GameState {
  if (midRound(state)) return state
  return { ...state, paused: false, levelEnd: false, game: 'menu' }
}

// Torna alla scelta del gioco dopo un giro concluso.
function backToMenu(state: GameState): GameState {
  if (midRound(state)) return state
  return { ...state, game: 'menu' }
}

// Avvia la slot del poker: costa SLOT_COST dal bankroll.
function playSlot(state: GameState): GameState {
  if (state.bankroll < SLOT_COST) return state
  return {
    ...state,
    game: 'slot',
    stopped: 0,
    reels: INITIAL_REELS,
    bankroll: state.bankroll - SLOT_COST,
  }
}

// Ferma il prossimo rullo (skill, no RNG). Al terzo applica la mano di poker.
function stopReel(state: GameState): GameState {
  if (state.game !== 'slot' || state.stopped >= 3) return state
  const stopped = state.stopped + 1
  if (stopped < 3) return { ...state, stopped }
  const outcome = evalThreeCardHand(state.reels.map((i) => REEL_CARDS[i]))
  return { ...state, stopped, mods: outcome.apply(state.mods) }
}

// Avvia la roulette: costa ROULETTE_COST dal bankroll.
function playRoulette(state: GameState): GameState {
  if (state.bankroll < ROULETTE_COST) return state
  return {
    ...state,
    game: 'roulette',
    wheelAngle: 0,
    wheelStopped: false,
    bankroll: state.bankroll - ROULETTE_COST,
  }
}

// Ferma la ruota (skill, no RNG) e applica il perk del settore sotto il puntatore.
function stopWheel(state: GameState): GameState {
  if (state.game !== 'roulette' || state.wheelStopped) return state
  const idx = rouletteIndexAt(state.wheelAngle)
  return { ...state, wheelStopped: true, mods: ROULETTE_SLOTS[idx].apply(state.mods) }
}

const LOCK_DELAY_MS = 500

// Dopo una mossa/rotazione: se il pezzo può ancora scendere non è appoggiato;
// altrimenti resta appoggiato ma resetta il timer di lock (lockKey++).
function afterAction(state: GameState): GameState {
  if (tryMove(state.board, state.piece, 0, 1)) {
    return { ...state, grounded: false }
  }
  return { ...state, grounded: true, lockKey: state.lockKey + 1 }
}

function isBetter(a: HandResult, b: HandResult | null): boolean {
  return !b || a.category > b.category || (a.category === b.category && a.tie > b.tie)
}

// Genera il prossimo pezzo da next/bag/deck su una board data.
function spawnNext(state: GameState, board: Board): GameState {
  const piece = makePiece(state.next, board[0].length)
  const drawn = drawSpec(state.bag, state.deck, state.deckTemplate)
  return {
    ...state,
    board,
    piece,
    next: drawn.spec,
    bag: drawn.bag,
    deck: drawn.deck,
    canHold: true,
    grounded: false,
    gameOver: collides(board, piece),
  }
}

// Blocca il `piece`. Se completa righe, entra in fase di lampeggio (la pulizia
// e il punteggio avvengono dopo, in resolveClear). Altrimenti spawn immediato.
function lockPiece(state: GameState, piece: Piece): GameState {
  const merged = mergePiece(state.board, piece)
  const fullRows = merged.reduce<number[]>(
    (acc, row, i) => (row.every((cell) => cell !== null) ? [...acc, i] : acc),
    [],
  )
  if (fullRows.length === 0) {
    return spawnNext(state, merged)
  }
  return { ...state, board: merged, flashRows: fullRows, canHold: true, grounded: false }
}

// Fine del lampeggio: valuta le mani, assegna i punti, elimina le righe, spawn.
function resolveClear(state: GameState): GameState {
  const rows = state.flashRows
  if (!rows) return state

  const cfg = state.config
  // Cat.3: regole poker dai joker (5 uguali, scala con buco, seme jolly).
  const evalOpts = {
    fiveOfAKind: cfg.fiveOfAKind,
    straightGap: cfg.straightGap,
    wildSuit: state.wildSuit,
  }
  let clearBest: HandResult | null = null
  let gained = 0
  for (const r of rows) {
    const hand = evalRow((state.board[r] as FilledCell[]).map((c) => c.card), evalOpts)
    // Cat.1 per-categoria: PAIR_GRINDER ×3, SUIT_PREMIUM ×2, POKER_KICKER (carta alta)
    gained += handPointsWithConfig(hand.category, HAND_POINTS[hand.category], cfg)
    if (isBetter(hand, clearBest)) clearBest = hand
  }
  if (rows.length > 1) gained *= rows.length // bonus multi-riga
  gained = Math.round(gained * cfg.handPayoutMult) // HIGH_ROLLER
  if (state.streakPending) gained = Math.round(gained * STREAK_BONUS_MULT) // STREAK_BONUS

  // DOUBLE_DOWN: se armato, raddoppia se la mano non è peggiore della precedente;
  // altrimenti niente raddoppio e penalità -10% sul progresso. Si consuma.
  let doubleDownArmed = state.doubleDownArmed
  let doubleDownAvail = state.doubleDownAvail
  let penalty = false
  if (state.doubleDownArmed && clearBest) {
    const worse = state.lastHandCat !== null && clearBest.category < state.lastHandCat
    if (worse) penalty = true
    else gained *= 2
    doubleDownArmed = false
    doubleDownAvail = false
  }

  gained = applyModifiers(gained, state.mods) // perk casinò: moltiplicatore + bonus

  // STREAK_BONUS: pulire 3+ righe arma il +15% per la PROSSIMA mano.
  const streakPending = cfg.streakBonus && rows.length >= 3

  const { board, cleared } = clearFullRows(state.board)
  const lines = state.lines + cleared
  const rawProgress = state.progress + gained
  const progress = penalty ? Math.floor(rawProgress * 0.9) : rawProgress

  const base = {
    ...state,
    flashRows: null,
    streakPending,
    doubleDownArmed,
    doubleDownAvail,
    lastHandCat: clearBest ? clearBest.category : state.lastHandCat,
    lines,
    level: levelFromLines(lines),
    best: clearBest,
  }

  // Tavolo superato: le fiches del tavolo entrano nel bankroll, la progressione
  // riparte da 0, il gioco si FERMA e si apre il Casinò (minigiochi).
  if (progress >= state.target) {
    const table = state.table + 1
    return spawnNext(
      {
        ...base,
        progress: 0,
        bankroll: state.bankroll + progress,
        scoreKey: state.scoreKey + 1,
        table,
        target: tableTarget(table),
        paused: true,
        levelEnd: true,
        game: 'menu',
        stopped: 0,
        wheelStopped: false,
      },
      board,
    )
  }

  return spawnNext({ ...base, progress }, board)
}

// Tick di gravità: scende di una riga; se non può, segna "appoggiato"
// (il blocco vero avviene dopo il lock delay, vedi effetto in App).
function step(state: GameState): GameState {
  if (!state.started || state.gameOver || state.flashRows || state.paused) return state
  const moved = tryMove(state.board, state.piece, 0, 1)
  if (moved) return { ...state, piece: moved, grounded: false }
  return state.grounded ? state : { ...state, grounded: true }
}

function move(state: GameState, dx: number, dy: number): GameState {
  const moved = tryMove(state.board, state.piece, dx, dy)
  return moved ? afterAction({ ...state, piece: moved }) : state
}

function softDrop(state: GameState): GameState {
  const moved = tryMove(state.board, state.piece, 0, 1)
  if (!moved) return afterAction(state)
  return afterAction({ ...state, piece: moved, progress: state.progress + 1 })
}

function rotate(state: GameState): GameState {
  const rotated = tryRotate(state.board, state.piece)
  return rotated ? afterAction({ ...state, piece: rotated }) : state
}

function hardDrop(state: GameState): GameState {
  return lockPiece(state, dropPosition(state.board, state.piece))
}

function holdSwap(state: GameState): GameState {
  if (!state.canHold) return state
  const width = state.board[0].length
  const current: PieceSpec = { type: state.piece.type, cards: state.piece.cards }
  if (state.hold) {
    const piece = makePiece(state.hold, width)
    return {
      ...state,
      piece,
      hold: current,
      canHold: false,
      grounded: false,
      gameOver: collides(state.board, piece),
    }
  }
  const drawn = drawSpec(state.bag, state.deck, state.deckTemplate)
  const piece = makePiece(state.next, width)
  return {
    ...state,
    piece,
    next: drawn.spec,
    bag: drawn.bag,
    deck: drawn.deck,
    hold: current,
    canHold: false,
    grounded: false,
    gameOver: collides(state.board, piece),
  }
}

const HANDLED = [
  'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp',
  'x', 'X', ' ', 'c', 'C', 'Enter', 'p', 'P', 'Escape', 'd', 'D',
]

// Movimento con auto-repeat gestito dal gioco (DAS/ARR), non dal SO.
const DAS_MS = 160 // ritardo prima dell'auto-repeat
const ARR_MS = 40 // intervallo dell'auto-repeat
const DIRECTIONS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown'])

function reduceKey(s: GameState, k: string): GameState {
  // L'avvio del run è gestito da App (serve il meta per i joker), non qui.
  if (!s.started) return s
  if (s.gameOver) return s
  if (k === 'p' || k === 'P' || k === 'Escape') {
    return s.paused ? closeCasino(s) : openCasino(s)
  }
  if (s.paused) {
    if (k !== 'Enter' && k !== ' ') return s
    if (s.game === 'slot') return s.stopped < 3 ? stopReel(s) : backToMenu(s)
    if (s.game === 'roulette') return !s.wheelStopped ? stopWheel(s) : backToMenu(s)
    return s // menu: scelta con i bottoni
  }
  if (s.flashRows) return s
  switch (k) {
    case 'ArrowLeft': return move(s, -1, 0)
    case 'ArrowRight': return move(s, 1, 0)
    case 'ArrowDown': return softDrop(s)
    case 'ArrowUp':
    case 'x':
    case 'X': return rotate(s)
    case ' ': return hardDrop(s)
    case 'c':
    case 'C': return holdSwap(s)
    case 'd':
    case 'D':
      // DOUBLE_DOWN: arma il raddoppio per la prossima mano (una volta per run).
      return s.doubleDownAvail && !s.doubleDownArmed
        ? { ...s, doubleDownArmed: true }
        : s
    default: return s
  }
}

function Panel({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`panel ${className ?? ''}`}>
      <div className="panel-head">
        <span className="panel-label">{label}</span>
        {hint && <span className="panel-hint">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function App() {
  const [state, setState] = useState<GameState>(() => newGame())
  const [meta, setMeta] = useState<MetaState>(() => loadMeta())
  const bankedRef = useRef(false)
  // Ref letti dall'handler tastiera (che ha deps []), aggiornati a ogni render.
  const startRef = useRef<() => void>(() => {})
  const startedRef = useRef(false)
  // Vetrina dello shop: null = chiuso; array = aperto (snapshot stabile).
  const [shopOffers, setShopOffers] = useState<Upgrade[] | null>(null)

  // A fine run: il valore finale del run (bankroll già da parte + il progresso
  // del tavolo in corso) confluisce nel totale persistente, una sola volta per
  // run. Non tocca il run loop.
  useEffect(() => {
    if (state.gameOver && !bankedRef.current) {
      bankedRef.current = true
      const runWorth = state.bankroll + state.progress
      setMeta((m) => {
        const next = bankRun(m, runWorth)
        saveMeta(next)
        return next
      })
    }
  }, [state.gameOver, state.bankroll, state.progress])

  // Gravità: velocità in base al livello, solo a gioco avviato.
  useEffect(() => {
    if (!state.started || state.gameOver) return
    const id = setInterval(() => setState(step), tickMs(state.level))
    return () => clearInterval(id)
  }, [state.started, state.gameOver, state.level])

  // Fine lampeggio righe → pulizia + punteggio + spawn.
  useEffect(() => {
    if (!state.flashRows) return
    const id = setTimeout(() => setState(resolveClear), 440)
    return () => clearTimeout(id)
  }, [state.flashRows])

  // Rulli della slot: quelli non ancora fermati scorrono a velocità costante.
  useEffect(() => {
    if (state.game !== 'slot' || state.stopped >= 3) return
    const id = setInterval(() => {
      setState((s) => {
        if (s.game !== 'slot' || s.stopped >= 3) return s
        const reels = s.reels.map((pos, i) =>
          i >= s.stopped ? (pos + 1) % REEL_CARDS.length : pos,
        )
        return { ...s, reels }
      })
    }, 110)
    return () => clearInterval(id)
  }, [state.game, state.stopped])

  // Roulette: la ruota gira a velocità costante finché non la fermi.
  useEffect(() => {
    if (state.game !== 'roulette' || state.wheelStopped) return
    const id = setInterval(() => {
      setState((s) =>
        s.game === 'roulette' && !s.wheelStopped
          ? { ...s, wheelAngle: s.wheelAngle + 11 }
          : s,
      )
    }, 40)
    return () => clearInterval(id)
  }, [state.game, state.wheelStopped])

  // Lock delay: quando il pezzo è appoggiato, blocca dopo una breve finestra;
  // ogni mossa/rotazione resetta il timer (dipendenza da lockKey).
  useEffect(() => {
    if (!state.grounded || state.gameOver || state.flashRows || state.paused) return
    const id = setTimeout(() => {
      setState((s) => {
        if (!s.grounded) return s
        if (tryMove(s.board, s.piece, 0, 1)) return { ...s, grounded: false }
        return lockPiece(s, s.piece)
      })
    }, LOCK_DELAY_MS)
    return () => clearTimeout(id)
  }, [state.grounded, state.lockKey, state.gameOver, state.flashRows, state.paused])

  // Tastiera: input one-shot + auto-repeat (DAS/ARR) per il movimento.
  useEffect(() => {
    let dasTimer: ReturnType<typeof setTimeout> | undefined
    let arrTimer: ReturnType<typeof setInterval> | undefined
    let activeKey: string | null = null

    const stopRepeat = () => {
      if (dasTimer) clearTimeout(dasTimer)
      if (arrTimer) clearInterval(arrTimer)
      dasTimer = arrTimer = undefined
      activeKey = null
    }
    const fire = (key: string) => setState((s) => reduceKey(s, key))

    function onDown(e: KeyboardEvent) {
      if (!HANDLED.includes(e.key)) return
      e.preventDefault()
      if (e.repeat) return // la ripetizione la gestiamo noi
      // Avvio del run dalla schermata iniziale (applica i joker dal meta).
      if (!startedRef.current && (e.key === 'Enter' || e.key === ' ')) {
        startRef.current()
        return
      }
      fire(e.key)
      if (DIRECTIONS.has(e.key)) {
        stopRepeat()
        activeKey = e.key
        dasTimer = setTimeout(() => {
          arrTimer = setInterval(() => fire(e.key), ARR_MS)
        }, DAS_MS)
      }
    }
    function onUp(e: KeyboardEvent) {
      if (e.key === activeKey) stopRepeat()
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      stopRepeat()
    }
  }, [])

  // Avvia un run applicando i joker equipaggiati (config + bankroll iniziale).
  const startRun = () => {
    bankedRef.current = false // nuovo run → il bankroll andrà bancato a fine partita
    const config = buildRunConfig(meta.activeJokers)
    const startBankroll = startingBankroll(config, meta.lastRunBankroll)
    // FLUSH_WILD_SUIT: scegli un seme jolly per questo run.
    const wildSuit = config.flushWild
      ? SUITS[Math.floor(Math.random() * SUITS.length)]
      : null
    // Cat.4: mazzo-modello del run dalla composizione scelta.
    const deckTemplate = buildDeckTemplate({
      removeLow: config.removeLow,
      doubleFace: config.doubleFace,
      heartFocus: config.heartFocus,
    })
    setState(newGame(true, config, startBankroll, wildSuit, deckTemplate))
  }
  // Ref aggiornati a ogni render, per l'handler tastiera (deps []).
  startRef.current = startRun
  startedRef.current = state.started

  // Shop tra un run e l'altro: apri (snapshot della vetrina), compra, gioca.
  const openShop = () => setShopOffers(selectShop(meta))
  const buy = (id: UpgradeId) =>
    setMeta((m) => {
      const next = buyUpgrade(m, id)
      saveMeta(next)
      return next
    })
  const playFromShop = () => {
    setShopOffers(null)
    startRun()
  }
  // Applica un'azione solo durante il gioco (per i pulsanti touch).
  const act = (fn: (s: GameState) => GameState) =>
    setState((s) =>
      s.started && !s.gameOver && !s.flashRows && !s.paused ? fn(s) : s,
    )

  const { board, piece, next, hold, lines, progress, bankroll, scoreKey, level, best } = state
  const { table, target, reels, stopped, mods, paused, levelEnd, game } = state
  const { wheelAngle, wheelStopped } = state
  const slotCards = reels.map((i) => REEL_CARDS[i])
  const slotOutcome = game === 'slot' && stopped >= 3 ? evalThreeCardHand(slotCards) : null
  const rouletteIdx = rouletteIndexAt(wheelAngle)
  const continueLabel = levelEnd ? `CONTINUA · TAVOLO ${table}` : 'CHIUDI (P)'
  const showPiece = state.started && !state.gameOver && !state.flashRows
  const display = showPiece ? mergePiece(board, piece) : board
  const columns = display[0].length
  const flashSet = new Set(state.flashRows ?? [])

  const ghost = showPiece
    ? new Set(
        pieceCells(dropPosition(board, piece))
          .filter(({ y }) => y >= 0)
          .map(({ x, y }) => `${y}-${x}`),
      )
    : new Set<string>()

  const boardStyle = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    '--rows': display.length,
  } as CSSProperties

  return (
    <main className="app">
      <div className="shell">
        {/* ---- LEFT ---- */}
        <aside className="side left">
          <div className="brand">
            <div className="brand-tetris">TETRIS</div>
            <div className="brand-poker">
              POKER <span className="suits">♠♥♦♣</span>
            </div>
          </div>

          <Panel label="HOLD" hint="[ C ]">
            <MiniGrid spec={hold} />
          </Panel>

          <div className={`readout ${best ? 'on' : ''}`}>
            <div className="panel-head">
              <span className="panel-label">MIGLIOR MANO</span>
              {best && <span className="readout-tag">RIGA</span>}
            </div>
            <div className="readout-name">
              {best ? best.name : state.started ? 'In attesa…' : '—'}
            </div>
            <div className="readout-cards">
              {best
                ? best.cards.map((c, i) => (
                    <div key={i} className="hand-card">
                      <CardFace card={c} />
                    </div>
                  ))
                : Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="hand-card empty" />
                  ))}
            </div>
            <div className="readout-points">
              <span className="panel-label">PUNTI MANO</span>
              <span className="readout-pts">
                +{best ? HAND_POINTS[best.category] : 0}
              </span>
            </div>
          </div>
        </aside>

        {/* ---- BOARD ---- */}
        <div className="board-col">
          <div className="board-frame">
            <div className="felt">
              <div className="board" style={boardStyle}>
                {display.map((row, y) =>
                  row.map((cell, x) => {
                    const key = `${y}-${x}`
                    if (cell) {
                      const flash = flashSet.has(y) ? ' flash' : ''
                      return (
                        <div key={key} className={`cell${flash}`}>
                          <CardFace card={cell.card} type={cell.type} />
                        </div>
                      )
                    }
                    if (ghost.has(key)) {
                      return (
                        <div key={key} className={`cell ghost t-${piece.type}`} />
                      )
                    }
                    return <div key={key} className="cell empty" />
                  }),
                )}
              </div>
            </div>

            {!state.started && !state.gameOver && (
              <div className="overlay start">
                <div className="overlay-suits">
                  <span className="s-red">♥</span>
                  <span>♠</span>
                  <span className="s-red">♦</span>
                  <span>♣</span>
                </div>
                <div className="overlay-title big">
                  TETRIS
                  <br />
                  POKER
                </div>
                <div className="overlay-sub">
                  Cala i tetromini. Componi la miglior mano su ogni riga. Vinci il
                  banco.
                </div>
                <button className="btn" onClick={startRun}>
                  PREMI PER INIZIARE
                </button>
                <div className="overlay-tip">
                  o premi <b>Invio</b>
                </div>
              </div>
            )}

            {paused && (
              <div className="overlay casino">
                <div className="overlay-kicker">
                  {levelEnd ? `★ TAVOLO ${table - 1} SUPERATO ★` : '★ CASINÒ ★'}
                </div>
                <div className="casino-bank">
                  Bankroll: <b>{bankroll}</b> fiches
                </div>

                {/* --- MENU: scelta del gioco --- */}
                {game === 'menu' && (
                  <>
                    <div className="game-choice">
                      <button
                        className="game-card"
                        onClick={() => setState(playSlot)}
                        disabled={bankroll < SLOT_COST}
                      >
                        <span className="game-name">🂡 Slot del Poker</span>
                        <span className="game-info">
                          Ferma 3 carte, forma una mano
                        </span>
                        <span className="game-cost">−{SLOT_COST}</span>
                      </button>
                      <button
                        className="game-card"
                        onClick={() => setState(playRoulette)}
                        disabled={bankroll < ROULETTE_COST}
                      >
                        <span className="game-name">⊚ Roulette</span>
                        <span className="game-info">
                          Ferma la ruota sul settore giusto
                        </span>
                        <span className="game-cost">−{ROULETTE_COST}</span>
                      </button>
                    </div>
                    <button
                      className="btn ghost-btn"
                      onClick={() => setState(closeCasino)}
                    >
                      {continueLabel}
                    </button>
                  </>
                )}

                {/* --- SLOT --- */}
                {game === 'slot' && (
                  <>
                    <div className="slot-title">Slot del Poker</div>
                    <div className="slot3">
                      {slotCards.map((card, i) => (
                        <div
                          key={i}
                          className={`reel${i < stopped ? ' locked' : ' spinning'}`}
                        >
                          <CardFace card={card} />
                        </div>
                      ))}
                    </div>
                    {stopped < 3 ? (
                      <>
                        <button className="btn" onClick={() => setState(stopReel)}>
                          FERMA RULLO {stopped + 1}
                        </button>
                        <div className="overlay-tip">
                          <b>Spazio</b> per fermare un rullo alla volta
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="slot-result">
                          {slotOutcome!.label} — <b>{slotOutcome!.desc}</b>
                        </div>
                        <button
                          className="btn ghost-btn"
                          onClick={() => setState(backToMenu)}
                        >
                          ← AI GIOCHI
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* --- ROULETTE --- */}
                {game === 'roulette' && (
                  <>
                    <div className="slot-title">Roulette</div>
                    <div className="roulette">
                      <div className="wheel-pointer" />
                      <div
                        className="wheel"
                        style={{ transform: `rotate(${wheelAngle}deg)` }}
                      />
                    </div>
                    <div className="roulette-legend">
                      {ROULETTE_SLOTS.map((sl, i) => (
                        <span
                          key={i}
                          className={`rl-chip ${sl.red ? 'red' : 'black'}${
                            i === rouletteIdx ? ' lit' : ''
                          }`}
                        >
                          {sl.label}
                        </span>
                      ))}
                    </div>
                    {!wheelStopped ? (
                      <>
                        <button className="btn" onClick={() => setState(stopWheel)}>
                          FERMA LA RUOTA
                        </button>
                        <div className="overlay-tip">
                          <b>Spazio</b> per fermare la ruota
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="slot-result">
                          {ROULETTE_SLOTS[rouletteIdx].desc}
                        </div>
                        <button
                          className="btn ghost-btn"
                          onClick={() => setState(backToMenu)}
                        >
                          ← AI GIOCHI
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {state.gameOver && (
              <div className="overlay over">
                <div className="overlay-kicker">PARTITA TERMINATA</div>
                <div className="overlay-title">
                  Game
                  <br />
                  Over
                </div>
                <div className="over-stats">
                  <div className="over-stat">
                    <span className="panel-label">TAVOLO</span>
                    <span className="over-val gold">{table}</span>
                  </div>
                  <div className="over-stat">
                    <span className="panel-label">BANKROLL</span>
                    <span className="over-val">{bankroll + progress}</span>
                  </div>
                  <div className="over-stat">
                    <span className="panel-label">RIGHE</span>
                    <span className="over-val">{lines}</span>
                  </div>
                </div>
                <div className="over-meta">
                  Bankroll totale:{' '}
                  <b className="tp-num">{meta.totalBankroll}</b>
                </div>
                <button className="btn" onClick={openShop}>
                  SHOP →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ---- RIGHT ---- */}
        <aside className="side right">
          <Panel label={`TAVOLO ${table}`}>
            <div className="progress">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (progress / target) * 100)}%` }}
              />
            </div>
            <div className="progress-text">
              {progress} / {target} fiches
            </div>
          </Panel>

          <Panel label="BANKROLL">
            <span key={scoreKey} className="big-score">
              {bankroll}
            </span>
            {mods.mult > 1 && (
              <span className="mult-line">moltiplicatore ×{mods.mult}</span>
            )}
            <span className="bank-total">
              In banca: <b className="tp-num">{meta.totalBankroll}</b>
            </span>
            {state.wildSuit && (
              <span className="fx-line">Jolly colore: {state.wildSuit}</span>
            )}
            {state.config.doubleDown && (
              <span className="fx-line">
                D ·{' '}
                {state.doubleDownArmed
                  ? 'ARMATO ⚡'
                  : state.doubleDownAvail
                    ? 'pronto'
                    : 'usato'}
              </span>
            )}
          </Panel>

          <div className="row2">
            <Panel label="RIGHE">
              <span className="stat-num">{lines}</span>
            </Panel>
            <Panel label="LIVELLO">
              <span className="stat-num">{level}</span>
            </Panel>
          </div>

          <Panel label="PROSSIMO">
            <MiniGrid spec={next} />
          </Panel>

          <Panel label="COMANDI" className="legend">
            <div className="keys">
              <span className="key">← →</span>
              <span>Muovi</span>
              <span className="key">↑</span>
              <span>Ruota</span>
              <span className="key">↓</span>
              <span>Discesa</span>
              <span className="key">Spazio</span>
              <span>Caduta</span>
              <span className="key">C</span>
              <span>Tieni</span>
              <span className="key">P</span>
              <span>Casinò</span>
            </div>
          </Panel>

          <button
            className="btn casino-open"
            onClick={() => setState(openCasino)}
          >
            ★ CASINÒ · slot del poker
          </button>

          <div className="pad">
            <button className="pad-btn" onClick={() => act((s) => move(s, -1, 0))}>
              ←
            </button>
            <button className="pad-btn" onClick={() => act(rotate)}>
              ↑
            </button>
            <button className="pad-btn" onClick={() => act(softDrop)}>
              ↓
            </button>
            <button className="pad-btn" onClick={() => act((s) => move(s, 1, 0))}>
              →
            </button>
            <button className="pad-btn wide" onClick={() => act(hardDrop)}>
              ⤓
            </button>
          </div>
        </aside>
      </div>

      {shopOffers && (
        <ShopScreen
          meta={meta}
          offers={shopOffers}
          onBuy={buy}
          onPlay={playFromShop}
        />
      )}
    </main>
  )
}

export default App
