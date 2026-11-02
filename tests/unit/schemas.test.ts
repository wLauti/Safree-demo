import { describe, it, expect } from 'vitest'
import {
  reviewSchema, disputeOpenSchema, disputeRespondSchema,
  disputeResolveSchema, contentFlagSchema, accountDeleteSchema, consentSchema,
} from '@/lib/validation/schemas'

const UUID = '11111111-1111-1111-1111-111111111111'

describe('reviewSchema', () => {
  it('accepts a valid review', () => {
    const r = reviewSchema.safeParse({ ref_type: 'order', ref_id: UUID, rating: 5, body: 'Great', anonymous: true })
    expect(r.success).toBe(true)
  })
  it('rejects rating out of range', () => {
    expect(reviewSchema.safeParse({ ref_type: 'order', ref_id: UUID, rating: 6 }).success).toBe(false)
    expect(reviewSchema.safeParse({ ref_type: 'order', ref_id: UUID, rating: 0 }).success).toBe(false)
  })
  it('rejects non-uuid ref_id', () => {
    expect(reviewSchema.safeParse({ ref_type: 'order', ref_id: 'nope', rating: 4 }).success).toBe(false)
  })
  it('rejects body over 1000 chars', () => {
    expect(reviewSchema.safeParse({ ref_type: 'booking', ref_id: UUID, rating: 4, body: 'x'.repeat(1001) }).success).toBe(false)
  })
  it('rejects invalid ref_type', () => {
    expect(reviewSchema.safeParse({ ref_type: 'thing', ref_id: UUID, rating: 4 }).success).toBe(false)
  })
})

describe('disputeOpenSchema', () => {
  it('accepts valid input', () => {
    const r = disputeOpenSchema.safeParse({
      ref_type: 'order', ref_id: UUID, reason_category: 'Item damaged',
      description: 'x'.repeat(60),
    })
    expect(r.success).toBe(true)
  })
  it('rejects description under 50 chars', () => {
    expect(disputeOpenSchema.safeParse({
      ref_type: 'order', ref_id: UUID, reason_category: 'Other', description: 'too short',
    }).success).toBe(false)
  })
  it('rejects more than 5 evidence files', () => {
    expect(disputeOpenSchema.safeParse({
      ref_type: 'order', ref_id: UUID, reason_category: 'Other',
      description: 'x'.repeat(60), evidence_urls: Array(6).fill('https://safree.test/f.png'),
    }).success).toBe(false)
  })
})

describe('disputeRespondSchema', () => {
  it('requires a 50-char minimum response', () => {
    expect(disputeRespondSchema.safeParse({ response: 'short' }).success).toBe(false)
    expect(disputeRespondSchema.safeParse({ response: 'x'.repeat(50) }).success).toBe(true)
  })
})

describe('disputeResolveSchema', () => {
  it('accepts valid resolution types', () => {
    expect(disputeResolveSchema.safeParse({ resolution_type: 'full_refund' }).success).toBe(true)
    expect(disputeResolveSchema.safeParse({ resolution_type: 'partial_refund', refund_amount: 25 }).success).toBe(true)
  })
  it('rejects unknown resolution type', () => {
    expect(disputeResolveSchema.safeParse({ resolution_type: 'maybe' }).success).toBe(false)
  })
  it('rejects negative refund amount', () => {
    expect(disputeResolveSchema.safeParse({ resolution_type: 'partial_refund', refund_amount: -5 }).success).toBe(false)
  })
})

describe('contentFlagSchema', () => {
  it('accepts review/product/experience targets', () => {
    expect(contentFlagSchema.safeParse({ ref_type: 'review', ref_id: UUID, reason: 'Spam' }).success).toBe(true)
  })
  it('rejects invalid target type', () => {
    expect(contentFlagSchema.safeParse({ ref_type: 'comment', ref_id: UUID, reason: 'Spam' }).success).toBe(false)
  })
})

describe('accountDeleteSchema', () => {
  it('requires the literal DELETE token', () => {
    expect(accountDeleteSchema.safeParse({ confirm: 'DELETE' }).success).toBe(true)
    expect(accountDeleteSchema.safeParse({ confirm: 'delete' }).success).toBe(false)
    expect(accountDeleteSchema.safeParse({ confirm: 'yes' }).success).toBe(false)
  })
})

describe('consentSchema', () => {
  it('requires boolean flags', () => {
    expect(consentSchema.safeParse({ analytics: true, functional: false }).success).toBe(true)
    expect(consentSchema.safeParse({ analytics: 'yes', functional: false }).success).toBe(false)
  })
})
