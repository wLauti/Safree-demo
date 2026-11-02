/**
 * Generate a human-readable, reasonably-unique booking reference.
 * Format: BK-<base36 timestamp>-<4 random base36 chars>, e.g. "BK-1Q2W3E-9XYZ".
 */
export function generateBookingRef(prefix = 'BK'): string {
  const ts = ((Date.now() / 1000) | 0).toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${ts}-${rand}`
}

/** Generate a dispute reference, e.g. "DIS-AB12C3456". */
export function generateDisputeRef(): string {
  return `DIS-${Math.random().toString(36).slice(2, 7).toUpperCase()}${(Date.now() % 10000).toString().padStart(4, '0')}`
}

/** Validate the shape of a booking reference. */
export function isValidBookingRef(ref: string): boolean {
  return /^BK-[0-9A-Z]+-[0-9A-Z]{4}$/.test(ref)
}
