import { test, expect, STAGING_READY, TEST_USER, TEST_ADMIN, login } from './helpers'

// Journey 3 — Dispute resolution:
// User opens dispute → store responds → admin resolves with refund → both notified.
test.describe('Journey 3 — Dispute resolution', () => {
  test.skip(!STAGING_READY, 'Set E2E_BASE_URL to run against staging')

  test('user opens a dispute on a delivered order', async ({ page }) => {
    await login(page, TEST_USER.email, TEST_USER.password)

    // Find a delivered order
    await page.goto('/user/orders')
    await page.locator('a[href^="/user/orders/"]').first().click()

    const openBtn = page.getByRole('button', { name: /open dispute/i })
    if (await openBtn.count() === 0) test.skip(true, 'No dispute-eligible order in staging seed')

    await openBtn.click()
    await page.getByRole('combobox').first().selectOption({ index: 1 })
    await page.getByPlaceholder(/describe the issue/i).fill(
      'The item arrived damaged and does not match the listing photos in several ways.'
    )
    await page.getByRole('button', { name: /submit dispute/i }).click()
    await expect(page.getByText(/dispute opened|DIS-/i)).toBeVisible()
  })

  test('admin can resolve a dispute with a refund', async ({ page }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password)
    await page.goto('/admin/disputes')

    const firstDispute = page.locator('a[href^="/admin/disputes/"]').first()
    if (await firstDispute.count() === 0) test.skip(true, 'No disputes to resolve in staging')

    await firstDispute.click()
    const resolveBtn = page.getByRole('button', { name: /confirm resolution/i })
    if (await resolveBtn.count() === 0) test.skip(true, 'Dispute already resolved')

    await page.getByText(/full refund/i).click()
    await resolveBtn.click()
    await expect(page.getByText(/resolved|refunded/i)).toBeVisible()
  })
})
