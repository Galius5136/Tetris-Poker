import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import './App.css'
import { createEmptyBoard, clearFullRows } from './game/board'
import type { Board, FilledCell } from './game/board'
import { mergePiece, pieceCells } from './game/tetromino'
import type { Piece, TetrominoType } from './game/tetromino'
import { collides, tryMove, tryRotate, dropPosition } from './game/engine'
import { drawSpec, makePiece, type PieceSpec } from './game/spawn'
import { shuffledDeck, type Deck } from './game/deck'
import { evalRow, HAND_POINTS, type HandResult } from './game/poker'
import { levelFromLines, tickMs, START_LEVEL } from './game/levels'
import { tableTarget } from './game/run'
import {
  REEL_CARDS,
  SLOT_COST,
  BASE_MODIFIERS,
  applyModifiers,
  evalThreeCardHand,
  type Modifiers,
} from './game/perks'
import { CardFace } from './ui/CardFace'
import { MiniGrid } from './ui/MiniGrid'

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
  spinning: boolean // un giro di slot pagato è in corso/concluso
  reels: number[] // posizione dei 3 rulli (indici in REEL_CARDS)
  stopped: number // quanti rulli sono già fermi (0..3)
  mods: Modifiers // potenziamenti accumulati dai perk
  started: boolean
  gameOver: boolean
}

const INITIAL_REELS = [0, 3, 6] // rulli sfasati: allineare è una sfida di tempismo

function newGame(started = false): GameState {
  const board = createEmptyBoard()
  const width = board[0].length
  const first = drawSpec([], shuffledDeck())
  const second = drawSpec(first.bag, first.deck)
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
    bankroll: 0,
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
    spinning: false,
    reels: INITIAL_REELS,
    stopped: 0,
    mods: BASE_MODIFIERS,
    started,
    gameOver: false,
  }
}

// --- Casinò (a richiesta, in pausa) ---

// Apre il Casinò a richiesta, mettendo in pausa il gioco.
function openCasino(state: GameState): GameState {
  if (!state.started || state.gameOver || state.flashRows || state.paused) {
    return state
  }
  return { ...state, paused: true, levelEnd: false, spinning: false }
}

// Chiude il Casinò / prosegue dal fine tavolo (non a metà di un giro pagato).
function closeCasino(state: GameState): GameState {
  if (state.spinning && state.stopped < 3) return state
  return { ...state, paused: false, levelEnd: false, spinning: false }
}

// Avvia un giro di slot: costa SLOT_COST fiches, scalate dal bankroll.
function startSpin(state: GameState): GameState {
  if (state.bankroll < SLOT_COST) return state // bankroll insufficiente
  return {
    ...state,
    spinning: true,
    stopped: 0,
    reels: INITIAL_REELS,
    bankroll: state.bankroll - SLOT_COST,
  }
}

