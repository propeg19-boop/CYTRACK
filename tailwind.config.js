/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#FDFCFA',
          100: '#FAF6F0',
          200: '#F4ECE1',
          300: '#EADFD5',
          400: '#D5C7B8',
          500: '#A89F98',
          600: '#7A6F68',
          700: '#524944',
          800: '#38302C',
          900: '#2C221E',
        },
        terracotta: {
          50: '#FDF5F2',
          100: '#FCEEE9',
          200: '#F8D5C8',
          300: '#F1B29D',
          400: '#E8825D',
          500: '#D96B43',
          600: '#C0532C',
          700: '#9B3F1F',
          800: '#7B331B',
          900: '#5A2615',
        },
        sage: {
          50: '#F4F7F3',
          100: '#E7ECE5',
          200: '#CCD8C8',
          300: '#B0C2AA',
          400: '#96AB8E',
          500: '#7D8E74',
          600: '#64725D',
          700: '#4E5A49',
        },
        mauve: {
          50: '#FAF4F7',
          100: '#F3E8EE',
          200: '#E2CCD8',
          300: '#CFAEC0',
          400: '#B98FA5',
          500: '#8F6E80',
          600: '#735565',
          700: '#583F4D',
        },
        sand: {
          50: '#FAF7F2',
          100: '#F4ECE1',
          200: '#E6D3BE',
          300: '#D4A373',
          400: '#BA8959',
          500: '#9C6F42',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(44, 34, 30, 0.05), 0 2px 6px -1px rgba(44, 34, 30, 0.03)',
        'card': '0 8px 30px -4px rgba(44, 34, 30, 0.08), 0 4px 12px -2px rgba(44, 34, 30, 0.04)',
        'glow': '0 0 25px -3px rgba(217, 107, 67, 0.25)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.92', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
