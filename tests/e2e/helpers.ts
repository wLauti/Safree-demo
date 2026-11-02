import { test as base, expect, type Page } from '@playwright/test'

/**
 * Shared E2E helpers. The suite targets a staging deployment with Stripe test mode.
 * Credentials come from env so no secrets live in the repo.
 */
export const STAGING_READY = !!process.env.E2E_BASE_URL

export const TEST_USER = {
  email: process.env.E2E_USER_EMAIL ?? 'e2e-user@safree.test',
  password: process.env.E2E_USER_PASSWORD ?? 'E2eTest!1234',
}
export const TEST_ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'e2e-admin@safree.test',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'E2eAdmin!1234',
}

// Stripe test card — always succeeds in test mode.
export const STRIPE_TEST_CARD = {
  number: '4242 4242 4242 4242',
  expiry: '12 / 34',
  cvc: '123',
  zip: '78701',
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/(user|store|admin|moderator|)$/, { timeout: 15_000 }).catch(() => {})
}

/** Fill the Stripe Payment Element (rendered in an iframe). */
export async function fillStripeCard(page: Page) {
  const frame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
  await frame.getByPlaceholder(/card number|1234 1234/i).fill(STRIPE_TEST_CARD.number)
  await frame.getByPlaceholder(/MM ?\/ ?YY/i).fill('1234')
  await frame.getByPlaceholder(/CVC/i).fill(STRIPE_TEST_CARD.cvc)
}

export const test = base
export { expect }
