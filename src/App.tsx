import './App.css'
import { createEmptyBoard } from './game/board'

function App() {
  const board = createEmptyBoard()
  const columns = board[0].length

  return (
    <main className="app">
      <div
        className="board"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {board.map((row, y) =>
          row.map((_, x) => <div key={`${y}-${x}`} className="cell" />),
        )}
      </div>
    </main>
  )
}

export default App
