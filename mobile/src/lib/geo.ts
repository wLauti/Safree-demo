// Decode PostGIS geography values returned by PostgREST as EWKB hex strings
// (same logic as the web app's lib/utils/geo.ts) into [lng, lat].

function decodeEwkbPoint(hex: string): [number, number] | null {
  try {
    if (hex.length < 18) return null
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
    const view = new DataView(bytes.buffer)
    let offset = 0
    const littleEndian = view.getUint8(offset) === 1
    offset += 1
    const type = view.getUint32(offset, littleEndian)
    offset += 4
    if ((type & 0x20000000) !== 0) offset += 4 // skip SRID
    const lng = view.getFloat64(offset, littleEndian)
    offset += 8
    const lat = view.getFloat64(offset, littleEndian)
    if (Number.isNaN(lng) || Number.isNaN(lat)) return null
    return [lng, lat]
  } catch {
    return null
  }
}

export function normalizeGeoPoint(value: unknown): [number, number] | null {
  if (!value) return null
  if (typeof value === 'object' && value !== null && 'coordinates' in value) {
    const c = (value as any).coordinates
    if (Array.isArray(c) && c.length >= 2) return [Number(c[0]), Number(c[1])]
    return null
  }
  if (typeof value === 'string') return decodeEwkbPoint(value)
  return null
}
