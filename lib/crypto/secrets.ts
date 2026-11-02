import crypto from 'crypto'

// Server-only AES-256-GCM encryption for integration credentials.
// The master key comes from CREDENTIALS_ENCRYPTION_KEY (32-byte hex/base64).
// Stored format: base64(iv).base64(authTag).base64(ciphertext)

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  // ENCRYPTION_MASTER_KEY is the production secret; CREDENTIALS_ENCRYPTION_KEY kept for back-compat.
  const raw = process.env.ENCRYPTION_MASTER_KEY ?? process.env.CREDENTIALS_ENCRYPTION_KEY
  if (!raw) {
    // Derive a deterministic fallback from another secret so dev doesn't crash.
    // In production CREDENTIALS_ENCRYPTION_KEY MUST be set to a real 32-byte key.
    return crypto.createHash('sha256').update(process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'safree-dev-fallback').digest()
  }
  // Accept hex (64 chars) or base64
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, 'hex')
  const buf = Buffer.from(raw, 'base64')
  if (buf.length === 32) return buf
  // Otherwise hash whatever was provided to a stable 32 bytes
  return crypto.createHash('sha256').update(raw).digest()
}

export function encryptSecret(plaintext: string): string {
  if (plaintext === '') return ''
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`
}

export function decryptSecret(stored: string): string {
  if (!stored) return ''
  const parts = stored.split('.')
  // If it's not in our encrypted format, assume plaintext (e.g. commission rate, legacy values)
  if (parts.length !== 3) return stored
  try {
    const [ivB64, tagB64, dataB64] = parts
    const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ])
    return decrypted.toString('utf8')
  } catch {
    return ''
  }
}

/** Mask a secret value for display: keep last 4 chars. */
export function maskSecret(value: string): string {
  if (!value) return '(not set)'
  if (value.length <= 4) return '••••'
  return '••••••••' + value.slice(-4)
}
