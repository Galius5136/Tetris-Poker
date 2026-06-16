import { describe, it, expect } from 'vitest'
import { REEL_PERKS, BASE_MODIFIERS, applyModifiers } from './perks'

describe('applyModifiers', () => {
  it('senza perk lascia invariato', () => {
    expect(applyModifiers(50, BASE_MODIFIERS)).toBe(50)
  })
  it('applica moltiplicatore e bonus per pulizia', () => {
    expect(applyModifiers(50, { mult: 2, bonusPerClear: 10 })).toBe(110)
  })
})

describe('perk del rullo', () => {
  it('il moltiplicatore ×1.5 raddoppia... no, moltiplica per 1.5', () => {
    const m15 = REEL_PERKS.find((p) => p.id === 'm15')!
    const { mods, fiches } = m15.apply(BASE_MODIFIERS)
    expect(mods.mult).toBe(1.5)
    expect(fiches).toBe(0)
  })
  it('il perk fiches immediate non tocca i modificatori', () => {
    const f40 = REEL_PERKS.find((p) => p.id === 'f40')!
    const { mods, fiches } = f40.apply(BASE_MODIFIERS)
    expect(fiches).toBe(40)
    expect(mods).toEqual(BASE_MODIFIERS)
  })
  it('il bonus per riga si accumula', () => {
    const bpc = REEL_PERKS.find((p) => p.id === 'bpc')!
    const once = bpc.apply(BASE_MODIFIERS).mods
    const twice = bpc.apply(once).mods
    expect(twice.bonusPerClear).toBe(30)
  })
})
