// Curated outdoor photography used for backgrounds / hero sections across the site.
// These are now SELF-HOSTED: the image files live in /public/media/backgrounds and
// are served from the app's own origin, so the site has no external image
// dependency. (Originals were free-to-use stock from Unsplash.)

/** Decorative outdoor imagery keyed by where it's used. */
export const IMG = {
  /** Home hero — misty mountain pass, cinematic and dark (reads well under cream text). */
  hero: '/media/backgrounds/hero.jpg',
  /** "List your land" CTA — sunrise meadow framed by mountains. */
  listLand: '/media/backgrounds/list-land.jpg',
  /** Marketplace header — hiker with pack on a mountain trail (gear vibe). */
  marketplace: '/media/backgrounds/marketplace.jpg',
  /** Experiences header — serene lake and peaks (lodges & grounds). */
  experiences: '/media/backgrounds/experiences.jpg',
  /** Map discovery header — forest boardwalk leading in. */
  discover: '/media/backgrounds/discover.jpg',
  /** Auth screens background — misty tents at dusk. */
  auth: '/media/backgrounds/auth.jpg',
  /** Faint site-wide texture — sunlit forest, used at very low opacity. */
  texture: '/media/backgrounds/texture.jpg',
  /** Warm accent — campfire in the woods. */
  campfire: '/media/backgrounds/campfire.jpg',
  /** Generic store/listing fallback banner — river valley. */
  storeFallback: '/media/backgrounds/store-fallback.jpg',
} as const

export type ImageKey = keyof typeof IMG
