export const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

export const US_STATE_OPTIONS = US_STATES.map(s => ({ value: s, label: s }))

export const PRODUCTS_PER_PAGE = 24

export const CATEGORY_ICONS: Record<string, string> = {
  optics: '🔭',
  apparel: '🧥',
  archery: '🏹',
  'camping-gear': '⛺',
  'fishing-gear': '🎣',
  'outdoor-knives': '🔪',
  navigation: '🧭',
  accessories: '🎯',
}

export const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Relevance' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest',     label: 'Newest' },
  { value: 'top_rated',  label: 'Top Rated' },
] as const
