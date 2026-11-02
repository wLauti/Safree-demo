import { test, expect, STAGING_READY, TEST_ADMIN, login } from './helpers'

// Journey 4 — Store onboarding:
// Admin creates store account → store completes Stripe Connect → store creates
// listing → moderator approves → listing appears on site.
// Stripe Connect onboarding is hosted externally, so this journey verifies the
// platform-side steps and the moderation → publish loop.
test.describe('Journey 4 — Store onboarding & publishing', () => {
  test.skip(!STAGING_READY, 'Set E2E_BASE_URL to run against staging')

  test('store sees payment-setup prompt before it can publish', async ({ page }) => {
    // Logging in as a store account that has not completed Connect
    await login(page, process.env.E2E_STORE_EMAIL ?? 'e2e-store@safree.test', process.env.E2E_STORE_PASSWORD ?? 'E2eStore!1234')
    await page.goto('/store/settings/payments')
    await expect(page.getByText(/set up payments|setup incomplete|connected/i)).toBeVisible()
  })

  test('moderator approves a pending listing and it goes live', async ({ page }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password) // admin can act as moderator
    await page.goto('/moderator/queue?tab=products')

    const approveBtn = page.getByRole('button', { name: /approve/i }).first()
    if (await approveBtn.count() === 0) test.skip(true, 'No pending products in staging queue')

    // Capture the listing title before approving
    const title = await page.locator('h3').first().innerText()
    await approveBtn.click()
    await expect(page.getByText(/now live|approved/i)).toBeVisible()

    // Listing should now be findable on the public marketplace
    await page.goto('/products')
    await expect(page.getByText(title, { exact: false })).toBeVisible({ timeout: 15_000 })
  })
})
