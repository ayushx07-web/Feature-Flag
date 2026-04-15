/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
        primary: '#6366f1',
        primaryHover: '#818cf8',
        textMain: '#f8fafc',
        textMuted: '#94a3b8',
      }
    },
  },
  plugins: [],
}
