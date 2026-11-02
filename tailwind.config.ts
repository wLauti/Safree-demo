import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#262525',
          secondary: '#525252',
        },
        accent: {
          cream: '#E6DDBC',
        },
        red: {
          primary: '#822626',
          dark: '#690202',
        },
        text: {
          primary: '#E6DDBC',
          muted: '#9A9A9A',
        },
        border: '#3A3A3A',
      },
      fontFamily: {
        heading: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
      },
      boxShadow: {
        card: '0 4px 16px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
export default config