// Ferma il prossimo rullo (skill, no RNG). Al terzo applica la mano di poker.
function stopReel(state: GameState): GameState {
  if (!state.spinning || state.stopped >= 3) return state
  const stopped = state.stopped + 1
  if (stopped < 3) return { ...state, stopped }
  const outcome = evalThreeCardHand(state.reels.map((i) => REEL_CARDS[i]))
  return { ...state, stopped, mods: outcome.apply(state.mods) }
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
  const drawn = drawSpec(state.bag, state.deck)
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

  let clearBest: HandResult | null = null
  let gained = 0
  for (const r of rows) {
    const hand = evalRow((state.board[r] as FilledCell[]).map((c) => c.card))
    gained += HAND_POINTS[hand.category]
    if (isBetter(hand, clearBest)) clearBest = hand
  }
  if (rows.length > 1) gained *= rows.length // bonus multi-riga
  gained = applyModifiers(gained, state.mods) // perk: moltiplicatore + bonus

  const { board, cleared } = clearFullRows(state.board)
  const lines = state.lines + cleared
  const progress = state.progress + gained

  const base = {
    ...state,
    flashRows: null,
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
        spinning: false,
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
  const drawn = drawSpec(state.bag, state.deck)
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
  'x', 'X', ' ', 'c', 'C', 'Enter', 'p', 'P', 'Escape',
]

// Movimento con auto-repeat gestito dal gioco (DAS/ARR), non dal SO.
const DAS_MS = 160 // ritardo prima dell'auto-repeat
const ARR_MS = 40 // intervallo dell'auto-repeat
const DIRECTIONS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown'])

function reduceKey(s: GameState, k: string): GameState {
  if (!s.started) {
    return (k === 'Enter' || k === ' ') && !s.gameOver ? newGame(true) : s
  }
  if (s.gameOver) return s
  if (k === 'p' || k === 'P' || k === 'Escape') {
    return s.paused ? closeCasino(s) : openCasino(s)
  }
  if (s.paused) {
    if (k !== 'Enter' && k !== ' ') return s
    if (!s.spinning) return startSpin(s) // avvia/paga il giro
    if (s.stopped < 3) return stopReel(s) // ferma un rullo
    return startSpin(s) // gioca ancora
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
    if (!state.paused || !state.spinning || state.stopped >= 3) return
    const id = setInterval(() => {
      setState((s) => {
        if (!s.paused || !s.spinning || s.stopped >= 3) return s
        const reels = s.reels.map((pos, i) =>
          i >= s.stopped ? (pos + 1) % REEL_CARDS.length : pos,
        )
        return { ...s, reels }
      })
    }, 110)
    return () => clearInterval(id)
  }, [state.paused, state.spinning, state.stopped])

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

  const start = () => setState(newGame(true))
  // Applica un'azione solo durante il gioco (per i pulsanti touch).
  const act = (fn: (s: GameState) => GameState) =>
    setState((s) =>
      s.started && !s.gameOver && !s.flashRows && !s.paused ? fn(s) : s,
    )

  const { board, piece, next, hold, lines, progress, bankroll, scoreKey, level, best } = state
  const { table, target, reels, stopped, mods, paused, levelEnd, spinning } = state
  const slotCards = reels.map((i) => REEL_CARDS[i])
  const slotOutcome = spinning && stopped >= 3 ? evalThreeCardHand(slotCards) : null
  const canAfford = bankroll >= SLOT_COST
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
                <button className="btn" onClick={start}>
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
                <div className="slot-title">Slot del Poker</div>
                <div className="casino-bank">
                  Bankroll: <b>{bankroll}</b> fiches
                </div>

                {!spinning ? (
                  <>
                    <div className="overlay-sub">
                      Ferma 3 carte e forma una mano: più è alta, migliore è il
                      perk. Un giro costa {SLOT_COST} fiches.
                    </div>
                    <button
                      className="btn"
                      onClick={() => setState(startSpin)}
                      disabled={!canAfford}
                    >
                      GIOCA · −{SLOT_COST}
                    </button>
                    <button
                      className="btn ghost-btn"
                      onClick={() => setState(closeCasino)}
                    >
                      {levelEnd ? `CONTINUA · TAVOLO ${table}` : 'CHIUDI (P)'}
                    </button>
                    {!canAfford && (
                      <div className="overlay-tip">
                        Bankroll insufficiente ({bankroll})
                      </div>
                    )}
                  </>
                ) : (
                  <>
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
                        <div className="casino-actions">
                          <button
                            className="btn"
                            onClick={() => setState(startSpin)}
                            disabled={!canAfford}
                          >
                            ANCORA · −{SLOT_COST}
                          </button>
                          <button
                            className="btn ghost-btn"
                            onClick={() => setState(closeCasino)}
                          >
                            {levelEnd ? 'CONTINUA' : 'CHIUDI'}
                          </button>
                        </div>
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
                    <span className="over-val">{bankroll}</span>
                  </div>
                  <div className="over-stat">
                    <span className="panel-label">RIGHE</span>
                    <span className="over-val">{lines}</span>
                  </div>
                </div>
                <button className="btn" onClick={start}>
                  ↻ RIGIOCA
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
    </main>
  )
}

export default App
