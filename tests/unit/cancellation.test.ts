import { describe, it, expect } from 'vitest'
import { calculateRefund, daysUntil, refundMessage, POLICY_INFO } from '@/lib/bookings/cancellation'

function isoInDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

describe('daysUntil', () => {
  it('returns ~10 for a date 10 days out', () => {
    expect(daysUntil(isoInDays(10))).toBeGreaterThanOrEqual(9)
    expect(daysUntil(isoInDays(10))).toBeLessThanOrEqual(10)
  })
  it('returns negative for past dates', () => {
    expect(daysUntil(isoInDays(-3))).toBeLessThan(0)
  })
})

describe('calculateRefund — flexible', () => {
  it('full refund (minus service fee) when >= 1 day out', () => {
    expect(calculateRefund(110, 10, 'flexible', isoInDays(2))).toBe(100)
  })
  it('no refund within 24h', () => {
    expect(calculateRefund(110, 10, 'flexible', isoInDays(0))).toBe(0)
  })
})

describe('calculateRefund — moderate', () => {
  it('full refundable amount when >= 7 days out', () => {
    expect(calculateRefund(110, 10, 'moderate', isoInDays(8))).toBe(100)
  })
  it('half when between 1 and 7 days', () => {
    expect(calculateRefund(110, 10, 'moderate', isoInDays(3))).toBe(50)
  })
  it('none within 24h', () => {
    expect(calculateRefund(110, 10, 'moderate', isoInDays(0))).toBe(0)
  })
})

describe('calculateRefund — strict', () => {
  it('half when >= 30 days out', () => {
    expect(calculateRefund(110, 10, 'strict', isoInDays(31))).toBe(50)
  })
  it('none within 30 days', () => {
    expect(calculateRefund(110, 10, 'strict', isoInDays(10))).toBe(0)
  })
})

describe('refundMessage', () => {
  it('non-refundable message at 0', () => {
    expect(refundMessage(0, 100, 'strict', isoInDays(1))).toMatch(/non-refundable/i)
  })
  it('full refund message when refund >= total', () => {
    expect(refundMessage(100, 100, 'flexible', isoInDays(2))).toMatch(/full refund/i)
  })
  it('percentage message for partial', () => {
    expect(refundMessage(50, 100, 'moderate', isoInDays(3))).toMatch(/50% refund/)
  })
})

describe('POLICY_INFO', () => {
  it('has all three tiers with details', () => {
    for (const tier of ['flexible', 'moderate', 'strict'] as const) {
      expect(POLICY_INFO[tier].name).toBeTruthy()
      expect(POLICY_INFO[tier].details.length).toBeGreaterThan(0)
    }
  })
})
