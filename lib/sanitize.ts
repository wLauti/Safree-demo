// Input sanitization helpers — server-side, dependency-free.

/** Remove all HTML tags and decode a few common entities. For plain-text fields. */
export function stripHtml(input: string): string {
  if (!input) return ''
  return input
    .replace(/<\/?[^>]+(>|$)/g, '')   // strip tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

/** Sanitize a plain-text field: strip HTML, collapse whitespace, clamp length. */
export function sanitizeText(input: string, maxLength = 2000): string {
  return stripHtml(input).replace(/\s+/g, ' ').slice(0, maxLength)
}

/**
 * Sanitize markdown to a safe subset.
 * Removes raw HTML, script/style, javascript: URIs, and dangerous link protocols
 * while preserving common markdown syntax.
 */
export function sanitizeMarkdown(input: string, maxLength = 10000): string {
  if (!input) return ''
  let out = input.slice(0, maxLength)
  // Remove raw HTML tags (markdown renderers should escape, but be safe)
  out = out.replace(/<\/?[a-z][\s\S]*?>/gi, '')
  // Neutralize javascript:/data:/vbscript: URIs in links
  out = out.replace(/\]\(\s*(javascript|data|vbscript):/gi, '](#')
  // Strip HTML event handlers if any survived
  out = out.replace(/on\w+\s*=\s*"[^"]*"/gi, '')
  return out.trim()
}

// ── File upload validation ──────────────────────────────────────
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const DOC_MIME = ['application/pdf']

export interface UploadValidationOptions {
  allowedMime?: string[]
  maxBytes?: number
}

export interface UploadValidationResult {
  ok: boolean
  error?: string
}

/** Reject filenames containing path traversal or control characters. */
export function isSafeFilename(name: string): boolean {
  if (!name || name.length > 255) return false
  if (name.includes('..') || name.includes('/') || name.includes('\\')) return false
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f]/.test(name)) return false
  return true
}

/**
 * Validate an uploaded file by MIME type (not just extension), size, and filename.
 * Pass the real File/Blob (browser) or a {type, size, name} descriptor (server).
 */
export function validateUpload(
  file: { type: string; size: number; name: string },
  opts: UploadValidationOptions = {}
): UploadValidationResult {
  const allowed = opts.allowedMime ?? [...IMAGE_MIME, ...DOC_MIME]
  const maxBytes = opts.maxBytes ?? 10 * 1024 * 1024 // 10 MB

  if (!isSafeFilename(file.name)) {
    return { ok: false, error: 'Invalid filename' }
  }
  if (!allowed.includes(file.type)) {
    return { ok: false, error: `File type not allowed (${file.type || 'unknown'})` }
  }
  if (file.size > maxBytes) {
    return { ok: false, error: `File too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)` }
  }
  return { ok: true }
}

export const ALLOWED_IMAGE_MIME = IMAGE_MIME
export const ALLOWED_EVIDENCE_MIME = [...IMAGE_MIME, ...DOC_MIME]
