import { SHAPES } from '../game/tetromino'
import type { PieceSpec } from '../game/spawn'
import type { Card } from '../game/cards'
import type { TetrominoType } from '../game/tetromino'
import { CardFace } from './CardFace'

// Anteprima 4×4 di un pezzo (hold / next), centrato nella griglia.
export function MiniGrid({ spec }: { spec: PieceSpec | null }) {
  const cells: Array<{ card: Card; type: TetrominoType } | null> =
    Array(16).fill(null)

  if (spec) {
    const coords = SHAPES[spec.type]
    const xs = coords.map(([x]) => x)
    const ys = coords.map(([, y]) => y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const w = Math.max(...xs) - minX + 1
    const h = Math.max(...ys) - minY + 1
    const offX = Math.floor((4 - w) / 2)
    const offY = Math.floor((4 - h) / 2)
    coords.forEach(([x, y], i) => {
      const idx = (y - minY + offY) * 4 + (x - minX + offX)
      if (idx >= 0 && idx < 16) cells[idx] = { card: spec.cards[i], type: spec.type }
    })
  }

  return (
    <div className="mini">
      {cells.map((c, i) => (
        <div key={i} className="mini-cell">
          {c && <CardFace card={c.card} type={c.type} />}
        </div>
      ))}
    </div>
  )
}
