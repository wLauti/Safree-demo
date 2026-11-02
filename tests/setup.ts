// Vitest global setup. Provides deterministic env for pure-function tests.
import { vi } from 'vitest'

// Stable base URL for any helper that reads it.
process.env.NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://safree.test'
// Deterministic key so crypto round-trip tests are reproducible.
process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY ??
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

// Silence noisy console.error in expected-error paths unless DEBUG_TESTS is set.
if (!process.env.DEBUG_TESTS) {
  vi.spyOn(console, 'error').mockImplementation(() => {})
}
