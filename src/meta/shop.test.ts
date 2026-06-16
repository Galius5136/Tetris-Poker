import { describe, it, expect } from 'vitest'
import { INITIAL_META } from './metaGameStore'
import { selectShop, canBuy, buyUpgrade, SHOP_SIZE } from './shop'
import { UPGRADES } from './upgrades'

describe('selectShop', () => {
  it('offre SHOP_SIZE upgrade', () => {
    expect(selectShop(INITIAL_META)).toHaveLength(SHOP_SIZE)
  })

  it('è deterministico (stesso meta → stessa vetrina)', () => {
    const a = selectShop(INITIAL_META).map((u) => u.id)
    const b = selectShop(INITIAL_META).map((u) => u.id)
    expect(a).toEqual(b)
  })

  it('ruota ogni 3 run', () => {
    const r0 = selectShop({ ...INITIAL_META, runsPlayed: 0 }).map((u) => u.id)
    const r2 = selectShop({ ...INITIAL_META, runsPlayed: 2 }).map((u) => u.id)
    const r3 = selectShop({ ...INITIAL_META, runsPlayed: 3 }).map((u) => u.id)
    expect(r2).toEqual(r0) // stessa finestra (0,1,2)
    expect(r3).not.toEqual(r0) // nuova finestra
  })

  it('non offre upgrade già posseduti', () => {
    const meta = { ...INITIAL_META, purchasedUpgrades: ['HIGH_ROLLER' as const] }
    const ids = selectShop(meta).map((u) => u.id)
    expect(ids).not.toContain('HIGH_ROLLER')
  })
})

describe('acquisto', () => {
  it('scala il costo, sblocca ed equipaggia', () => {
    const meta = { ...INITIAL_META, totalBankroll: 1000 }
    const after = buyUpgrade(meta, 'PAIR_GRINDER')
    expect(after.totalBankroll).toBe(1000 - UPGRADES.PAIR_GRINDER.cost)
    expect(after.purchasedUpgrades).toContain('PAIR_GRINDER')
    expect(after.activeJokers).toContain('PAIR_GRINDER')
  })

  it('senza fiches non si può comprare', () => {
    const meta = { ...INITIAL_META, totalBankroll: 10 }
    expect(canBuy(meta, 'HIGH_ROLLER')).toBe(false)
    expect(buyUpgrade(meta, 'HIGH_ROLLER')).toEqual(meta)
  })

  it('non si superano i 5 joker attivi', () => {
    const meta = {
      ...INITIAL_META,
      totalBankroll: 100000,
      activeJokers: [
        'PAIR_GRINDER',
        'POKER_KICKER',
        'MIRROR_PIECE',
        'STRAIGHT_GAP',
        'REMOVE_LOW_CARDS',
      ] as const,
    }
    expect(canBuy({ ...meta, activeJokers: [...meta.activeJokers] }, 'HIGH_ROLLER')).toBe(false)
  })

  it('non si compra due volte lo stesso', () => {
    const meta = {
      ...INITIAL_META,
      totalBankroll: 100000,
      purchasedUpgrades: ['HIGH_ROLLER' as const],
    }
    expect(canBuy(meta, 'HIGH_ROLLER')).toBe(false)
  })
})
