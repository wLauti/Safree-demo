export type CancellationPolicy = 'flexible' | 'moderate' | 'strict'

export interface CancellationPolicyInfo {
  name: string
  description: string
  details: string[]
}

export const POLICY_INFO: Record<CancellationPolicy, CancellationPolicyInfo> = {
  flexible: {
    name: 'Flexible',
    description: 'Full refund if cancelled at least 24 hours before the experience.',
    details: [
      'Full refund up to 24 hours before start date',
      'No refund within 24 hours of start date',
    ],
  },
  moderate: {
    name: 'Moderate',
    description: 'Full refund if cancelled 7+ days before. 50% refund within 7 days.',
    details: [
      'Full refund up to 7 days before start date',
      '50% refund within 7 days of start date',
      'No refund within 24 hours of start date',
    ],
  },
  strict: {
    name: 'Strict',
    description: '50% refund if cancelled 30+ days before. No refund after.',
    details: [
      '50% refund up to 30 days before start date',
      'No refund within 30 days of start date',
    ],
  },
}

/**
 * Calculate how many calendar days until the start of an experience.
 */
export function daysUntil(startDate: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const start = new Date(startDate + 'T00:00:00')
  return Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Compute the refund amount for a cancellation.
 * @param total - Total amount paid (inclusive of service fee — service fee not refunded)
 * @param serviceFee - Service fee paid (always non-refundable)
 * @param policy - Cancellation policy tier
 * @param startDate - ISO date string for experience start
 * @returns Refund amount in dollars (0 if no refund)
 */
export function calculateRefund(
  total: number,
  serviceFee: number,
  policy: CancellationPolicy,
  startDate: string
): number {
  const days = daysUntil(startDate)
  const refundable = total - serviceFee // service fee always non-refundable

  switch (policy) {
    case 'flexible':
      return days >= 1 ? refundable : 0

    case 'moderate':
      if (days >= 7) return refundable
      if (days >= 1) return Math.round(refundable * 0.5 * 100) / 100
      return 0

    case 'strict':
      if (days >= 30) return Math.round(refundable * 0.5 * 100) / 100
      return 0
  }
}

/**
 * Human-readable explanation of how much will be refunded for a given cancellation.
 */
export function refundMessage(
  refundAmount: number,
  total: number,
  policy: CancellationPolicy,
  startDate: string
): string {
  const days = daysUntil(startDate)
  if (refundAmount <= 0) return 'This booking is non-refundable.'
  if (refundAmount >= total) return 'You will receive a full refund.'
  const pct = Math.round((refundAmount / total) * 100)
  return `You will receive a ${pct}% refund ($${refundAmount.toFixed(2)}).`
}
