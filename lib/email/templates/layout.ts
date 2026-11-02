// Shared branded email layout — CAN-SPAM compliant.
// Dark header with cream logo, white content area, red CTA, footer with address + unsubscribe.

const LEGAL_ADDRESS = 'Safree Inc., 100 Congress Ave, Austin, TX 78701, USA'

interface LayoutOptions {
  heading: string
  bodyHtml: string
  ctaText?: string
  ctaUrl?: string
  preheader?: string
}

export function emailLayout({ heading, bodyHtml, ctaText, ctaUrl, preheader }: LayoutOptions): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://safree.com'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#1a1a1a;font-family:Arial,Helvetica,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.3);">

        <!-- Dark header -->
        <tr>
          <td style="background:#262525;padding:28px 32px;text-align:center;">
            <span style="font-family:Georgia,serif;font-size:30px;letter-spacing:5px;color:#E6DDBC;font-weight:bold;text-transform:uppercase;">SAFREE</span>
          </td>
        </tr>

        <!-- White content -->
        <tr>
          <td style="background:#ffffff;padding:36px 32px;color:#2a2a2a;">
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#262525;margin:0 0 18px;">${heading}</h1>
            <div style="font-size:15px;line-height:1.6;color:#444;">
              ${bodyHtml}
            </div>
            ${ctaText && ctaUrl ? `
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
              <tr><td style="border-radius:6px;background:#822626;">
                <a href="${ctaUrl}" style="display:inline-block;padding:13px 30px;color:#E6DDBC;font-size:15px;font-weight:bold;text-decoration:none;border-radius:6px;letter-spacing:0.5px;">${ctaText}</a>
              </td></tr>
            </table>` : ''}
          </td>
        </tr>

        <!-- Dark footer -->
        <tr>
          <td style="background:#262525;padding:24px 32px;text-align:center;">
            <p style="color:#9A9A9A;font-size:12px;margin:0 0 8px;line-height:1.5;">
              ${LEGAL_ADDRESS}
            </p>
            <p style="color:#9A9A9A;font-size:12px;margin:0;">
              <a href="${base}/settings/notifications" style="color:#E6DDBC;text-decoration:underline;">Manage notifications</a>
              &nbsp;·&nbsp;
              <a href="${base}/unsubscribe" style="color:#E6DDBC;text-decoration:underline;">Unsubscribe</a>
            </p>
            <p style="color:#6a6a6a;font-size:11px;margin:10px 0 0;">© ${new Date().getFullYear()} Safree · Premium Outdoor Marketplace</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
