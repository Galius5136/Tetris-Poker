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
    started,
    gameOver: false,
  }
}

function isBetter(a: HandResult, b: HandResult | null): boolean {
  return !b || a.category > b.category || (a.category === b.category && a.tie > b.tie)
}

// Blocca il `piece`, valuta+elimina le righe piene, pesca dal next/bag/deck.
function lockAndSpawn(state: GameState, piece: Piece): GameState {
  const merged = mergePiece(state.board, piece)

  const fullRows = merged.filter((row) => row.every((cell) => cell !== null))
  let best = state.best
  let gained = 0
  if (fullRows.length > 0) {
    let clearBest: HandResult | null = null
    for (const row of fullRows) {
      const hand = evalRow((row as FilledCell[]).map((c) => c.card))
      gained += HAND_POINTS[hand.category]
      if (isBetter(hand, clearBest)) clearBest = hand
    }
    if (fullRows.length > 1) gained *= fullRows.length // bonus multi-riga
    best = clearBest
  }

  const { board, cleared } = clearFullRows(merged)
  const lines = state.lines + cleared
  const piece2 = makePiece(state.next, board[0].length)
  const drawn = drawSpec(state.bag, state.deck)

  return {
    ...state,
    board,
    piece: piece2,
    next: drawn.spec,
    bag: drawn.bag,
    deck: drawn.deck,
    canHold: true,
    lines,
    level: levelFromLines(lines),
    score: state.score + gained,
    scoreKey: gained > 0 ? state.scoreKey + 1 : state.scoreKey,
    best,
    gameOver: collides(board, piece2),
  }
}

function step(state: GameState): GameState {
  if (!state.started || state.gameOver) return state
  const moved = tryMove(state.board, state.piece, 0, 1)
  if (moved) return { ...state, piece: moved }
  return lockAndSpawn(state, state.piece)
}

function move(state: GameState, dx: number, dy: number): GameState {
  const moved = tryMove(state.board, state.piece, dx, dy)
  return moved ? { ...state, piece: moved } : state
}

function softDrop(state: GameState): GameState {
  const moved = tryMove(state.board, state.piece, 0, 1)
  return moved ? { ...state, piece: moved, score: state.score + 1 } : state
}

function rotate(state: GameState): GameState {
  const rotated = tryRotate(state.board, state.piece)
  return rotated ? { ...state, piece: rotated } : state
}

function hardDrop(state: GameState): GameState {
  return lockAndSpawn(state, dropPosition(state.board, state.piece))
}

function holdSwap(state: GameState): GameState {
  if (!state.canHold) return state
  const width = state.board[0].length
  const current: PieceSpec = { type: state.piece.type, cards: state.piece.cards }
  if (state.hold) {
    return {
      ...state,
      piece: makePiece(state.hold, width),
      hold: current,
      canHold: false,
    }
  }
  const drawn = drawSpec(state.bag, state.deck)
  return {
    ...state,
    piece: makePiece(state.next, width),
    next: drawn.spec,
    bag: drawn.bag,
    deck: drawn.deck,
    hold: current,
    canHold: false,
  }
}

const HANDLED = [
  'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp',
  'x', 'X', ' ', 'c', 'C', 'Enter',
]

function reduceKey(s: GameState, k: string): GameState {
  if (!s.started) {
    return (k === 'Enter' || k === ' ') && !s.gameOver ? newGame(true) : s
  }
  if (s.gameOver) return s
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

  // Tastiera.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!HANDLED.includes(e.key)) return
      e.preventDefault()
      setState((s) => reduceKey(s, e.key))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const start = () => setState(newGame(true))
  // Applica un'azione solo durante il gioco (per i pulsanti touch).
  const act = (fn: (s: GameState) => GameState) =>
    setState((s) => (s.started && !s.gameOver ? fn(s) : s))

  const { board, piece, next, hold, lines, score, scoreKey, level, best } = state
  const showPiece = state.started && !state.gameOver
  const display = showPiece ? mergePiece(board, piece) : board
  const columns = display[0].length

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
                      return (
                        <div key={key} className="cell">
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
                    <span className="panel-label">PUNTEGGIO</span>
                    <span className="over-val gold">{score}</span>
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
          <Panel label="PUNTEGGIO">
            <span key={scoreKey} className="big-score">
              {score}
            </span>
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
