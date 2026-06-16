import type { Upgrade, UpgradeId } from './upgrades'
import type { MetaState } from './metaGameStore'
import { MAX_ACTIVE_JOKERS } from './metaGameStore'
import { canBuy, isOwned } from './shop'

// Schermata shop tra un run e l'altro. Solo presentazione: riceve la vetrina
// (snapshot stabile) e i callback. Stato delle card derivato dal meta.
export function ShopScreen({
  meta,
  offers,
  onBuy,
  onPlay,
}: {
  meta: MetaState
  offers: Upgrade[]
  onBuy: (id: UpgradeId) => void
  onPlay: () => void
}) {
  return (
    <div className="shop-screen">
      <div className="shop-head">
        <div className="overlay-kicker">★ SHOP ★</div>
        <div className="shop-stats">
          <span>
            Bankroll: <b className="tp-num">{meta.totalBankroll}</b>
          </span>
          <span>
            Joker: <b>{meta.activeJokers.length}</b>/{MAX_ACTIVE_JOKERS}
          </span>
        </div>
      </div>

      <div className="shop-grid">
        {offers.map((u) => {
          const owned = isOwned(meta, u.id)
          const buyable = canBuy(meta, u.id)
          const label = owned
            ? 'EQUIPATO'
            : buyable
              ? `COMPRA · ${u.cost}`
              : meta.totalBankroll < u.cost
                ? 'NO FICHES'
                : 'SLOT PIENI'
          return (
            <div key={u.id} className={`shop-card cat-${u.category}${owned ? ' owned' : ''}`}>
              <div className="shop-card-cat">{u.category}</div>
              <div className="shop-card-name">{u.name}</div>
              <div className="shop-card-desc">{u.desc}</div>
              <button
                className="btn shop-buy"
                disabled={!buyable}
                onClick={() => onBuy(u.id)}
              >
                {label}
              </button>
            </div>
          )
        })}
      </div>

      <button className="btn shop-play" onClick={onPlay}>
        GIOCA →
      </button>
      <div className="overlay-tip">Salta pure: puoi giocare senza comprare</div>
    </div>
  )
}
