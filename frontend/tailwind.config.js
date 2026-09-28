/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme surfaces & ink
        dark: {
          canvas: '#0e0e11',
          paper: '#16161a',
          card: '#16161a',
          surface: '#18181c',
          border: '#27272e',
          borderSubtle: '#1f1f24',
          borderHover: '#3f3f46',
          ink: '#ededed',
          muted: '#a1a1aa',
          subtle: '#71717a',
        },
        // Direct surface color helpers
        canvas: {
          DEFAULT: '#0e0e11',
          light: '#faf8f5',
          dark: '#0e0e11',
        },
        paper: {
          DEFAULT: '#16161a',
          light: '#fdfbfa',
          dark: '#16161a',
        },
        border: {
          DEFAULT: '#27272e',
          light: '#d1d1cd',
          dark: '#27272e',
        },
        // Semantic aliases
        ink: {
          DEFAULT: '#ededed',
          dark: '#ededed',
          light: '#27251e',
          pure: '#ffffff',
        },
        mist: {
          DEFAULT: '#27272e',
          light: '#d1d1cd',
          dark: '#27272e',
        },
        graphite: {
          DEFAULT: '#a1a1aa',
          dark: '#a1a1aa',
          light: '#72706b',
        },
        ash: {
          DEFAULT: '#71717a',
          dark: '#71717a',
          light: '#92918b',
        },
        teal: {
          deep: '#016a71',
          glow: '#00d1b2',
        },
        // Scholar's Parchment Palette (preserved for backwards compatibility)
        parchment: {
          canvas: '#faf8f5',    // Page canvas background
          paper: '#fdfbfa',     // Elevated card surface
          mist: '#d1d1cd',      // Hairline card/input borders (1px)
          ash: '#92918b',       // Muted helper text
          graphite: '#72706b',  // Nav icons, secondary text, inactive
          ink: '#27251e',       // Primary text, filled buttons
          black: '#000000',     // Maximum weight accents
          teal: '#016a71',      // Deep Teal brand & active state
          tealLight: '#eef6f6', // Soft teal background for active pills
          tealBorder: '#bcd8da',// Subtle teal border
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'paper': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'dark-paper': '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 1px #27272e',
        'search': '0 0 0 1px #27272e, 0 2px 8px -2px rgba(0, 0, 0, 0.3)',
        'search-focus': '0 0 0 1.5px #016a71, 0 2px 12px -2px rgba(1, 106, 113, 0.25)',
      },
      borderRadius: {
        'card': '16px',
        'input': '12px',
        'btn': '6px',
        'pill': '9999px',
      },
    },
  },
  plugins: [],
};
