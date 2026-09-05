/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        surface: {
          50: '#0A0A0A',
          100: '#111111',
          200: '#171717',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#8A8A8A',
        },
        accent: '#FF5A1F',
        positive: '#22C55E',
        negative: '#EF4444',
      },
      fontFamily: {
        sans: ['Geist Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['32px', '40px'],
        '4xl': ['48px', '56px'],
        '5xl': ['64px', '72px'],
      },
      spacing: {
        gutter: '40px',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spring': 'spring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'spring': {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      backdropFilter: {
        'glass': 'blur(20px) brightness(1.1)',
      },
    },
  },
  plugins: [],
}
