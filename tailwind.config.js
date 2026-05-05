/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0e27',
        primary: '#00ff88',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        surface: '#121838',
        surfaceLight: '#1e2756',
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 10px #00ff88, 0 0 20px #00ff88',
        'neon-purple': '0 0 10px #8b5cf6, 0 0 20px #8b5cf6',
      }
    },
  },
  plugins: [],
}
