import { test, expect, STAGING_READY, TEST_USER, fillStripeCard, login } from './helpers'

// Journey 1 — Full product purchase:
// Guest browses → adds to cart → registers/logs in → cart merges → checkout →
// Stripe test card → order confirmation.
test.describe('Journey 1 — Product purchase', () => {
  test.skip(!STAGING_READY, 'Set E2E_BASE_URL to run against staging')

  test('guest can browse, add to cart, log in, and complete checkout', async ({ page }) => {
    // Browse marketplace
    await page.goto('/products')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Open the first product
    await page.locator('a[href^="/products/"]').first().click()
    await expect(page).toHaveURL(/\/products\//)

    // Add to cart
    await page.getByRole('button', { name: /add to cart/i }).click()

    // Age disclaimer should be present on the product page
    await expect(page.getByText(/18 years of age or older/i)).toBeVisible()

    // Log in (cart persists/merges)
    await login(page, TEST_USER.email, TEST_USER.password)

    // Proceed to checkout
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible()

    // Step through review → address → shipping → payment
    await page.getByRole('button', { name: /continue/i }).click()        // review → address
    await page.getByLabel(/full name/i).fill('E2E Buyer')
    await page.getByLabel(/address line 1/i).fill('100 Congress Ave')
    await page.getByLabel(/city/i).fill('Austin')
    await page.getByLabel(/zip/i).fill('78701')
    await page.getByRole('button', { name: /continue/i }).click()        // address → shipping
    await page.getByRole('button', { name: /continue to payment/i }).click()

    // Pay with Stripe test card
    await fillStripeCard(page)
    await page.getByRole('button', { name: /place order/i }).click()

    // Confirmation
    await expect(page).toHaveURL(/\/checkout\/success/, { timeout: 30_000 })
    await expect(page.getByText(/thank you/i)).toBeVisible()
  })
})
