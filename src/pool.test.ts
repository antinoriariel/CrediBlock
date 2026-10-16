import { describe, expect, it } from 'vitest'
import * as P from './pool'

const funded = () => P.advanceMonth(P.deposit(P.newPool(), 'ana', 100000)) // 3000 de Rendimiento

describe('Pool', () => {
  it('retira el Capital íntegro', () => {
    const s = P.withdraw(funded(), 'ana', 100000)
    expect(P.totalCapital(s)).toBe(0)
    expect(() => P.withdraw(s, 'ana', 1)).toThrow()
  })

  it('solo presta Rendimiento y frena si no alcanza', () => {
    const s = funded()
    expect(() => P.requestLoan(P.advanceMonth(P.newPool()), 'bo', 500)).toThrow(/Rendimiento/)
    const l = P.requestLoan(s, 'bo', 1000)
    expect(l.yieldAvailable).toBe(2000)
    expect(P.totalCapital(l)).toBe(100000)
  })

  it('respeta el Límite inicial', () => {
    expect(() => P.requestLoan(funded(), 'bo', 1001)).toThrow(/Límite/)
  })

  it('cada cuota sube el Límite y reparte el Interés 50/50', () => {
    let s = P.requestLoan(funded(), 'bo', 1000)
    s = P.payInstallment(s, 1)
    expect(P.limitOf(s, 'bo')).toBe(1500)
    // 2000 + principal 1000/3 + interés 100/3 * 1/2; Ana cobra la otra mitad
    expect(s.yieldAvailable).toBeCloseTo(2000 + 1000 / 3 + 100 / 6)
    expect(s.earnings.ana).toBeCloseTo(100 / 6)
    for (const n of [1, 1]) s = P.payInstallment(s, n)
    expect(s.loans[0].status).toBe('closed')
    expect(s.history.bo).toHaveLength(3)
  })

  it('la Mora no toca el Capital, bloquea y deja Historial', () => {
    let s = P.requestLoan(funded(), 'bo', 1000)
    s = P.payInstallment(s, 1)
    const capital = P.totalCapital(s)
    s = P.markDefault(s, 1)
    expect(P.totalCapital(s)).toBe(capital)
    expect(s.losses).toBeCloseTo((1000 * 2) / 3)
    expect(P.limitOf(s, 'bo')).toBe(0)
    expect(s.history.bo.at(-1)?.type).toBe('default')
    expect(() => P.requestLoan(s, 'bo', 100)).toThrow()
  })
})
