import { describe, it, expect } from 'vitest'
import { UPGRADES, ALL_UPGRADES, getUpgrade, type UpgradeId } from './upgrades'

describe('catalogo upgrade', () => {
  it('contiene tutti i 22 upgrade del CR', () => {
    expect(ALL_UPGRADES).toHaveLength(22)
  })

  it('ogni voce ha id coerente con la chiave e costo positivo', () => {
    for (const [key, up] of Object.entries(UPGRADES)) {
      expect(up.id).toBe(key)
      expect(up.cost).toBeGreaterThan(0)
      expect(up.name.length).toBeGreaterThan(0)
      expect(up.desc.length).toBeGreaterThan(0)
    }
  })

  it('gli upgrade "piece" con un pezzo speciale hanno una rarità 1-su-N valida', () => {
    for (const up of ALL_UPGRADES) {
      if (up.pieceType) {
        expect(up.rarity).toBeGreaterThan(1)
      }
    }
  })

  it('le quattro categorie sono tutte rappresentate', () => {
    const cats = new Set(ALL_UPGRADES.map((u) => u.category))
    expect([...cats].sort()).toEqual(['bankroll', 'deck', 'piece', 'poker'])
  })

  it('getUpgrade ritorna la voce giusta', () => {
    const id: UpgradeId = 'HIGH_ROLLER'
    expect(getUpgrade(id).cost).toBe(500)
  })
})
