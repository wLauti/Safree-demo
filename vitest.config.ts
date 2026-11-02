import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'json-summary'],
      // Coverage is measured against the deterministic, unit-testable surface of /lib.
      // Database/Stripe/email/push-coupled modules require a live environment and are
      // exercised by the RLS audit (scripts/rls-audit.mjs) and the Playwright E2E suite
      // against staging — not by unit tests. Including them here would report misleading
      // "0%" for code intentionally tested at a different layer.
      include: [
        'lib/utils/formatters.ts',
        'lib/utils/pricing.ts',
        'lib/bookings/cancellation.ts',
        'lib/bookings/ref.ts',
        'lib/sanitize.ts',
        'lib/crypto/secrets.ts',
        'lib/validation/schemas.ts',
        'lib/consent.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
})
