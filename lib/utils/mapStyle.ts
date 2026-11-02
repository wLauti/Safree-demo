// Free raster tile config for Leaflet — no API key, no WebGL.
// CartoDB "dark_all" basemap matches the app's dark theme.
// Docs / usage policy: https://github.com/CartoDB/basemap-styles
export const TILE_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

// Default map view (center of Texas) and zoom.
export const DEFAULT_CENTER: [number, number] = [31.2, -99.3] // [lat, lng] for Leaflet
export const DEFAULT_ZOOM = 6
