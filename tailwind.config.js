/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./src/**/*.{html,js}",
    "./**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        surface: '#18181b',
        border: '#27272a',
        primary: '#a855f7',
        primaryHover: '#9333ea'
      }
    }
  },
  plugins: [],
}