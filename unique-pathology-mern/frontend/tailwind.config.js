/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          darkest: '#031726',
          darker: '#052944',
          dark: '#073b66',
          primary: '#0891b2',
          light: '#06b6d4',
          soft: '#ecfeff',
          surface: '#f8fafc',
          accent: '#0d9488',
        },
      },
      boxShadow: {
        soft: '0 20px 50px rgba(7, 59, 102, 0.08)',
        subtle: '0 4px 20px rgba(0, 0, 0, 0.04)',
        card: '0 10px 30px -5px rgba(7, 59, 102, 0.06)',
        floating: '0 20px 40px -10px rgba(8, 145, 178, 0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        floatSlow: 'floatSlow 6s ease-in-out infinite',
        fadeIn: 'fadeIn 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}
