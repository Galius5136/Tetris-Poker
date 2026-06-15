import type { CSSProperties } from 'react'
import './App.css'
import { createEmptyBoard } from './game/board'
import { mergePiece, type Piece } from './game/tetromino'
import { isRedSuit } from './game/cards'

// Pezzo statico di prova: un T con 4 carte fisse, solo per vedere
// forma + carte a schermo. Verrà sostituito da spawn/gravità.
const demoPiece: Piece = {
  type: 'T',
  x: 4,
  y: 0,
  cards: [
    { suit: '♠', rank: 'A' },
    { suit: '♥', rank: '7' },
    { suit: '♦', rank: '10' },
    { suit: '♣', rank: 'K' },
  ],
}

function App() {
  const board = mergePiece(createEmptyBoard(), demoPiece)
  const columns = board[0].length

  const boardStyle = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    '--rows': board.length,
  } as CSSProperties

  return (
    <main className="app">
      <div className="board" style={boardStyle}>
        {board.map((row, y) =>
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
      </div>
    </main>
  )
}

export default App
