// Definition of the credential groups shown in /admin/credentials.
// `encrypted: false` means the value is stored as plaintext (e.g. numeric rates,
// public identifiers) and is not masked aggressively.

export interface CredentialField {
  service: string       // matches integration_keys.service
  label: string
  encrypted: boolean    // whether to encrypt at rest + mask in UI
  type?: 'text' | 'number'
  hint?: string
}

export interface CredentialGroup {
  name: string
  fields: CredentialField[]
}

export const CREDENTIAL_GROUPS: CredentialGroup[] = [
  {
    name: 'Stripe',
    fields: [
      { service: 'stripe_publishable_key', label: 'Publishable Key', encrypted: false, hint: 'pk_live_… (safe for client)' },
      { service: 'stripe_secret_key', label: 'Secret Key', encrypted: true, hint: 'sk_live_…' },
      { service: 'stripe_webhook_secret', label: 'Webhook Secret', encrypted: true, hint: 'whsec_…' },
      { service: 'stripe_commission_rate', label: 'Commission Rate (%)', encrypted: false, type: 'number' },
    ],
  },
  {
    name: 'Auth / OAuth',
    fields: [
      { service: 'google_oauth_client_id', label: 'Google Client ID', encrypted: false },
      { service: 'google_oauth_client_secret', label: 'Google Client Secret', encrypted: true },
    ],
  },
  {
    name: 'Email',
    fields: [
      { service: 'resend_api_key', label: 'Resend API Key', encrypted: true, hint: 're_…' },
      { service: 'email_from_address', label: 'From Address', encrypted: false, hint: 'orders@safree.com' },
      { service: 'email_from_name', label: 'From Name', encrypted: false, hint: 'Safree' },
    ],
  },
  {
    name: 'Push Notifications',
    fields: [
      { service: 'vapid_public_key', label: 'VAPID Public Key', encrypted: false },
      { service: 'vapid_private_key', label: 'VAPID Private Key', encrypted: true },
    ],
  },
  {
    name: 'Analytics',
    fields: [
      { service: 'analytics_id', label: 'Analytics ID (GA4)', encrypted: false, hint: 'G-XXXXXXXXXX' },
    ],
  },
  {
    name: 'CORS',
    fields: [
      { service: 'allowed_origins', label: 'Allowed Origins', encrypted: false, hint: 'comma-separated list of URLs' },
    ],
  },
]

export function findField(service: string): CredentialField | undefined {
  for (const g of CREDENTIAL_GROUPS) {
    const f = g.fields.find(f => f.service === service)
    if (f) return f
  }
  return undefined
}
