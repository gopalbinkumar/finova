/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Finova Brand Palette
        primary: {
          DEFAULT: '#08CB00',
          50: '#e8fff0',
          100: '#d1ffe1',
          200: '#a3ffc3',
          300: '#75ffa5',
          400: '#47ff87',
          500: '#08CB00',
          600: '#06a200',
          700: '#047a00',
          800: '#025100',
          900: '#012900',
        },
        brand: {
          dark:  '#253900',
          black: '#000000',
          gray:  '#EEEEEE',
        },
        // Semantic tokens
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card:       'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        border:     'var(--border)',
        muted:      'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent:     'var(--accent)',
        destructive:'var(--destructive)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
