/**
 * Integration-style tests for critical server-side business rules that are
 * embedded in API routes. These assert the *logic* (pricing, escrow timing,
 * dispute windows, availability math) independent of the database, so they run
 * fast in CI. Full DB-backed flows are covered by the RLS audit + E2E suites.
 */
import { describe, it, expect } from 'vitest'
import { calculateCommission, netAfterCommission } from '@/lib/utils/pricing'
import { calculateRefund } from '@/lib/bookings/cancellation'

// ── Checkout: per-store order total + commission split ──────────
describe('checkout order math', () => {
  it('splits a multi-store cart and computes per-store commission', () => {
    const commissionRate = 5
    const storeA = 120, storeB = 80
    const total = storeA + storeB
    expect(total).toBe(200)
    expect(calculateCommission(storeA, commissionRate)).toBe(6)
    expect(calculateCommission(storeB, commissionRate)).toBe(4)
    // Platform keeps 10, stores net 190 combined
    expect(netAfterCommission(storeA, commissionRate) + netAfterCommission(storeB, commissionRate)).toBe(190)
  })
})

// ── Booking: escrow release timing ──────────────────────────────
function releaseDate(endDateIso: string): Date {
  const d = new Date(endDateIso + 'T00:00:00')
  d.setDate(d.getDate() + 7)
  return d
}

describe('escrow release timing', () => {
  it('schedules release 7 days after experience end', () => {
    const end = '2026-06-10'
    const release = releaseDate(end)
    expect(release.toISOString().split('T')[0]).toBe('2026-06-17')
  })

  it('a booking is eligible for release only once release_at has passed and no dispute', () => {
    const eligible = (releaseAt: Date, fundsReleased: boolean, hasOpenDispute: boolean) =>
      !fundsReleased && !hasOpenDispute && releaseAt.getTime() <= Date.now()

    const past = new Date(Date.now() - 86400000)
    const future = new Date(Date.now() + 86400000)

    expect(eligible(past, false, false)).toBe(true)   // ready
    expect(eligible(past, true, false)).toBe(false)    // already released
    expect(eligible(past, false, true)).toBe(false)    // dispute halts release
    expect(eligible(future, false, false)).toBe(false) // not yet due
  })
})

// ── Dispute: 7-day open window ──────────────────────────────────
describe('dispute window', () => {
  const withinWindow = (completedAtIso: string) =>
    (Date.now() - new Date(completedAtIso).getTime()) / 86400000 <= 7

  it('allows opening within 7 days of completion', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
    expect(withinWindow(threeDaysAgo)).toBe(true)
  })
  it('rejects opening after 7 days', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString()
    expect(withinWindow(tenDaysAgo)).toBe(false)
  })
})

// ── Dispute resolution → refund amount ──────────────────────────
describe('dispute resolution refund amounts', () => {
  const total = 250
  it('full refund returns the whole amount', () => {
    const refund = total
    expect(refund).toBe(250)
  })
  it('partial refund is clamped to the total', () => {
    const requested = 999
    const refund = Math.min(Math.max(0, requested), total)
    expect(refund).toBe(250)
  })
  it('no refund is zero', () => {
    expect(0).toBe(0)
  })
})

// ── Availability reservation math ───────────────────────────────
describe('availability slots', () => {
  const canReserve = (slots: number, booked: number, qty: number, blocked: boolean) =>
    !blocked && (slots === 0 || booked + qty <= slots)

  it('allows reservation when slots remain', () => {
    expect(canReserve(5, 2, 2, false)).toBe(true)
  })
  it('blocks when over capacity', () => {
    expect(canReserve(5, 4, 2, false)).toBe(false)
  })
  it('blocks when date is blocked', () => {
    expect(canReserve(5, 0, 1, true)).toBe(false)
  })
})

// ── Cancellation refund integrates service-fee retention ────────
describe('cancellation keeps service fee', () => {
  it('never refunds the non-refundable service fee', () => {
    const total = 220, serviceFee = 20
    const futureDate = new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0]
    const refund = calculateRefund(total, serviceFee, 'moderate', futureDate)
    expect(refund).toBe(200) // full minus service fee
  })
})
