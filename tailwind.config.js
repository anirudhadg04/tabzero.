/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        offline: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          text: '#111827',
          muted: '#9CA3AF',
          border: '#E2E8F0',
          accent: '#A5B4FC',
          cyan: '#67E8F9',
          violet: '#C4B5FD',
          green: '#ECF5E4',
          blue: '#E8EBFA',
          beige: '#F0E9DF',
          teal: '#E1F0EF',
          softRed: '#FEE2E2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
