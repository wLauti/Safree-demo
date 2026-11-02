// Utilities for normalizing PostGIS geography/geometry values.
//
// PostgREST returns GEOGRAPHY/GEOMETRY columns as EWKB hex strings
// (e.g. "0101000020E6100000...") rather than GeoJSON. The map and detail
// pages expect `{ coordinates: [lng, lat] }`, so we decode the hex here.

export interface GeoPoint {
  coordinates: [number, number]
}

/**
 * Decode an EWKB hex string representing a POINT into [lng, lat].
 * Returns null if the value can't be parsed.
 */
function decodeEwkbPoint(hex: string): [number, number] | null {
  try {
    if (hex.length < 18) return null
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    const view = new DataView(bytes.buffer)
    let offset = 0

    const littleEndian = view.getUint8(offset) === 1
    offset += 1

    const type = view.getUint32(offset, littleEndian)
    offset += 4

    // High bit 0x20000000 indicates an SRID follows the type.
    const hasSrid = (type & 0x20000000) !== 0
    if (hasSrid) offset += 4 // skip SRID

    const lng = view.getFloat64(offset, littleEndian)
    offset += 8
    const lat = view.getFloat64(offset, littleEndian)

    if (Number.isNaN(lng) || Number.isNaN(lat)) return null
    return [lng, lat]
  } catch {
    return null
  }
}

/**
 * Normalize any PostGIS location value into `{ coordinates: [lng, lat] }`
 * or null. Accepts EWKB hex strings, GeoJSON objects, or null.
 */
export function normalizeGeoPoint(value: unknown): GeoPoint | null {
  if (!value) return null

  // Already GeoJSON-shaped
  if (typeof value === 'object' && value !== null && 'coordinates' in value) {
    const coords = (value as any).coordinates
    if (Array.isArray(coords) && coords.length >= 2) {
      return { coordinates: [Number(coords[0]), Number(coords[1])] }
    }
    return null
  }

  // EWKB hex string
  if (typeof value === 'string') {
    const decoded = decodeEwkbPoint(value)
    return decoded ? { coordinates: decoded } : null
  }

  return null
}
