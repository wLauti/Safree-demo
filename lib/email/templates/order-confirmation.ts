interface OrderEmailData {
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

function fmt(n: number) {
  return `$${n.toFixed(2)}`
}

export function orderConfirmationHtml(d: OrderEmailData): string {
  const addr = d.shippingAddress
  const firstName = d.userName.split(' ')[0]

  const itemRows = d.items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #3A3A3A;">
        <span style="color:#E6DDBC;font-weight:600;">${item.title}</span><br>
        <span style="color:#9A9A9A;font-size:13px;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #3A3A3A;text-align:right;color:#E6DDBC;font-weight:600;">
        ${fmt(item.price * item.quantity)}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Order Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#262525;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#822626;padding:24px 32px;text-align:center;">
            <h1 style="margin:0;font-family:Oswald,Georgia,serif;font-size:28px;color:#E6DDBC;letter-spacing:2px;">SAFREE</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;color:#E6DDBC;">
            <h2 style="font-family:Oswald,Georgia,serif;font-size:24px;margin:0 0 8px;color:#E6DDBC;">
              Thank you, ${firstName}!
            </h2>
            <p style="color:#9A9A9A;margin:0 0 24px;font-family:Inter,sans-serif;">
              Your order has been confirmed and is being prepared.
            </p>

            <!-- Order number -->
            <div style="background:#1a1a1a;border-radius:6px;padding:16px;margin-bottom:24px;text-align:center;">
              <p style="color:#9A9A9A;font-size:12px;margin:0 0 4px;font-family:Inter,sans-serif;letter-spacing:1px;text-transform:uppercase;">Order Number</p>
              <p style="color:#E6DDBC;font-family:Oswald,Georgia,serif;font-size:22px;margin:0;letter-spacing:2px;">
                #${d.orderId.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;font-family:Inter,sans-serif;font-size:14px;">
              ${itemRows}
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Inter,sans-serif;font-size:14px;margin-bottom:24px;">
              <tr>
                <td style="color:#9A9A9A;padding:4px 0;">Subtotal</td>
                <td style="color:#E6DDBC;text-align:right;padding:4px 0;">${fmt(d.subtotal)}</td>
              </tr>
              ${d.discount > 0 ? `
              <tr>
                <td style="color:#9A9A9A;padding:4px 0;">Discount</td>
                <td style="color:#4ade80;text-align:right;padding:4px 0;">-${fmt(d.discount)}</td>
              </tr>` : ''}
              <tr>
                <td style="color:#9A9A9A;padding:4px 0;">Shipping (${d.shippingMethod})</td>
                <td style="color:#E6DDBC;text-align:right;padding:4px 0;">${d.shippingTotal === 0 ? 'FREE' : fmt(d.shippingTotal)}</td>
              </tr>
              <tr>
                <td colspan="2" style="border-top:1px solid #3A3A3A;padding:4px 0;"></td>
              </tr>
              <tr>
                <td style="color:#E6DDBC;font-weight:bold;font-size:16px;padding:8px 0 0;">Total</td>
                <td style="color:#E6DDBC;font-family:Oswald,Georgia,serif;font-size:18px;text-align:right;padding:8px 0 0;">${fmt(d.total)}</td>
              </tr>
            </table>

            <!-- Shipping info -->
            <div style="border:1px solid #3A3A3A;border-radius:6px;padding:16px;margin-bottom:24px;">
              <p style="color:#9A9A9A;font-size:12px;margin:0 0 8px;font-family:Inter,sans-serif;letter-spacing:1px;text-transform:uppercase;">Shipping To</p>
              <p style="color:#E6DDBC;margin:0;font-family:Inter,sans-serif;line-height:1.6;">
                ${addr.full_name}<br>
                ${addr.line1}${addr.line2 ? '<br>' + addr.line2 : ''}<br>
                ${addr.city}, ${addr.state} ${addr.zip}
              </p>
              <p style="color:#9A9A9A;font-size:13px;margin:8px 0 0;font-family:Inter,sans-serif;">
                Estimated delivery: <span style="color:#E6DDBC;">${d.estimatedDelivery}</span>
              </p>
            </div>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/user/orders"
                     style="display:inline-block;background:#822626;color:#E6DDBC;font-family:Oswald,Georgia,serif;font-size:16px;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:1px;">
                    VIEW MY ORDERS
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1a1a1a;padding:20px 32px;text-align:center;">
            <p style="color:#9A9A9A;font-size:12px;margin:0;font-family:Inter,sans-serif;">
              © ${new Date().getFullYear()} Safree · Premium Outdoor Marketplace · Texas
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim()
}
