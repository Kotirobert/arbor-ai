import type { Config } from 'tailwindcss'
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'monospace'],
        serif:   ['var(--font-serif)', 'Times New Roman', 'serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper:  { DEFAULT: '#FAFAF7', 2: '#F4F3EE', 3: '#ECEAE3' },
        ink:    { DEFAULT: '#17201C', 2: '#4A5550', 3: '#8A8F88' },
        line:   { DEFAULT: '#E5E2DA', 2: '#D8D4C9' },
        'chalk-green': {
          DEFAULT: '#1B5E3B',
          soft:    '#E8F0EA',
          line:    '#BFD5C6',
        },
        amber:  { DEFAULT: '#C78A1E', soft: '#FAF1DE', line: '#E8D3A6' },
        blue:   { DEFAULT: '#3B5FAF', soft: '#E9EEF8' },
        red:    { DEFAULT: '#B5432E', soft: '#F6E4DF' },
        // Legacy aliases
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
        chalkai: {
          bg:       '#FAFAF7',
          surface:  '#F4F3EE',
          surface2: '#ECEAE3',
          surface3: '#E4E1D9',
          ink:      '#17201C',
          ink2:     '#4A5550',
          ink3:     '#8A8F88',
          amber:    '#C78A1E',
          green:    '#1B5E3B',
          blue:     '#3B5FAF',
          gold:     '#C9A84C',
        },
      },
      borderRadius: {
        xl:   '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card:    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)',
        'chalkai-glow': '0 0 0 1px rgba(199,138,30,0.2), 0 8px 32px rgba(199,138,30,0.08)',
      },
      height: { 13: '52px' },
      borderWidth: { 3: '3px' },
      backgroundImage: {
        'amber-gradient': 'linear-gradient(135deg, #C78A1E 0%, #A36A10 100%)',
        'hero-glow':      'radial-gradient(ellipse at top, rgba(199,138,30,0.08), transparent 60%)',
      },
      animation: {
        aurora: "aurora 60s linear infinite",
      },
      keyframes: {
        aurora: {
          from: { backgroundPosition: "50% 50%, 50% 50%" },
          to:   { backgroundPosition: "350% 50%, 350% 50%" },
        },
      },
    },
  },
  plugins: [addVariablesForColors],
}

function addVariablesForColors({ addBase, theme }: any) {
  const allColors = flattenColorPalette(theme("colors"));
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );
  addBase({ ":root": newVars });
}

export default config
