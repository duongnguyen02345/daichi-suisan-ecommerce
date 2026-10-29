/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0E7A32',
          dark: '#0A5C25',
          darker: '#064E3B',
          light: '#16A34A',
          subtle: '#F1F8E9',
          50: '#F0FDF4',
        },
        secondary: {
          DEFAULT: '#FF9F1C',
          hover: '#F08C00',
        },
        surface: {
          bg: '#F8F9F5',
          cream: '#FFF7E9',
          card: '#FFFFFF',
          category: '#F1F8E9',
        },
        fresh: {
          price: '#E53935',
          badge: '#EF4444',
          text: '#111827',
          gray: '#6B7280',
          oldprice: '#9CA3AF',
          border: '#E5E7EB',
        },
        ds: {
          red: '#9F1D24',
          'red-dark': '#74151B',
          'red-crimson': '#8A161C',
          green: '#07583F',
          'green-light': '#13734D',
          navy: '#102F49',
          gold: '#C99B49',
          'gold-light': '#F0D99D',
          cream: '#FFF8E8',
          paper: '#F4EAD4',
          ink: '#17364A',
          muted: '#65716C',
        }
      },
      fontFamily: {
        // 1. Body font: Lora
        sans: ['"Lora"', 'Georgia', 'serif'],
        body: ['"Lora"', 'Georgia', 'serif'],
        lora: ['"Lora"', 'Georgia', 'serif'],

        // 2. Header font: Be Vietnam Pro
        header: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],
        headline: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],
        vietnam: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],

        // 3. Label font: Noto Serif JP
        label: ['"Noto Serif JP"', '"Noto Serif"', 'Georgia', 'serif'],
        grotesk: ['"Noto Serif JP"', '"Noto Serif"', 'Georgia', 'serif'],
        serif: ['"Noto Serif JP"', '"Noto Serif"', 'Georgia', 'serif'],
        jp: ['"Noto Serif JP"', '"Noto Serif"', 'Georgia', 'serif'],
        mono: ['"Noto Serif JP"', '"Noto Serif"', 'Georgia', 'serif'],
      },
      fontSize: {
        'body': ['18px', { lineHeight: '28px' }],
        'base': ['18px', { lineHeight: '28px' }],
      },
      borderRadius: {
        'sm': '8px',
        'btn': '12px',
        'card': '12px',
        'banner': '12px',
        'modal': '28px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.06)',
        'dropdown': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'modal': '0 20px 50px rgba(0, 0, 0, 0.18)',
      },
      transitionDuration: {
        'default': '250ms',
      }
    },
  },
  plugins: [],
}
