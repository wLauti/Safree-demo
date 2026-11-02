import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20',
    })
  }
  return stripeInstance
}

export async function createConnectAccount(email: string): Promise<string> {
  const stripe = getStripe()
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
  })
  return account.id
}

export async function createPaymentIntent(
  amount: number,
  currency = 'usd',
  connectedAccountId: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe()
  const platformFee = Math.round(amount * 0.05) // 5% platform fee
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency,
    application_fee_amount: platformFee,
    transfer_data: { destination: connectedAccountId },
    metadata: metadata ?? {},
  })
}
