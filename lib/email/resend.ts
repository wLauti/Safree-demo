import { Resend } from 'resend'
import { orderConfirmationHtml } from './templates/order-confirmation'
import {
  welcomeEmailHtml, reviewReceivedHtml, disputeOpenedHtml,
  disputeResponseHtml, disputeResolvedHtml, bookingConfirmationHtml,
} from './templates/sprint7'
import { IS_DEMO } from '@/lib/demo'

// In DEMO mode email is a no-op — nothing is sent to anyone.
const resend: any = IS_DEMO
  ? { emails: { send: async () => ({ data: { id: 'demo-noop' }, error: null }) } }
  : new Resend(process.env.RESEND_API_KEY)

const FROM = 'Safree <orders@safree.com>'

// ── Sprint 7 transactional emails ───────────────────────────────
export async function sendWelcomeEmail(to: string, firstName: string) {
  await resend.emails.send({ from: FROM, to, subject: 'Welcome to Safree', html: welcomeEmailHtml(firstName) })
}

export async function sendReviewReceivedEmail(to: string, storeName: string, rating: number, listingTitle: string) {
  await resend.emails.send({ from: FROM, to, subject: 'You received a new review — Safree', html: reviewReceivedHtml(storeName, rating, listingTitle) })
}

export async function sendDisputeOpenedEmail(to: string, opts: { recipient: 'user' | 'store'; refNumber: string; orderRef: string; reasonCategory: string }) {
  await resend.emails.send({ from: FROM, to, subject: opts.recipient === 'store' ? `Dispute opened on order #${opts.orderRef}` : `Dispute ${opts.refNumber} opened`, html: disputeOpenedHtml(opts) })
}

export async function sendDisputeResponseEmail(to: string, refNumber: string) {
  await resend.emails.send({ from: FROM, to, subject: `Update on dispute ${refNumber}`, html: disputeResponseHtml(refNumber) })
}

export async function sendDisputeResolvedEmail(to: string, opts: { recipient: 'user' | 'store'; refNumber: string; resolutionType: 'full_refund' | 'partial_refund' | 'no_refund'; refundAmount?: number }) {
  await resend.emails.send({ from: FROM, to, subject: `Dispute ${opts.refNumber} resolved`, html: disputeResolvedHtml(opts) })
}

export async function sendBookingConfirmationEmail(to: string, opts: { recipient: 'user' | 'coto'; refNumber: string; experienceTitle: string; startDate: string; endDate: string; guests: number }) {
  await resend.emails.send({ from: FROM, to, subject: opts.recipient === 'coto' ? 'New booking received — Safree' : 'Your booking is confirmed — Safree', html: bookingConfirmationHtml(opts) })
}

export async function sendAccountDeletedEmail(to: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your Safree account has been deleted',
    html: `
      <div style="font-family:Inter,sans-serif;background:#262525;color:#E6DDBC;padding:40px;max-width:600px;margin:auto;border-radius:8px;">
        <h1 style="font-family:Oswald,sans-serif;letter-spacing:2px;font-size:24px;margin:0 0 20px;">SAFREE</h1>
        <h2 style="font-family:Oswald,sans-serif;font-size:20px;">Account Deleted</h2>
        <p>Your Safree account and personal data have been deleted at your request.</p>
        <p style="color:#9A9A9A;">Some records may take up to 30 days to fully purge from our backups, and anonymized financial records are retained as required by law.</p>
        <p style="color:#9A9A9A;">If you didn't request this, contact <a href="mailto:legal@safree.com" style="color:#E6DDBC;">legal@safree.com</a> immediately.</p>
      </div>`,
  })
}

interface OrderEmailData {
  to: string
  userName: string
  orderId: string
  items: { title: string; quantity: number; price: number; image_url?: string | null }[]
  subtotal: number
  shippingTotal: number
  discount: number
  total: number
  shippingAddress: {
    full_name: string
    line1: string
    line2?: string | null
    city: string
    state: string
    zip: string
  }
  shippingMethod: string
  estimatedDelivery: string
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Order Confirmed — #${data.orderId.slice(0, 8).toUpperCase()}`,
    html: orderConfirmationHtml(data),
  })
}

