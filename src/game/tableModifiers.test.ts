import { describe, it, expect } from 'vitest'
import {
  TABLE_MODIFIERS,
  modifierForTable,
  BOSS_EVERY,
} from './tableModifiers'

describe('catalogo modificatori', () => {
  it('ogni voce ha id coerente con la chiave e targetMult > 0', () => {
    for (const [key, m] of Object.entries(TABLE_MODIFIERS)) {
      expect(m.id).toBe(key)
      expect(m.targetMult).toBeGreaterThan(0)
      expect(m.name.length).toBeGreaterThan(0)
    }
  })
})

describe('modifierForTable', () => {
  it('il tavolo 1 è sempre Standard', () => {
    expect(modifierForTable(1, 123).id).toBe('STANDARD')
    expect(modifierForTable(1, 999).id).toBe('STANDARD')
  })

  it('ogni BOSS_EVERY tavoli è un Boss', () => {
    expect(modifierForTable(BOSS_EVERY, 7).kind).toBe('boss')
    expect(modifierForTable(BOSS_EVERY * 2, 7).kind).toBe('boss')
  })

  it('i tavoli intermedi non sono Boss', () => {
    expect(modifierForTable(2, 7).kind).not.toBe('boss')
    expect(modifierForTable(3, 7).kind).not.toBe('boss')
  })

  it('è deterministico (stesso seed+tavolo → stesso modificatore)', () => {
    expect(modifierForTable(4, 42).id).toBe(modifierForTable(4, 42).id)
  })

  it('seed diversi possono dare modificatori diversi', () => {
    const ids = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].flatMap((s) =>
        [2, 3, 4, 6, 7].map((t) => modifierForTable(t, s).id),
      ),
    )
    expect(ids.size).toBeGreaterThan(1)
  })
})
