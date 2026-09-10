/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: '#FAF8F5',
          card: '#FFFFFF',
          dark: '#1C1917',
          muted: '#44403C',
          green: '#15803D',
          'green-dark': '#166534',
          'green-light': '#DCFCE7',
          amber: '#D97706',
          'amber-dark': '#B45309',
          'amber-light': '#FEF3C7',
          crimson: '#DC2626',
          'crimson-dark': '#991B1B',
          border: '#E7E5E4',
          'border-dark': '#D6D3D1',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'Quicksand', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        'duo-green': '0 4px 0 #166534',
        'duo-amber': '0 4px 0 #B45309',
        'duo-crimson': '0 4px 0 #991B1B',
        'duo-neutral': '0 4px 0 #D6D3D1',
      },
      keyframes: {
        tactileBounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.12)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      },
      animation: {
        'tactile-bounce': 'tactileBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
