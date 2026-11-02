import { describe, it, expect } from 'vitest'
import {
  stripHtml, sanitizeText, sanitizeMarkdown, isSafeFilename, validateUpload,
} from '@/lib/sanitize'

describe('stripHtml', () => {
  it('removes tags', () => {
    expect(stripHtml('<b>bold</b> text')).toBe('bold text')
  })
  it('removes script tags and content boundaries', () => {
    expect(stripHtml('<script>alert(1)</script>hi')).toBe('alert(1)hi')
  })
  it('decodes common entities', () => {
    expect(stripHtml('a &amp; b')).toBe('a & b')
  })
})

describe('sanitizeText', () => {
  it('collapses whitespace and clamps length', () => {
    expect(sanitizeText('a   b\n\nc')).toBe('a b c')
    expect(sanitizeText('abcdefg', 3)).toBe('abc')
  })
  it('strips html from plain text', () => {
    expect(sanitizeText('<img src=x onerror=alert(1)>hello')).toBe('hello')
  })
})

describe('sanitizeMarkdown', () => {
  it('removes raw html tags', () => {
    expect(sanitizeMarkdown('# Title <script>bad</script>')).not.toContain('<script>')
  })
  it('neutralizes javascript: links', () => {
    const out = sanitizeMarkdown('[click](javascript:alert(1))')
    expect(out).not.toContain('javascript:')
  })
  it('preserves safe markdown', () => {
    const md = '# Heading\n\n- item 1\n- item 2\n\n[safe](https://safree.com)'
    const out = sanitizeMarkdown(md)
    expect(out).toContain('# Heading')
    expect(out).toContain('https://safree.com')
  })
})

describe('isSafeFilename', () => {
  it('accepts normal names', () => {
    expect(isSafeFilename('photo.jpg')).toBe(true)
  })
  it('rejects path traversal', () => {
    expect(isSafeFilename('../../etc/passwd')).toBe(false)
    expect(isSafeFilename('a/b.png')).toBe(false)
    expect(isSafeFilename('a\\b.png')).toBe(false)
  })
  it('rejects empty / over-long names', () => {
    expect(isSafeFilename('')).toBe(false)
    expect(isSafeFilename('x'.repeat(256))).toBe(false)
  })
})

describe('validateUpload', () => {
  it('accepts a valid jpeg under size', () => {
    expect(validateUpload({ type: 'image/jpeg', size: 1024, name: 'a.jpg' }).ok).toBe(true)
  })
  it('rejects disallowed MIME (extension spoofing)', () => {
    const r = validateUpload({ type: 'application/x-msdownload', size: 10, name: 'evil.jpg' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/not allowed/i)
  })
  it('rejects oversized files', () => {
    const r = validateUpload({ type: 'image/png', size: 99 * 1024 * 1024, name: 'big.png' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/too large/i)
  })
  it('rejects unsafe filenames', () => {
    expect(validateUpload({ type: 'image/png', size: 10, name: '../x.png' }).ok).toBe(false)
  })
  it('honors a custom allowed MIME list', () => {
    const r = validateUpload({ type: 'application/pdf', size: 10, name: 'doc.pdf' }, { allowedMime: ['image/png'] })
    expect(r.ok).toBe(false)
  })
})
