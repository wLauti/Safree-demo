import { formatCurrency } from './formatters'

/** Alias matching common naming — formats a number as USD. */
export const formatPrice = formatCurrency

/**
 * Calculate the platform commission on a dollar amount.
 * @param amount   gross amount in dollars
 * @param ratePct  commission rate as a percentage (e.g. 5 for 5%)
 * @returns commission in dollars, rounded to cents
 */
export function calculateCommission(amount: number, ratePct: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  const rate = Math.max(0, Math.min(ratePct, 100))
  return Math.round(amount * (rate / 100) * 100) / 100
}

/**
 * Calculate the platform commission in integer cents (for Stripe).
 * @param amountCents gross amount in cents
 * @param ratePct     commission rate as a percentage
 */
export function calculateCommissionCents(amountCents: number, ratePct: number): number {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return 0
  const rate = Math.max(0, Math.min(ratePct, 100))
  return Math.round(amountCents * (rate / 100))
}

/** Net amount paid out to a seller after commission (dollars). */
export function netAfterCommission(amount: number, ratePct: number): number {
  return Math.round((amount - calculateCommission(amount, ratePct)) * 100) / 100
}
