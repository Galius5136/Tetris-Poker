import { describe, it, expect } from 'vitest'
import {
  buildRunConfig,
  handPointsWithConfig,
  startingBankroll,
  NEUTRAL_CONFIG,
} from './runConfig'

describe('buildRunConfig', () => {
  it('senza joker è neutro', () => {
    expect(buildRunConfig([])).toEqual(NEUTRAL_CONFIG)
  })
  it('HIGH_ROLLER → +25%', () => {
    expect(buildRunConfig(['HIGH_ROLLER']).handPayoutMult).toBe(1.25)
  })
  it('attiva i flag giusti', () => {
    const c = buildRunConfig(['SUIT_PREMIUM', 'PAIR_GRINDER', 'STREAK_BONUS'])
    expect(c.flushDouble).toBe(true)
    expect(c.pairTriple).toBe(true)
    expect(c.streakBonus).toBe(true)
  })
})

describe('handPointsWithConfig', () => {
  it('PAIR_GRINDER triplica coppia (cat 2) e doppia coppia (cat 3)', () => {
    const c = buildRunConfig(['PAIR_GRINDER'])
    expect(handPointsWithConfig(2, 11, c)).toBe(33)
    expect(handPointsWithConfig(3, 18, c)).toBe(54)
  })
  it('SUIT_PREMIUM raddoppia colore (6) e scala colore (9), non il full (7)', () => {
    const c = buildRunConfig(['SUIT_PREMIUM'])
    expect(handPointsWithConfig(6, 50, c)).toBe(100)
    expect(handPointsWithConfig(9, 150, c)).toBe(300)
    expect(handPointsWithConfig(7, 65, c)).toBe(65)
  })
  it('senza config lascia invariato', () => {
    expect(handPointsWithConfig(2, 11, NEUTRAL_CONFIG)).toBe(11)
  })
})

describe('startingBankroll (Compound Interest)', () => {
  it('senza il perk parte da 0', () => {
    expect(startingBankroll(NEUTRAL_CONFIG, 1000)).toBe(0)
  })
  it('col perk parte dal finale precedente ×1.1', () => {
    const c = buildRunConfig(['COMPOUNDING_INTEREST'])
    expect(startingBankroll(c, 1000)).toBe(1100)
  })
})
