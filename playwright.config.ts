import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E config. Runs against a STAGING deployment only.
 * Set E2E_BASE_URL to your staging URL; specs self-skip if it is absent so CI
 * unit runs aren't blocked. Use Stripe test-mode cards throughout.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-iphone', use: { ...devices['iPhone 14'] } },
    { name: 'mobile-android', use: { ...devices['Pixel 7'] } },
  ],
})
