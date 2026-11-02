export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function productSlug(title: string, id: string): string {
  return `${toSlug(title)}-${id.slice(0, 8)}`
}
