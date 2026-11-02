import { test, expect, STAGING_READY, TEST_USER, fillStripeCard, login } from './helpers'

// Journey 2 — Full booking:
// User searches map → selects experience → selects dates → pays →
// receives voucher → (coto marks completed) → user leaves review.
test.describe('Journey 2 — Experience booking', () => {
  test.skip(!STAGING_READY, 'Set E2E_BASE_URL to run against staging')

  test('user can book an experience and download a voucher', async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password)

    // Discover via map
    await page.goto('/map')
    await expect(page.getByText(/find grounds/i)).toBeVisible()

    // Open the first experience card
    await page.locator('a[href^="/experiences/"]').first().click()
    await expect(page).toHaveURL(/\/experiences\//)

    // Start booking
    await page.getByRole('button', { name: /book|request to book|select dates/i }).first().click()
    await expect(page).toHaveURL(/\/booking\//)

    // Select an available date in the calendar (first enabled day button)
    const availableDay = page.locator('button:not([disabled])', { hasText: /^\d+$/ }).first()
    await availableDay.click()

    // Proceed: dates → add-ons → review → payment
    await page.getByRole('button', { name: /continue/i }).click()       // dates → addons
    await page.getByRole('button', { name: /continue/i }).click()       // addons → review

    // Age disclaimer visible on review
    await expect(page.getByText(/18 years of age or older/i)).toBeVisible()

    await page.getByRole('button', { name: /proceed to payment/i }).click()
    await fillStripeCard(page)
    await page.getByRole('button', { name: /confirm.*pay/i }).click()

    // Confirmation + voucher download link
    await expect(page).toHaveURL(/\/booking\/confirmation\//, { timeout: 30_000 })
    await expect(page.getByText(/booking confirmed/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /download.*voucher/i })).toBeVisible()
  })
})
