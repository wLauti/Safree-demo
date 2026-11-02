import { emailLayout } from './layout'

const base = () => process.env.NEXT_PUBLIC_BASE_URL ?? 'https://safree.com'

export function welcomeEmailHtml(firstName: string): string {
  return emailLayout({
    heading: `Welcome to Safree, ${firstName}!`,
    preheader: 'Your account is ready — start exploring.',
    bodyHtml: `
      <p>Thanks for joining Safree, the premier marketplace for hunters and anglers.</p>
      <p>Discover verified hunting grounds, book fishing lodges, and shop trusted gear — all in one place.</p>`,
    ctaText: 'Start Exploring',
    ctaUrl: `${base()}/map`,
  })
}

export function reviewReceivedHtml(storeName: string, rating: number, listingTitle: string): string {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  return emailLayout({
    heading: 'You received a new review',
    preheader: `${rating} stars for ${listingTitle}`,
    bodyHtml: `
      <p>Hi ${storeName},</p>
      <p>A verified buyer just left a review:</p>
      <div style="background:#f5f3ea;border-radius:6px;padding:16px;margin:16px 0;">
        <p style="font-size:20px;color:#822626;margin:0 0 6px;">${stars}</p>
        <p style="margin:0;color:#666;">on <strong>${listingTitle}</strong></p>
      </div>`,
    ctaText: 'View Reviews',
    ctaUrl: `${base()}/store`,
  })
}

export function disputeOpenedHtml(opts: {
  recipient: 'user' | 'store'
  refNumber: string
  orderRef: string
  reasonCategory: string
}): string {
  const isStore = opts.recipient === 'store'
  return emailLayout({
    heading: isStore ? 'A dispute has been opened' : 'Your dispute has been opened',
    preheader: `Dispute ${opts.refNumber}`,
    bodyHtml: isStore
      ? `<p>A buyer has opened a dispute on order <strong>#${opts.orderRef}</strong>.</p>
         <p><strong>Reason:</strong> ${opts.reasonCategory}</p>
         <p>Please respond within 3 business days with your side and any evidence. If you don't respond, the dispute will be escalated to Safree for review.</p>`
      : `<p>Your dispute has been opened successfully.</p>
         <p><strong>Reference:</strong> ${opts.refNumber}</p>
         <p><strong>Reason:</strong> ${opts.reasonCategory}</p>
         <p>The provider has 3 business days to respond. We'll email you when they do.</p>`,
    ctaText: isStore ? 'Respond to Dispute' : 'View Dispute',
    ctaUrl: isStore ? `${base()}/store/disputes` : `${base()}/user/disputes`,
  })
}

export function disputeResponseHtml(refNumber: string): string {
  return emailLayout({
    heading: 'The provider has responded',
    preheader: `Dispute ${refNumber} update`,
    bodyHtml: `
      <p>The provider has submitted their response to your dispute <strong>${refNumber}</strong>.</p>
      <p>Safree will now review both sides and reach a fair resolution. We'll notify you of the decision.</p>`,
    ctaText: 'View Dispute',
    ctaUrl: `${base()}/user/disputes`,
  })
}

export function disputeResolvedHtml(opts: {
  recipient: 'user' | 'store'
  refNumber: string
  resolutionType: 'full_refund' | 'partial_refund' | 'no_refund'
  refundAmount?: number
}): string {
  const decisions: Record<string, string> = {
    full_refund: 'Full refund issued to the buyer',
    partial_refund: `Partial refund of $${(opts.refundAmount ?? 0).toFixed(2)} issued to the buyer`,
    no_refund: 'Resolved in the provider\'s favor — no refund',
  }
  return emailLayout({
    heading: 'Your dispute has been resolved',
    preheader: `Dispute ${opts.refNumber} resolved`,
    bodyHtml: `
      <p>Safree has reviewed dispute <strong>${opts.refNumber}</strong> and reached a decision:</p>
      <div style="background:#f5f3ea;border-radius:6px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#262525;font-weight:bold;">${decisions[opts.resolutionType]}</p>
      </div>
      <p>If you have questions about this decision, contact support@safree.com.</p>`,
    ctaText: 'View Details',
    ctaUrl: opts.recipient === 'store' ? `${base()}/store/disputes` : `${base()}/user/disputes`,
  })
}

export function bookingConfirmationHtml(opts: {
  recipient: 'user' | 'coto'
  refNumber: string
  experienceTitle: string
  startDate: string
  endDate: string
  guests: number
}): string {
  const fmt = (d: string) => new Date(d + 'T00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const isCoto = opts.recipient === 'coto'
  return emailLayout({
    heading: isCoto ? 'New booking received!' : 'Your booking is confirmed!',
    preheader: `${opts.experienceTitle} · ${fmt(opts.startDate)}`,
    bodyHtml: `
      <p>${isCoto ? 'You have a new confirmed booking:' : 'Get ready for your adventure!'}</p>
      <div style="background:#f5f3ea;border-radius:6px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 4px;font-weight:bold;color:#262525;">${opts.experienceTitle}</p>
        <p style="margin:0;color:#666;">${fmt(opts.startDate)} – ${fmt(opts.endDate)}</p>
        <p style="margin:4px 0 0;color:#666;">${opts.guests} ${opts.guests === 1 ? 'hunter' : 'hunters'}</p>
        <p style="margin:8px 0 0;color:#822626;font-weight:bold;">Ref: ${opts.refNumber}</p>
      </div>`,
    ctaText: isCoto ? 'View Bookings' : 'View My Booking',
    ctaUrl: isCoto ? `${base()}/store/bookings` : `${base()}/user/bookings`,
  })
}
