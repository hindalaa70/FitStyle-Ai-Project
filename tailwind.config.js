/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0b0d',
          card: 'rgba(25, 27, 31, 0.45)',
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#ffffff',
          muted: '#8e929a',
        },
        gold: {
          DEFAULT: '#d4af37',
          hover: '#c5a02e',
          light: 'rgba(212, 175, 55, 0.15)',
        },
        rose: {
          DEFAULT: '#e95f76',
          hover: '#dc4e65',
          light: 'rgba(233, 95, 118, 0.15)',
        }
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        inter: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
