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
  REEL_PERKS,
  BASE_MODIFIERS,
  applyModifiers,
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
  score: number
  scoreKey: number // ri-triggera l'animazione del punteggio sui clear
  level: number
  best: HandResult | null
  flashRows: number[] | null // righe piene in fase di lampeggio
  grounded: boolean // il pezzo è appoggiato (lock delay in corso)
  lockKey: number // bumpato a ogni mossa per resettare il timer di lock
  table: number // tavolo corrente del run
  target: number // fiches necessarie per superare il tavolo
  payout: boolean // momento "Banco/Casinò": tavolo superato
  reelIndex: number // posizione del rullo della slot
  reelStopped: boolean // il rullo è stato fermato (perk scelto)
  mods: Modifiers // potenziamenti accumulati dai perk
  started: boolean
  gameOver: boolean
}

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
    score: 0,
    scoreKey: 0,
    level: START_LEVEL,
    best: null,
    flashRows: null,
    grounded: false,
    lockKey: 0,
    table: 1,
    target: tableTarget(1),
    payout: false,
    reelIndex: 0,
    reelStopped: false,
    mods: BASE_MODIFIERS,
    started,
    gameOver: false,
  }
}

// Ferma il rullo della slot e applica il perk sotto la lente (skill, no RNG).
function stopReel(state: GameState): GameState {
  if (state.reelStopped) return state
  const perk = REEL_PERKS[state.reelIndex]
  const { mods, fiches } = perk.apply(state.mods)
  return { ...state, reelStopped: true, mods, score: state.score + fiches }
}

// Avanza al tavolo successivo dopo il Casinò.
function advanceTable(state: GameState): GameState {
  const table = state.table + 1
  return {
    ...state,
    table,
    target: tableTarget(table),
    payout: false,
    reelIndex: 0,
    reelStopped: false,
  }
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
  const score = state.score + gained
  const next = spawnNext(
    {
      ...state,
      flashRows: null,
      lines,
      level: levelFromLines(lines),
      score,
      scoreKey: gained > 0 ? state.scoreKey + 1 : state.scoreKey,
      best: clearBest,
    },
    board,
  )
  // Tavolo superato → il Banco paga (a meno che la board non sia già piena).
  return score >= state.target && !next.gameOver ? { ...next, payout: true } : next
}

// Tick di gravità: scende di una riga; se non può, segna "appoggiato"
// (il blocco vero avviene dopo il lock delay, vedi effetto in App).
function step(state: GameState): GameState {
  if (!state.started || state.gameOver || state.flashRows || state.payout) return state
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
  return afterAction({ ...state, piece: moved, score: state.score + 1 })
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
  'x', 'X', ' ', 'c', 'C', 'Enter',
]

// Movimento con auto-repeat gestito dal gioco (DAS/ARR), non dal SO.
const DAS_MS = 160 // ritardo prima dell'auto-repeat
const ARR_MS = 40 // intervallo dell'auto-repeat
const DIRECTIONS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown'])

function reduceKey(s: GameState, k: string): GameState {
  if (!s.started) {
    return (k === 'Enter' || k === ' ') && !s.gameOver ? newGame(true) : s
  }
  if (s.payout) {
    if (k !== 'Enter' && k !== ' ') return s
    return s.reelStopped ? advanceTable(s) : stopReel(s)
  }
  if (s.gameOver || s.flashRows) return s
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

  // Rullo della slot: scorre a velocità costante finché non lo fermi.
  useEffect(() => {
    if (!state.payout || state.reelStopped) return
    const id = setInterval(() => {
      setState((s) =>
        s.payout && !s.reelStopped
          ? { ...s, reelIndex: (s.reelIndex + 1) % REEL_PERKS.length }
          : s,
      )
    }, 140)
    return () => clearInterval(id)
  }, [state.payout, state.reelStopped])

  // Lock delay: quando il pezzo è appoggiato, blocca dopo una breve finestra;
  // ogni mossa/rotazione resetta il timer (dipendenza da lockKey).
  useEffect(() => {
    if (!state.grounded || state.gameOver || state.flashRows || state.payout) return
    const id = setTimeout(() => {
      setState((s) => {
        if (!s.grounded) return s
        if (tryMove(s.board, s.piece, 0, 1)) return { ...s, grounded: false }
        return lockPiece(s, s.piece)
      })
    }, LOCK_DELAY_MS)
    return () => clearTimeout(id)
  }, [state.grounded, state.lockKey, state.gameOver, state.flashRows, state.payout])

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
      s.started && !s.gameOver && !s.flashRows && !s.payout ? fn(s) : s,
    )

  const { board, piece, next, hold, lines, score, scoreKey, level, best } = state
  const { table, target, reelIndex, reelStopped, mods } = state
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

            {state.payout && (
              <div className="overlay payout">
                <div className="overlay-kicker">★ CASINÒ ★</div>
                <div className="slot-title">Tavolo {table} superato</div>
                <div className="slot">
                  {REEL_PERKS.map((p, i) => {
                    const lit = i === reelIndex
                    const won = reelStopped && lit
                    return (
                      <div
                        key={p.id}
                        className={`slot-cell${lit ? ' lit' : ''}${won ? ' won' : ''}`}
                      >
                        <span className="slot-label">{p.label}</span>
                        <span className="slot-desc">{p.desc}</span>
                      </div>
                    )
                  })}
                </div>
                {!reelStopped ? (
                  <>
                    <button className="btn" onClick={() => setState(stopReel)}>
                      FERMA
                    </button>
                    <div className="overlay-tip">
                      <b>Spazio</b> per fermare il rullo
                    </div>
                  </>
                ) : (
                  <>
                    <div className="slot-result">
                      Perk: <b>{REEL_PERKS[reelIndex].desc}</b>
                    </div>
                    <button className="btn" onClick={() => setState(advanceTable)}>
                      AVANTI · TAVOLO {table + 1}
                    </button>
                    <div className="overlay-tip">
                      o premi <b>Invio</b>
                    </div>
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
                    <span className="panel-label">FICHES</span>
                    <span className="over-val">{score}</span>
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
                style={{ width: `${Math.min(100, (score / target) * 100)}%` }}
              />
            </div>
            <div className="progress-text">
              {score} / {target} fiches
            </div>
          </Panel>

          <Panel label="FICHES">
            <span key={scoreKey} className="big-score">
              {score}
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
            </div>
          </Panel>

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
