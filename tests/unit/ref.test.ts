import { describe, it, expect } from 'vitest'
import { generateBookingRef, generateDisputeRef, isValidBookingRef } from '@/lib/bookings/ref'

describe('generateBookingRef', () => {
  it('matches the BK-<ts>-<rand> format', () => {
    const ref = generateBookingRef()
    expect(ref).toMatch(/^BK-[0-9A-Z]+-[0-9A-Z]{4}$/)
    expect(isValidBookingRef(ref)).toBe(true)
  })
  it('honors a custom prefix', () => {
    expect(generateBookingRef('EXP').startsWith('EXP-')).toBe(true)
  })
  it('produces unique refs across calls', () => {
    const set = new Set(Array.from({ length: 50 }, () => generateBookingRef()))
    expect(set.size).toBe(50)
  })
})

describe('generateDisputeRef', () => {
  it('starts with DIS-', () => {
    expect(generateDisputeRef().startsWith('DIS-')).toBe(true)
  })
})

describe('isValidBookingRef', () => {
  it('rejects malformed refs', () => {
    expect(isValidBookingRef('BK-123')).toBe(false)
    expect(isValidBookingRef('XX-ABC-1234')).toBe(false)
    expect(isValidBookingRef('')).toBe(false)
  })
})