// ── Moderation emails ──────────────────────────────────────────
function shell(title: string, bodyHtml: string, ctaText?: string, ctaUrl?: string): string {
  return `
    <div style="font-family:Inter,sans-serif;background:#262525;color:#E6DDBC;padding:40px;max-width:600px;margin:auto;border-radius:8px;">
      <h1 style="font-family:Oswald,sans-serif;color:#E6DDBC;letter-spacing:2px;font-size:24px;margin:0 0 24px;">SAFREE</h1>
      <h2 style="color:#E6DDBC;font-family:Oswald,sans-serif;font-size:20px;">${title}</h2>
      ${bodyHtml}
      ${ctaText && ctaUrl ? `<a href="${ctaUrl}" style="background:#822626;color:#E6DDBC;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px;font-family:Oswald,sans-serif;letter-spacing:1px;">${ctaText}</a>` : ''}
      <p style="color:#9A9A9A;font-size:12px;margin-top:32px;">© ${new Date().getFullYear()} Safree · Premium Outdoor Marketplace</p>
    </div>`
}

export async function sendListingApprovedEmail(to: string, listingTitle: string, listingType: 'product' | 'experience') {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${listingType} is now live — Safree`,
    html: shell(
      'Listing Approved ✅',
      `<p>Great news! Your ${listingType} <strong>"${listingTitle}"</strong> has been approved and is now live on Safree.</p>
       <p style="color:#9A9A9A;">Buyers can now find and ${listingType === 'product' ? 'purchase' : 'book'} it.</p>`,
      'View Dashboard',
      `${process.env.NEXT_PUBLIC_BASE_URL}/store/${listingType === 'product' ? 'listings' : 'experiences'}`
    ),
  })
}

export async function sendListingRejectedEmail(to: string, listingTitle: string, listingType: 'product' | 'experience', reason: string, category: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Action needed on your ${listingType} — Safree`,
    html: shell(
      'Listing Needs Changes ⚠️',
      `<p>Your ${listingType} <strong>"${listingTitle}"</strong> could not be approved.</p>
       <div style="background:#323030;border-radius:6px;padding:16px;margin:16px 0;">
         <p style="color:#9A9A9A;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Reason: ${category}</p>
         <p style="color:#E6DDBC;margin:0;">${reason}</p>
       </div>
       <p style="color:#9A9A9A;">Please make the necessary changes and resubmit for review.</p>`,
      'Edit Listing',
      `${process.env.NEXT_PUBLIC_BASE_URL}/store/${listingType === 'product' ? 'listings' : 'experiences'}`
    ),
  })
}

export async function sendVerificationApprovedEmail(to: string, storeName: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your store is now verified — Safree',
    html: shell(
      'Verification Approved ✅',
      `<p><strong>${storeName}</strong> is now a Verified provider on Safree. The verified badge will appear on your profile and listings.</p>`,
      'View Profile',
      `${process.env.NEXT_PUBLIC_BASE_URL}/store`
    ),
  })
}

export async function sendVerificationRejectedEmail(to: string, storeName: string, reason: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verification update — Safree',
    html: shell(
      'Verification Not Approved',
      `<p>We were unable to verify <strong>${storeName}</strong> at this time.</p>
       <div style="background:#323030;border-radius:6px;padding:16px;margin:16px 0;">
         <p style="color:#E6DDBC;margin:0;">${reason}</p>
       </div>`,
      'Resubmit Documents',
      `${process.env.NEXT_PUBLIC_BASE_URL}/store/settings`
    ),
  })
}

export async function sendPaymentFailedEmail(to: string, userName: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Payment Failed — Safree',
    html: `
      <div style="font-family:Inter,sans-serif;background:#262525;color:#E6DDBC;padding:40px;max-width:600px;margin:auto;border-radius:8px;">
        <h2 style="color:#E6DDBC;font-family:Oswald,sans-serif;">Payment Unsuccessful</h2>
        <p>Hi ${userName},</p>
        <p>Unfortunately your payment could not be processed. Your order has been cancelled.</p>
        <p>Please try again or use a different payment method.</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/products"
           style="background:#822626;color:#E6DDBC;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">
          Continue Shopping
        </a>
      </div>
    `,
  })
}
