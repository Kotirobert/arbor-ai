import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#E8F4ED',
          100: '#C6E3D0',
          200: '#A0CEB2',
          300: '#A7D4B8',
          400: '#3D9068',
          500: '#1B5E3B',
          600: '#154D30',
          700: '#0F3C25',
          800: '#092B1A',
          900: '#041A0F',
        },
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
      },
      height: {
        13: '52px',
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [],
}

export default config
