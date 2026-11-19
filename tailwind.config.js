/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oren: {
          navy: '#1E2B56',
          navyDark: '#141D3B',
          teal: '#0F766E',
          deep: '#0F3D3E',
          soft: '#E7EFF0',
          surface: '#F4F7F8',
          line: '#D5DDE0',
          muted: '#4B5578',
          amber: '#A16207',
          amberBg: '#FDF3DC',
          error: '#DF3434'
        },
        chart: {
          heat: '#EA9A6E',
          water: '#8CB080',
          ccts: '#1E2B56',
          sand: '#E3C06B',
          teal: '#3F918B',
          grey: '#C8E1E3'
        }
      },
      fontFamily: {
        sans: ['Lato', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Figtree', 'Lato', 'ui-sans-serif', 'sans-serif']
      },
      borderRadius: {
        card: '20px',
        hero: '28px'
      },
      boxShadow: {
        oren: '0 8px 24px rgba(20, 29, 59, 0.06)',
        'oren-hover': '0 12px 32px rgba(20, 29, 59, 0.09)'
      }
    },
  },
  plugins: [],
}
