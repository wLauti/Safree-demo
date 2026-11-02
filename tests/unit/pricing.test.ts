import { describe, it, expect } from 'vitest'
import {
  calculateCommission, calculateCommissionCents, netAfterCommission, formatPrice,
} from '@/lib/utils/pricing'

describe('calculateCommission', () => {
  it('computes 5% of an amount', () => {
    expect(calculateCommission(100, 5)).toBe(5)
  })
  it('rounds to cents', () => {
    expect(calculateCommission(99.99, 5)).toBe(5)        // 4.9995 -> 5.00
    expect(calculateCommission(33.33, 7)).toBe(2.33)     // 2.3331 -> 2.33
  })
  it('returns 0 for non-positive or invalid amounts', () => {
    expect(calculateCommission(0, 5)).toBe(0)
    expect(calculateCommission(-10, 5)).toBe(0)
    expect(calculateCommission(NaN, 5)).toBe(0)
  })
  it('clamps the rate to 0..100', () => {
    expect(calculateCommission(100, -5)).toBe(0)
    expect(calculateCommission(100, 150)).toBe(100)
  })
})

describe('calculateCommissionCents', () => {
  it('computes integer cents', () => {
    expect(calculateCommissionCents(10000, 5)).toBe(500)
  })
  it('rounds to the nearest cent', () => {
    expect(calculateCommissionCents(3333, 7)).toBe(233) // 233.31 -> 233
  })
  it('returns 0 for invalid input', () => {
    expect(calculateCommissionCents(0, 5)).toBe(0)
  })
})

describe('netAfterCommission', () => {
  it('subtracts the commission', () => {
    expect(netAfterCommission(100, 5)).toBe(95)
  })
})

describe('formatPrice alias', () => {
  it('formats like currency', () => {
    expect(formatPrice(50)).toBe('$50.00')
  })
})
