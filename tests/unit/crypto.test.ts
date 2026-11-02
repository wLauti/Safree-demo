import { describe, it, expect } from 'vitest'
import { encryptSecret, decryptSecret, maskSecret } from '@/lib/crypto/secrets'

describe('encryptSecret / decryptSecret', () => {
  it('round-trips a value', () => {
    const secret = 'sk_live_abc123XYZ'
    const enc = encryptSecret(secret)
    expect(enc).not.toBe(secret)
    expect(enc.split('.')).toHaveLength(3) // iv.tag.ciphertext
    expect(decryptSecret(enc)).toBe(secret)
  })
  it('produces different ciphertext each time (random IV)', () => {
    const a = encryptSecret('same')
    const b = encryptSecret('same')
    expect(a).not.toBe(b)
    expect(decryptSecret(a)).toBe('same')
    expect(decryptSecret(b)).toBe('same')
  })
  it('returns empty string for empty input', () => {
    expect(encryptSecret('')).toBe('')
    expect(decryptSecret('')).toBe('')
  })
  it('treats non-encrypted input as plaintext (back-compat / numeric rates)', () => {
    expect(decryptSecret('5')).toBe('5')
  })
  it('returns empty string on tampered ciphertext', () => {
    const enc = encryptSecret('secret')
    const tampered = enc.slice(0, -2) + 'xx'
    expect(decryptSecret(tampered)).toBe('')
  })
})

describe('maskSecret', () => {
  it('masks all but the last 4 chars', () => {
    expect(maskSecret('sk_live_abcd1234')).toBe('••••••••1234')
  })
  it('shows (not set) for empty', () => {
    expect(maskSecret('')).toBe('(not set)')
  })
  it('fully masks short values', () => {
    expect(maskSecret('ab')).toBe('••••')
  })
})
