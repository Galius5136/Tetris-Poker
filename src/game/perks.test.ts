import { describe, it, expect } from 'vitest'
import { BASE_MODIFIERS, applyModifiers, evalSlot } from './perks'

describe('applyModifiers', () => {
  it('senza perk lascia invariato', () => {
    expect(applyModifiers(50, BASE_MODIFIERS)).toBe(50)
  })
  it('applica moltiplicatore e bonus per pulizia', () => {
    expect(applyModifiers(50, { mult: 2, bonusPerClear: 10 })).toBe(110)
  })
})

describe('evalSlot (allineamenti)', () => {
  it('tre 7 → moltiplicatore ×2', () => {
    const o = evalSlot(['7', '7', '7'])
    expect(o.label).toBe('777')
    expect(o.apply(BASE_MODIFIERS).mods.mult).toBe(2)
  })
  it('due diamanti → +60 fiches', () => {
    const o = evalSlot(['💎', '💎', '7'])
    expect(o.apply(BASE_MODIFIERS).fiches).toBe(60)
  })
  it('tre batte due (priorità al tris)', () => {
    // tre stelle: deve dare il premio "three", non "two"
    const o = evalSlot(['⭐', '⭐', '⭐'])
    expect(o.apply(BASE_MODIFIERS).mods.bonusPerClear).toBe(30)
  })
  it('nessuna coppia → consolazione +20', () => {
    const o = evalSlot(['7', '💎', '⭐'])
    expect(o.apply(BASE_MODIFIERS).fiches).toBe(20)
  })
})
