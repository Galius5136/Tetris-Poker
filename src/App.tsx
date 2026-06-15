import { useEffect, useState, type CSSProperties } from 'react'
import './App.css'
import { createEmptyBoard, type Board } from './game/board'
import { mergePiece, type Piece } from './game/tetromino'
import { collides, tryMove } from './game/engine'
import { randomPiece } from './game/spawn'
import { isRedSuit } from './game/cards'

const TICK_MS = 600

interface GameState {
  board: Board // celle già bloccate
  piece: Piece // pezzo in caduta
  gameOver: boolean
}

function initialState(): GameState {
  const board = createEmptyBoard()
  return { board, piece: randomPiece(board[0].length), gameOver: false }
}

// Un tick di gravità: scende di una riga; se non può, blocca il pezzo
// e ne genera uno nuovo. Se il nuovo nasce già in collisione: game over.
function step(state: GameState): GameState {
  if (state.gameOver) return state
  const { board, piece } = state

  const moved = tryMove(board, piece, 0, 1)
  if (moved) return { ...state, piece: moved }

  const locked = mergePiece(board, piece)
  const next = randomPiece(locked[0].length)
  if (collides(locked, next)) {
    return { board: locked, piece, gameOver: true }
  }
  return { board: locked, piece: next, gameOver: false }
}

function App() {
  const [state, setState] = useState<GameState>(initialState)

  useEffect(() => {
    if (state.gameOver) return
    const id = setInterval(() => setState(step), TICK_MS)
    return () => clearInterval(id)
  }, [state.gameOver])

  const { board, piece, gameOver } = state
  const display = gameOver ? board : mergePiece(board, piece)
  const columns = display[0].length

  const boardStyle = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    '--rows': display.length,
  } as CSSProperties

  return (
    <main className="app">
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
    </main>
  )
}

export default App
