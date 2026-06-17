import { describe, it, expect } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('stesso seed → stessa sequenza', () => {
    const a = createRng(123)
    const b = createRng(123)
    const seqA = [a.next(), a.next(), a.next()]
    const seqB = [b.next(), b.next(), b.next()]
    expect(seqA).toEqual(seqB)
  })

  it('seed diversi → sequenze diverse', () => {
    const a = createRng(1)
    const b = createRng(2)
    expect(a.next()).not.toBe(b.next())
  })

  it('next() resta in [0,1)', () => {
    const r = createRng(7)
    for (let i = 0; i < 100; i++) {
      const v = r.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int(n) resta in [0,n)', () => {
    const r = createRng(42)
    for (let i = 0; i < 100; i++) {
      const v = r.int(10)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(10)
    }
  })

  it('shuffle è deterministico per seed e preserva gli elementi', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7]
    const s1 = createRng(99).shuffle(arr)
    const s2 = createRng(99).shuffle(arr)
    expect(s1).toEqual(s2)
    expect([...s1].sort((x, y) => x - y)).toEqual(arr) // stessi elementi
    expect(arr).toEqual([1, 2, 3, 4, 5, 6, 7]) // immutabile
  })
})
