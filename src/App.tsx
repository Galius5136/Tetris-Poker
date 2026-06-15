import { useEffect, useState, type CSSProperties } from 'react'
import './App.css'
import { createEmptyBoard, clearFullRows, type Board } from './game/board'
import { mergePiece, type Piece } from './game/tetromino'
import { collides, tryMove, tryRotate } from './game/engine'
import { randomPiece } from './game/spawn'
import { isRedSuit } from './game/cards'

const TICK_MS = 600

interface GameState {
  board: Board // celle già bloccate
  piece: Piece // pezzo in caduta
  lines: number // righe completate finora
  gameOver: boolean
}

function initialState(): GameState {
  const board = createEmptyBoard()
  return {
    board,
    piece: randomPiece(board[0].length),
    lines: 0,
    gameOver: false,
  }
}

// Blocca il pezzo, elimina le righe piene, poi genera un nuovo pezzo.
// Se il nuovo nasce già in collisione: game over.
function lockAndSpawn(board: Board, piece: Piece, lines: number): GameState {
  const merged = mergePiece(board, piece)
  const { board: cleared, cleared: n } = clearFullRows(merged)
  const next = randomPiece(cleared[0].length)
  const total = lines + n
  if (collides(cleared, next)) {
    return { board: cleared, piece, lines: total, gameOver: true }
  }
  return { board: cleared, piece: next, lines: total, gameOver: false }
}

// Un tick di gravità: scende di una riga; se non può, blocca e respawna.
function step(state: GameState): GameState {
  if (state.gameOver) return state
  const moved = tryMove(state.board, state.piece, 0, 1)
  if (moved) return { ...state, piece: moved }
  return lockAndSpawn(state.board, state.piece, state.lines)
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
  return lockAndSpawn(state.board, piece, state.lines)
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

  const { board, piece, lines, gameOver } = state
  const display = gameOver ? board : mergePiece(board, piece)
  const columns = display[0].length

  const boardStyle = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    '--rows': display.length,
  } as CSSProperties

  return (
    <main className="app">
      <p className="score">Righe: {lines}</p>
      <div className="board" style={boardStyle}>
        {display.map((row, y) =>
          row.map((cell, x) => (
            <div key={`${y}-${x}`} className={cell ? 'cell filled' : 'cell'}>
              {cell && (
                <span className={isRedSuit(cell.suit) ? 'card red' : 'card black'}>
                  {cell.rank}
                  {cell.suit}
                </span>
              )}
            </div>
          )),
        )}
        {gameOver && <div className="overlay">Game Over</div>}
      </div>
      <p className="hint">← → muovi · ↓ giù · ↑ ruota · spazio cade</p>
    </main>
  )
}

export default App
