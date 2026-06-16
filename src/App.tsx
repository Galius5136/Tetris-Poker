import { useEffect, useState, type CSSProperties } from 'react'
import './App.css'
import { createEmptyBoard, clearFullRows, type Board } from './game/board'
import { mergePiece, type Piece } from './game/tetromino'
import { collides, tryMove, tryRotate } from './game/engine'
import { spawnPiece } from './game/spawn'
import { shuffledDeck, type Deck } from './game/deck'
import { isRedSuit, type Card } from './game/cards'
import { evalRow, HAND_POINTS, type HandResult } from './game/poker'

const TICK_MS = 600

interface GameState {
  board: Board // celle già bloccate
  piece: Piece // pezzo in caduta
  deck: Deck // carte ancora da pescare
  lines: number // righe completate finora
  score: number // punti (dalle mani di poker)
  best: HandResult | null // miglior mano dell'ultimo clear
  gameOver: boolean
}

function initialState(): GameState {
  const board = createEmptyBoard()
  const { piece, deck } = spawnPiece(shuffledDeck(), board[0].length)
  return { board, piece, deck, lines: 0, score: 0, best: null, gameOver: false }
}

// Confronta due mani: true se a è migliore di b (o b è null).
function isBetter(a: HandResult, b: HandResult | null): boolean {
  return !b || a.category > b.category || (a.category === b.category && a.tie > b.tie)
}

// Blocca il `piece`, valuta le righe piene (poker), le elimina, pesca un nuovo pezzo.
function lockAndSpawn(state: GameState, piece: Piece): GameState {
  const merged = mergePiece(state.board, piece)

  // Righe piene PRIMA della rimozione, per valutare le mani.
  const fullRows = merged.filter((row) => row.every((cell) => cell !== null))
  let best = state.best
  let gained = 0
  if (fullRows.length > 0) {
    let clearBest: HandResult | null = null
    for (const row of fullRows) {
      const hand = evalRow(row as Card[])
      gained += HAND_POINTS[hand.category]
      if (isBetter(hand, clearBest)) clearBest = hand
    }
    if (fullRows.length > 1) gained *= fullRows.length // bonus multi-riga
    best = clearBest
  }

  const { board, cleared } = clearFullRows(merged)
  const { piece: next, deck } = spawnPiece(state.deck, board[0].length)
  return {
    board,
    piece: next,
    deck,
    lines: state.lines + cleared,
    score: state.score + gained,
    best,
    gameOver: collides(board, next),
  }
}

// Un tick di gravità: scende di una riga; se non può, blocca e respawna.
function step(state: GameState): GameState {
  if (state.gameOver) return state
  const moved = tryMove(state.board, state.piece, 0, 1)
  if (moved) return { ...state, piece: moved }
  return lockAndSpawn(state, state.piece)
}

// Sposta il pezzo se possibile, altrimenti lascia lo stato invariato.
function move(state: GameState, dx: number, dy: number): GameState {
  const moved = tryMove(state.board, state.piece, dx, dy)
  return moved ? { ...state, piece: moved } : state
}

// Ruota il pezzo se possibile.
function rotate(state: GameState): GameState {
  const rotated = tryRotate(state.board, state.piece)
  return rotated ? { ...state, piece: rotated } : state
}

// Caduta istantanea: scende fin dove può, poi blocca e respawna.
function hardDrop(state: GameState): GameState {
  let piece = state.piece
  for (;;) {
    const next = tryMove(state.board, piece, 0, 1)
    if (!next) break
    piece = next
  }
  return lockAndSpawn(state, piece)
}

function App() {
  const [state, setState] = useState<GameState>(initialState)

  useEffect(() => {
    if (state.gameOver) return
    const id = setInterval(() => setState(step), TICK_MS)
    return () => clearInterval(id)
  }, [state.gameOver])

  useEffect(() => {
    const handlers: Record<string, (s: GameState) => GameState> = {
      ArrowLeft: (s) => move(s, -1, 0),
      ArrowRight: (s) => move(s, 1, 0),
      ArrowDown: (s) => move(s, 0, 1),
      ArrowUp: rotate,
      ' ': hardDrop,
    }
    function onKey(e: KeyboardEvent) {
      const handler = handlers[e.key]
      if (!handler) return
      e.preventDefault()
      setState((s) => (s.gameOver ? s : handler(s)))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const { board, piece, lines, score, best, gameOver } = state
  const display = gameOver ? board : mergePiece(board, piece)
  const columns = display[0].length

  const boardStyle = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    '--rows': display.length,
  } as CSSProperties

  return (
    <main className="app">
      <header className="topbar">
        <h1 className="title">
          TETRIS <span className="title-poker">POKER</span>
          <span className="suits">♠♥♦♣</span>
        </h1>
        <div className="stats">
          <div className="stat">
            <span className="score-label">PUNTI</span>
            <span className="score-val">{score}</span>
          </div>
          <div className="stat">
            <span className="score-label">RIGHE</span>
            <span className="score-val lines">{lines}</span>
          </div>
        </div>
      </header>

      <div className="board-frame">
        <div className="felt">
          <div className="board" style={boardStyle}>
            {display.map((row, y) =>
              row.map((cell, x) => {
                const tone = cell && isRedSuit(cell.suit) ? 'red' : 'black'
                return (
                  <div
                    key={`${y}-${x}`}
                    className={cell ? `cell filled ${tone}` : 'cell'}
                  >
                    {cell && (
                      <>
                        <span className="rank">{cell.rank}</span>
                        <span className="corner-suit">{cell.suit}</span>
                        <span className="center-suit">{cell.suit}</span>
                      </>
                    )}
                  </div>
                )
              }),
            )}
          </div>
        </div>

        {gameOver && (
          <div className="overlay">
            <div className="overlay-kicker">PARTITA TERMINATA</div>
            <div className="overlay-title">
              Game
              <br />
              Over
            </div>
          </div>
        )}
      </div>

      <p className="hand-readout">
        {best ? `${best.name} · +${HAND_POINTS[best.category]}` : '—'}
      </p>

      <p className="hint">← → muovi · ↓ giù · ↑ ruota · spazio cade</p>
    </main>
  )
}

export default App
