/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#F4F7F4',
          100: '#E6EEE7',
          200: '#CDDDCF',
          300: '#ABC5AF',
          400: '#7E9F84',
          500: '#4E7256',
          600: '#3E5C45',
          700: '#324A37',
          800: '#273A2C',
          900: '#1F2E23',
        },
        neutral: {
          bgLight: '#FAF9F6',
          surfaceLight: '#FFFFFF',
          borderLight: '#E8E7E3',
          borderSubtle: '#F0EFEA',
          textMain: '#1A1C1E',
          textMuted: '#6B6E74',
          textDim: '#9B9E8A',
          bgDark: '#121316',
          surfaceDark: '#191B1F',
          borderDark: '#282A30',
          textDark: '#EDEDEB',
          textDarkMuted: '#9598A0',
        },
        offline: {
          bg: '#FAF9F6',
          card: '#FFFFFF',
          text: '#1A1C1E',
          muted: '#6B6E74',
          border: '#E8E7E3',
          accent: '#4E7256',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
        elevated: '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
