/** @type {import('tailwindcss').Config} */
// Tokens come from design.md ("Colour Palette & Tokens"). Values marked
// "not in design.md" are the only invented ones: rounded-hero radius and shadow-oren.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#151f32',
          950: '#0b1120',
        },
        oren: {
          navy: '#1E2B56',      // text / ccts
          navyDark: '#141D3B',  // textDark
          muted: '#4B5578',
          surface: '#F4F7F8',
          soft: '#E7EFF0',
          line: '#D5DDE0',
          teal: '#0F766E',      // tealAccent
          deep: '#0F3D3E',      // deepTeal, hero band
          tealAction: '#1F5F66', // end of primaryAction gradient
          error: '#DF3434',
          amber: '#A16207',
          amberBg: '#FDF3DC',
          sand: '#E3C06B',
        },
        chart: {
          heat: '#EA9A6E',
          water: '#8CB080',
          ccts: '#1E2B56',
        },
      },
      fontFamily: {
        sans: ['Lato', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Figtree', 'Lato', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',  // design.md: soft rounded cards (20px)
        hero: '28px',  // not in design.md
      },
      boxShadow: {
        oren: '0 1px 2px rgba(30, 43, 86, 0.06), 0 8px 24px rgba(30, 43, 86, 0.06)', // not in design.md
      },
    },
  },
  plugins: [],
}
