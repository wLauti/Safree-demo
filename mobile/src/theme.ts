// Shared design tokens mirroring the web app's dark theme.
export const colors = {
  bg: '#262525',
  card: '#2f2e2e',
  cardAlt: '#363535',
  border: '#3A3A3A',
  red: '#822626',
  redDark: '#5e1b1b',
  cream: '#E6DDBC',
  text: '#E6DDBC',
  textMuted: '#9A9A9A',
  green: '#4ade80',
  yellow: '#facc15',
}

export const spacing = (n: number) => n * 4

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
}

export const font = {
  heading: 'System', // swap for Oswald via expo-font later
  body: 'System',
}
