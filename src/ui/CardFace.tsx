import { isRedSuit, type Card } from '../game/cards'
import type { TetrominoType } from '../game/tetromino'

// Faccia di una carta: riempie il contenitore (cella board o mini).
// `type` (opzionale) dà solo il colore/glow del bordo per tipo di pezzo.
export function CardFace({
  card,
  type,
}: {
  card: Card
  type?: TetrominoType
}) {
  const tone = isRedSuit(card.suit) ? 'red' : 'black'
  return (
    <div className={`card-face ${tone} t-${type ?? 'none'}`}>
      <span className="rank">{card.rank}</span>
      <span className="corner-suit">{card.suit}</span>
      <span className="center-suit">{card.suit}</span>
    </div>
  )
}
