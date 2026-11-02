import { test, expect, STAGING_READY, TEST_ADMIN, login } from './helpers'

// Journey 5 — Admin credential update:
// Admin re-authenticates → opens credentials panel → updates a credential →
// action logged in audit_log.
test.describe('Journey 5 — Admin credential update', () => {
  test.skip(!STAGING_READY, 'Set E2E_BASE_URL to run against staging')

  test('admin must re-authenticate to view credentials', async ({ page }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password)
    await page.goto('/admin/credentials')

    // Re-auth gate
    await expect(page.getByText(/confirm your identity/i)).toBeVisible()
    await page.getByPlaceholder(/your password/i).fill(TEST_ADMIN.password)
    await page.getByRole('button', { name: /unlock credentials/i }).click()

    // Panel unlocked — values are masked
    await expect(page.getByText(/Stripe/i)).toBeVisible()
    await expect(page.getByText(/Analytics ID/i)).toBeVisible()
  })

  test('updating a credential records an audit entry', async ({ page }) => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password)
    await page.goto('/admin/credentials')
    await page.getByPlaceholder(/your password/i).fill(TEST_ADMIN.password)
    await page.getByRole('button', { name: /unlock credentials/i }).click()

    // Edit the Analytics ID
    const credentialRow = page.locator('text=Analytics ID').locator('..').locator('..')
    await credentialRow.getByTitle(/edit/i).click()
    await page.locator('input').last().fill('G-E2ETEST123')
    await page.getByRole('button', { name: /confirm.*save/i }).click()
    await expect(page.getByText(/updated/i)).toBeVisible()

    // Verify the audit log shows a credential_updated entry
    await page.goto('/admin/audit-log')
    await expect(page.getByText(/credential_updated/i).first()).toBeVisible()
  })
})
